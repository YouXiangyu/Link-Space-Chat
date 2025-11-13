// --- server.js (Phase 1: 性能优化与稳定性提升) ---

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

const app = express();
const server = http.createServer(app);

// Socket.IO 配置优化：启用心跳检测优化
const io = new Server(server, config.socket);

app.use(express.json());
app.use(express.static("public"));

// ==================== 配置常量 ====================
// 所有配置项已移至 config/index.js，通过 config 对象访问

// ==================== 错误处理统一格式 ====================
// 错误处理已移至 utils/errors.js

// ==================== 中间件配置 ====================
// 请求日志中间件（可选，通过配置控制）
if (config.log.enableRequestLog) {
  app.use(requestLogger());
}

// 慢请求监控中间件（始终启用，供健康检查使用）
app.use(slowRequestTracker());

// ==================== 增强的健康检查端点 ====================
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

app.get("/api/rooms/:roomId/messages", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    if (limit < 1 || limit > 100) {
      return sendError(res, 400, ErrorCodes.INVALID_LIMIT, 'limit 必须在 1-100 之间');
    }
    const messages = await db.getRecentMessages(req.params.roomId, limit);
    res.json({ ok: true, messages });
  } catch (e) {
    sendError(res, 500, ErrorCodes.FETCH_MESSAGES_ERROR, String(e));
  }
});

app.get(["/", "/r/:roomId"], (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==================== 内存数据结构 ====================
// 房间状态管理已移至 services/roomState.js
// 消息频率限制已移至 services/rateLimiter.js
// 消息类型检测和高亮检测已移至 services/messageService.js

function getLanAddress() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Socket事件处理已移至 socket/index.js 和 socket/handlers/*.js
// 注册所有Socket事件处理器
registerSocketHandlers({
  io,
  roomState,
  rateLimiter,
  messageService,
  db
});

// 端口和 ngrok 配置已移至 config/index.js

// ==================== 内存监控和告警 ====================
/**
 * 检查内存使用率并告警
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
  
  // 每5分钟检查一次内存
  setTimeout(checkMemoryUsage, 5 * 60 * 1000);
}

// ==================== 消息自动清理定时任务 ====================
/**
 * 定期清理旧消息
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

// ==================== 健康检查定期自检 ====================
/**
 * 定期检查数据库连接
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
async function main() {
  // 确保数据库初始化与迁移完成，避免写入竞态
  if (db && typeof db.ready?.then === 'function') {
    await db.ready;
  }

  server.listen(config.server.port, async () => {
    console.log(`本地服务运行在 http://localhost:${config.server.port}`);
    const lan = getLanAddress();
    console.log(`局域网访问: http://${lan}:${config.server.port}`);
    console.log(`[配置] 消息保留天数: ${config.message.retentionDays} 天`);
    console.log(`[配置] 请求日志: ${config.log.enableRequestLog ? '已启用' : '已禁用'}`);

    // 如果启用ngrok
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

process.on("SIGINT", () => gracefulShutdown(true));
process.on("SIGTERM", () => gracefulShutdown(false));