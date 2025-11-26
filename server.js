/**
 * 服务器主入口文件
 * 
 * 这个文件是整个聊天应用的服务器端入口，负责：
 * 1. 启动 HTTP 服务器和 Socket.IO 实时通信服务
 * 2. 配置路由和中间件
 * 3. 注册 Socket.IO 事件处理器
 * 4. 启动定时任务（内存监控、消息清理、健康检查）
 * 
 * Socket.IO 是什么？
 * Socket.IO 是一个实时通信库，它允许浏览器和服务器之间建立双向通信连接。
 * 与传统的 HTTP 请求（浏览器发起，服务器响应）不同，Socket.IO 可以：
 * - 服务器主动向浏览器推送消息（如新消息通知）
 * - 浏览器和服务器之间保持长连接，无需每次请求都建立新连接
 * - 自动处理网络断开和重连
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const os = require("os");
const path = require("path");
const readline = require("readline");
const db = require("./db");
const config = require("./config");
const requestLogger = require("./middlewares/requestLogger");
const { slowRequestTracker, getSlowRequests } = require("./middlewares/slowRequestTracker");
const { buildHealthSnapshot } = require("./services/healthReporter");
const roomState = require("./services/roomState");
const rateLimiter = require("./services/rateLimiter");
const messageService = require("./services/messageService");
const { registerSocketHandlers } = require("./socket");
const { ErrorCodes, sendError } = require("./utils/errors");

// 创建 Express 应用和 HTTP 服务器
// Express 是一个 Web 框架，用于处理 HTTP 请求（如访问网页、API 调用等）
const app = express();
const server = http.createServer(app);

// 创建 Socket.IO 服务器实例
// Socket.IO 建立在 HTTP 服务器之上，用于处理实时通信（如聊天消息）
// config.socket 包含 Socket.IO 的配置（心跳间隔、超时时间等）
const io = new Server(server, config.socket);

// 配置 Express 中间件
// 中间件是处理请求的函数，在请求到达路由处理函数之前执行

// express.json() 用于解析 JSON 格式的请求体（如 POST 请求中的 JSON 数据）
app.use(express.json());

// express.static() 用于提供静态文件服务（如 HTML、CSS、JavaScript 文件）
// "public" 目录下的文件可以通过浏览器直接访问
// 例如：http://localhost:3000/index.html 会返回 public/index.html 文件
app.use(express.static("public"));

// 请求日志中间件（可选，通过环境变量 ENABLE_REQUEST_LOG 控制）
// 如果启用，会记录每个 HTTP 请求的详细信息（请求路径、方法、响应时间等）
// 用于调试和监控，生产环境可以关闭以提升性能
if (config.log.enableRequestLog) {
  app.use(requestLogger());
}

// 慢请求监控中间件（始终启用）
// 记录处理时间超过 1 秒的请求，用于性能分析和优化
app.use(slowRequestTracker());

// ==================== HTTP 路由配置 ====================

/**
 * 健康检查端点
 * 访问 http://localhost:3000/health 可以查看服务器的健康状态
 * 返回信息包括：内存使用情况、连接数、数据库统计、慢请求记录等
 * 用于监控服务器运行状态
 */
app.get("/health", async (_req, res) => {
  try {
    const snapshot = await buildHealthSnapshot({
      io,
      db,
      getSlowRequests,
      roomState: roomState.getSnapshot()
    });
    res.json(snapshot);
  } catch (e) {
    sendError(res, 500, ErrorCodes.HEALTH_CHECK_ERROR, String(e));
  }
});

/**
 * 获取房间历史消息的 API 端点
 * 访问示例：http://localhost:3000/api/rooms/test/messages?limit=20
 * 用于通过 HTTP 请求获取某个房间的历史消息（不常用，主要用于调试）
 * 正常情况下，历史消息通过 Socket.IO 的 history 事件获取
 */
// 历史消息查询已统一使用 Socket.IO 的 history 事件，不再需要 REST API 端点
// 如需手动刷新历史消息，可以通过 Socket 事件请求

/**
 * 主页路由
 * 访问 http://localhost:3000/ 或 http://localhost:3000/r/房间ID 都会返回前端页面
 * 前端页面是一个单页应用（SPA），所有路由都由前端 JavaScript 处理
 */
app.get(["/", "/r/:roomId"], (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * 获取本机局域网 IP 地址
 * 用于在控制台显示局域网访问地址（如 http://192.168.1.100:3000）
 * 这样同一局域网内的其他设备可以通过这个地址访问聊天室
 * 
 * @returns {string} 局域网 IP 地址，如果找不到则返回 "localhost"
 */
function getLanAddress() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      // 查找 IPv4 地址，且不是内部地址（如 127.0.0.1）
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// ==================== Socket.IO 事件处理器注册 ====================
// 注册所有 Socket.IO 事件处理器
// 当客户端通过 Socket.IO 连接后，可以发送各种事件（如 join_room、chat_message）
// 这些事件的处理逻辑都在 socket/handlers/ 目录下的文件中
registerSocketHandlers({
  io,
  roomState,
  rateLimiter,
  messageService,
  db
});

// ==================== 定时任务 ====================

/**
 * 内存使用监控和告警
 * 定期检查服务器内存使用情况，如果超过阈值（默认80%）则输出警告
 * 用于及时发现内存泄漏或资源占用过高的问题
 */
function checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = usedMem / totalMem;
  
  if (memUsagePercent > config.monitor.memoryAlertThreshold) {
    console.warn(`[内存告警] 系统内存使用率: ${(memUsagePercent * 100).toFixed(2)}% (阈值: ${config.monitor.memoryAlertThreshold * 100}%)`);
    console.warn(`[内存告警] 堆内存使用: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
  }
  
  // 每5分钟检查一次内存（使用 setTimeout 实现定时任务）
  setTimeout(checkMemoryUsage, 5 * 60 * 1000);
}

/**
 * 消息自动清理定时任务
 * 定期清理超过保留天数的旧消息，避免数据库文件过大
 * 保留天数可通过环境变量 MESSAGE_RETENTION_DAYS 配置（默认1天）
 */
async function cleanupOldMessages() {
  try {
    const deletedCount = await db.cleanOldMessages(config.message.retentionDays);
    if (deletedCount > 0) {
      console.log(`[自动清理] 已清理 ${deletedCount} 条超过 ${config.message.retentionDays} 天的消息`);
    }
  } catch (err) {
    console.error("[自动清理] 清理旧消息失败:", err);
  }
  
  // 每小时执行一次
  setTimeout(cleanupOldMessages, config.message.cleanupInterval);
}

/**
 * 健康检查定期自检
 * 定期检查数据库连接是否正常，用于及时发现数据库问题
 */
async function performHealthCheck() {
  try {
    const dbConnected = await db.checkConnection();
    if (!dbConnected) {
      console.error("[健康检查] 数据库连接异常");
    }
  } catch (err) {
    console.error("[健康检查] 健康检查失败:", err);
  }
  
  // 每3分钟检查一次
  setTimeout(performHealthCheck, config.monitor.healthCheckInterval);
}

// ==================== 启动服务器 ====================

/**
 * 服务器启动主函数
 * 1. 等待数据库初始化完成（创建表、执行迁移）
 * 2. 启动 HTTP 服务器监听指定端口
 * 3. 配置 ngrok（如果启用）
 * 4. 启动定时任务
 */
async function main() {
  // 确保数据库初始化与迁移完成，避免在数据库未准备好时写入数据
  if (db && typeof db.ready?.then === 'function') {
    await db.ready;
  }

  // 启动 HTTP 服务器，监听指定端口
  server.listen(config.server.port, async () => {
    console.log(`本地服务运行在 http://localhost:${config.server.port}`);
    const lan = getLanAddress();
    console.log(`局域网访问: http://${lan}:${config.server.port}`);
    console.log(`[配置] 消息保留天数: ${config.message.retentionDays} 天`);
    console.log(`[配置] 请求日志: ${config.log.enableRequestLog ? '已启用' : '已禁用'}`);

    // 如果启用 ngrok（用于将本地服务暴露到公网）
    // ngrok 是一个内网穿透工具，可以让外网用户访问你的本地服务器
    // 使用场景：想让不在同一局域网的朋友访问你的聊天室
    if (config.server.enableNgrok) {
      const ngrok = require("ngrok");
      const authtoken = config.server.ngrokAuthtoken;
      
      if (!authtoken) {
        console.warn("警告: 未设置 NGROK_AUTHTOKEN 环境变量，ngrok 可能无法正常工作");
        console.warn("请设置环境变量: set NGROK_AUTHTOKEN=你的token");
      } else {
        try {
          await ngrok.authtoken(authtoken);
          const url = await ngrok.connect(config.server.port);
          console.log(`\n公网访问地址: ${url}`);
          console.log("ngrok 已启动，服务已暴露到公网\n");
        } catch (err) {
          console.error("ngrok 启动失败:", err.message);
          console.log("服务已启动，但未启用 ngrok");
        }
      }
    } else {
      console.log("服务已启动（未启用 ngrok）");
    }
    
    // 启动定时任务
    console.log("\n[定时任务] 已启动以下定时任务:");
    console.log("  - 内存监控: 每5分钟检查一次");
    console.log("  - 消息清理: 每小时执行一次");
    console.log("  - 健康检查: 每3分钟执行一次\n");
    
    // 启动内存监控
    checkMemoryUsage();
    
    // 启动消息自动清理（延迟1分钟后首次执行，避免启动时立即清理）
    setTimeout(cleanupOldMessages, 60 * 1000);
    
    // 启动健康检查（延迟30秒后首次执行）
    setTimeout(performHealthCheck, 30 * 1000);
  });
}

main().catch((err) => {
  console.error("服务启动失败:", err);
  process.exit(1);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * 优雅关闭服务器
 * 当用户按 Ctrl+C 或系统发送关闭信号时，执行清理工作后退出
 * 
 * @param {boolean} askForCleanup - 是否询问用户是否清空所有聊天记录
 */
let isShuttingDown = false;
async function gracefulShutdown(askForCleanup = false) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("\nShutting down gracefully...");
  const cleanupAndExit = async (cleanup) => {
    if (cleanup) {
      try {
        await db.clearAllData();
      } catch (e) {
        console.error("Error clearing database:", e);
      }
    }
    console.log("Exiting main process.");
    process.exit(0);
  };

  if (askForCleanup) {
    rl.question("是否清空所有聊天记录? (y/n) ", async (answer) => {
      const shouldCleanup = answer.toLowerCase() === "y";
      rl.close();
      await cleanupAndExit(shouldCleanup);
    });
  } else {
    await cleanupAndExit(false);
  }
}

// 监听系统关闭信号
// SIGINT: 用户按 Ctrl+C 时触发
// SIGTERM: 系统发送终止信号时触发（如使用 PM2 停止进程）
process.on("SIGINT", () => gracefulShutdown(true));
process.on("SIGTERM", () => gracefulShutdown(false));