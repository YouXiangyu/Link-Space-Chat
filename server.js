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

const app = express();
const server = http.createServer(app);

// Socket.IO 配置优化：启用心跳检测优化
const io = new Server(server, config.socket);

app.use(express.json());
app.use(express.static("public"));

// ==================== 配置常量 ====================
// 所有配置项已移至 config/index.js，通过 config 对象访问

// ==================== 错误处理统一格式 ====================
/**
 * 统一错误响应格式
 * @param {Object} res - Express响应对象
 * @param {number} statusCode - HTTP状态码
 * @param {string} errorCode - 错误码
 * @param {string} message - 错误消息
 */
function sendError(res, statusCode, errorCode, message) {
  res.status(statusCode).json({
    ok: false,
    error: errorCode,
    message: message
  });
}

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
    sendError(res, 500, 'HEALTH_CHECK_ERROR', String(e));
  }
});

app.get("/api/rooms/:roomId/messages", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    if (limit < 1 || limit > 100) {
      return sendError(res, 400, 'INVALID_LIMIT', 'limit 必须在 1-100 之间');
    }
    const messages = await db.getRecentMessages(req.params.roomId, limit);
    res.json({ ok: true, messages });
  } catch (e) {
    sendError(res, 500, 'FETCH_MESSAGES_ERROR', String(e));
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

// 以下代码已移至socket模块，保留注释供参考
/*
io.on("connection", (socket) => {
  let joinedRoomId = null;
  let nickname = null;
  
  // 初始化消息时间记录
  rateLimiter.initSocket(socket.id);
  
  // 如果用户重新连接，取消延迟清理任务
  roomState.cancelRemoval(socket.id);
  
  // 清理断开连接的socket记录
  socket.on("disconnect", () => {
    rateLimiter.cleanupSocket(socket.id);
    // 选择C：空房立即重置，断开时立即清理用户与房间
    removeUserFromRoomImmediate(socket, joinedRoomId);
  });

  socket.on("join_room", async (payload, ack) => {
    try {
      const roomId = String(payload?.roomId || "").trim();
      const name = String(payload?.nickname || "").trim();
      const password = payload?.password || null; // Phase 2: 支持密码
      
      if (!roomId || !name) {
        return ack({ ok: false, error: "roomId 和 nickname 必填" });
      }

      // 获取当前内存中的房间在线用户映射
      const usersMap = roomState.getUsersMap(roomId);

      // Phase 2: 检查房间密码（考虑"空房即重置"的业务规则）
      let room = await db.getRoom(roomId);
      if (room) {
        // 如果房间存在且当前在线用户为0（包括服务重启后的空映射），按照业务约定重置房间状态
        const userCount = usersMap ? usersMap.size : 0;
        if (userCount === 0 && (room.password || room.creatorSession)) {
          // 清空消息 + 清空密码与创建者
          if (typeof db.clearMessagesForRoom === 'function') {
            await db.clearMessagesForRoom(roomId);
          } else {
            await db.clearHistoryForRoom(roomId);
          }
          await db.updateRoom(roomId, { password: null, creatorSession: null });
          // 重新读取房间信息（已清空密码）
          room = await db.getRoom(roomId);
        }
        // 若仍有密码（非空房情况），则按正常逻辑验证密码
        if (room.password) {
          if (!password || password !== room.password) {
            return ack({ ok: false, error: "PASSWORD_REQUIRED", message: "该房间需要密码" });
          }
        }
      }

      // 检查昵称是否已被占用
      let existingSocketId = roomState.findSocketIdByNickname(roomId, name);

      if (existingSocketId) {
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (!oldSocket) {
          // Socket不存在，从房间状态中移除（通过removeUserImmediate）
          roomState.removeUserImmediate(existingSocketId, roomId, db);
        } else {
          const isAlive = await new Promise((resolve) => {
            oldSocket.timeout(2000).emit("server-ping", (err, pong) => {
              resolve(!err && pong === "ok");
            });
          });
          if (isAlive) {
            return ack({ ok: false, error: "该昵称已被占用" });
          } else {
            // 选择C：立即清理旧连接，避免残留
            removeUserFromRoomImmediate(oldSocket, roomId);
            oldSocket.disconnect(true);
          }
        }
      }

      // Phase 2: 如果房间不存在，创建时记录创建者
      const existingRoom = await db.getRoom(roomId);
      if (!existingRoom) {
        await db.ensureRoom(roomId, socket.id);
      } else if (!existingRoom.creatorSession) {
        // 如果房间存在但没有创建者，设置当前用户为创建者
        await db.updateRoom(roomId, { creatorSession: socket.id });
      }

      await socket.join(roomId);
      joinedRoomId = roomId;
      nickname = name;

      // 如果用户重新连接，取消之前的清理任务
      roomState.cancelRemoval(socket.id);

      // 添加用户到房间
      roomState.addUser(roomId, socket.id, nickname);

      const history = await messageService.getRecentMessages(db, roomId, 20);
      const roomInfo = await db.getRoom(roomId);
      // Phase 2: 添加isCreator字段
      const roomInfoWithCreator = roomInfo ? {
        ...roomInfo,
        isCreator: roomInfo.creatorSession === socket.id
      } : { id: roomId, isCreator: false };
      socket.emit("history", history);
      socket.emit("room_info", roomInfoWithCreator); // Phase 2: 发送房间信息
      emitRoomUsers(roomId);
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: 'JOIN_ROOM_ERROR', message: String(e) });
    }
  });

  socket.on("leave_room", () => {
    // 主动离开房间时立即清理
    removeUserFromRoomImmediate(socket, joinedRoomId);
    joinedRoomId = null;
    nickname = null;
  });

  socket.on("chat_message", async (payload, ack) => {
    try {
      if (!joinedRoomId || !nickname) return;
      
      // 消息频率限制检查
      const rateLimitResult = rateLimiter.checkRateLimit(socket.id);
      if (!rateLimitResult.allowed) {
        return ack({ ok: false, error: "rate_limit", message: rateLimitResult.message });
      }
      
      // Phase 2: 支持对象payload并透传clientId
      const incoming = typeof payload === 'string' ? { text: payload } : (payload || {});
      const textStr = String(incoming.text || "");
      const clientId = incoming.clientId || null;
      // Phase 3: 支持 parentMessageId 和 isHighlighted
      const parentMessageId = incoming.parentMessageId || null;
      const isHighlighted = incoming.isHighlighted || false;

      // 处理并保存消息
      const now = Date.now();
      const message = await messageService.saveMessage({
        db,
        roomId: joinedRoomId,
        nickname,
        text: textStr,
        createdAt: now,
        parentMessageId,
        isHighlighted
      });
      
      // 将clientId一并回传用于前端平滑替换
      const out = clientId ? { ...message, clientId } : message;
      io.to(joinedRoomId).emit("chat_message", out);
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: 'SEND_MESSAGE_ERROR', message: String(e) });
    }
  });

  // Phase 2: 房间信息管理事件
  socket.on("get_room_info", async (payload, ack) => {
    try {
      if (!joinedRoomId) {
        return ack({ ok: false, error: "未加入房间" });
      }
      const room = await db.getRoom(joinedRoomId);
      const roomWithCreator = room ? {
        ...room,
        isCreator: room.creatorSession === socket.id
      } : { id: joinedRoomId, isCreator: false };
      ack({ ok: true, room: roomWithCreator });
    } catch (e) {
      ack({ ok: false, error: 'GET_ROOM_INFO_ERROR', message: String(e) });
    }
  });

  socket.on("update_room", async (payload, ack) => {
    try {
      if (!joinedRoomId) {
        return ack({ ok: false, error: "未加入房间" });
      }

      // 检查是否为默认房间（不能设置密码）
      if (joinedRoomId === "1" && payload.password !== undefined && payload.password !== null) {
        return ack({ ok: false, error: "默认房间不能设置密码" });
      }

      // 检查创建者权限
      const room = await db.getRoom(joinedRoomId);
      if (!room || room.creatorSession !== socket.id) {
        return ack({ ok: false, error: "只有房间创建者可以修改房间信息" });
      }

      const updates = {};
      if (payload.name !== undefined) {
        updates.name = String(payload.name || "").trim() || null;
      }
      if (payload.description !== undefined) {
        updates.description = String(payload.description || "").trim() || null;
      }
      if (payload.password !== undefined) {
        const password = String(payload.password || "").trim();
        updates.password = password || null; // 空字符串转为null（取消密码）
      }

      await db.updateRoom(joinedRoomId, updates);

      // 如果修改了密码，仅清空该房间消息并通知所有用户（不删除房间，保留元数据与密码）
      if (payload.password !== undefined) {
        if (typeof db.clearMessagesForRoom === 'function') {
          await db.clearMessagesForRoom(joinedRoomId);
        } else {
          // 兼容旧方法（将会删除房间，不推荐）
          await db.clearHistoryForRoom(joinedRoomId);
        }
        io.to(joinedRoomId).emit("room_refresh", { message: "房间密码已更改，聊天记录已清空" });
      }

      const updatedRoom = await db.getRoom(joinedRoomId);
      const roomWithCreator = updatedRoom ? {
        ...updatedRoom,
        isCreator: updatedRoom.creatorSession === socket.id
      } : { id: joinedRoomId, isCreator: false };
      io.to(joinedRoomId).emit("room_info", roomWithCreator);
      ack({ ok: true, room: roomWithCreator });
    } catch (e) {
      ack({ ok: false, error: 'UPDATE_ROOM_ERROR', message: String(e) });
    }
  });

});
*/

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