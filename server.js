// --- server.js (Phase 1: 性能优化与稳定性提升) ---

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const os = require("os");
const path = require("path");
const readline = require("readline");
const db = require("./sqlite");

const app = express();
const server = http.createServer(app);

// Socket.IO 配置优化：启用心跳检测优化
const io = new Server(server, {
  pingTimeout: 60000,      // 60秒超时
  pingInterval: 25000,     // 25秒心跳间隔
  transports: ['websocket', 'polling'], // 支持 WebSocket 和轮询
  allowEIO3: true          // 兼容旧版本客户端
});

app.use(express.json());
app.use(express.static("public"));

// ==================== 配置常量 ====================
// 消息自动清理配置（可通过环境变量配置，默认1天）
const MESSAGE_RETENTION_DAYS = Number(process.env.MESSAGE_RETENTION_DAYS || 1);
// 房间和用户列表清理延迟（断开连接后3分钟删除）
const CLEANUP_DELAY = 3 * 60 * 1000; // 3分钟
// 内存告警阈值（80%）
const MEMORY_ALERT_THRESHOLD = 0.8;
// 健康检查间隔（3分钟）
const HEALTH_CHECK_INTERVAL = 3 * 60 * 1000;
// 消息自动清理间隔（每小时执行一次）
const MESSAGE_CLEANUP_INTERVAL = 60 * 60 * 1000;
// 请求日志开关（可通过环境变量控制，默认关闭）
const ENABLE_REQUEST_LOG = process.env.ENABLE_REQUEST_LOG === 'true';
// 慢请求阈值（毫秒）
const SLOW_REQUEST_THRESHOLD = 1000;

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

// ==================== 请求日志中间件 ====================
if (ENABLE_REQUEST_LOG) {
  app.use((req, res, next) => {
    const startTime = Date.now();
    const originalEnd = res.end;
    
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      const logLevel = duration > SLOW_REQUEST_THRESHOLD ? 'SLOW' : 'INFO';
      console.log(`[${logLevel}] ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);
      originalEnd.apply(this, args);
    };
    
    next();
  });
}

// ==================== 性能监控中间件 ====================
const slowRequests = [];

app.use((req, res, next) => {
  const startTime = Date.now();
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    if (duration > SLOW_REQUEST_THRESHOLD) {
      slowRequests.push({
        method: req.method,
        path: req.path,
        duration: duration,
        timestamp: Date.now()
      });
      // 只保留最近100条慢请求记录
      if (slowRequests.length > 100) {
        slowRequests.shift();
      }
    }
    originalEnd.apply(this, args);
  };
  
  next();
});

// ==================== 增强的健康检查端点 ====================
app.get("/health", async (_req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = usedMem / totalMem;
    
    // 获取数据库统计信息
    const dbStats = await db.getDatabaseStats();
    
    // 获取连接数
    const connectionCount = io.sockets.sockets.size;
    
    // 检查数据库连接
    const dbConnected = await db.checkConnection();
    
    res.json({
      ok: true,
      timestamp: Date.now(),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        systemTotal: Math.round(totalMem / 1024 / 1024), // MB
        systemUsed: Math.round(usedMem / 1024 / 1024), // MB
        systemFree: Math.round(freeMem / 1024 / 1024), // MB
        usagePercent: Math.round(memUsagePercent * 100) / 100
      },
      connections: {
        active: connectionCount,
        rooms: roomIdToUsers.size
      },
      database: {
        connected: dbConnected,
        size: dbStats.dbSize,
        messageCount: dbStats.messageCount,
        roomCount: dbStats.roomCount,
        oldestMessageTime: dbStats.oldestMessageTime
      },
      uptime: process.uptime(),
      slowRequests: slowRequests.slice(-10) // 返回最近10条慢请求
    });
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
const roomIdToUsers = new Map();

// 消息频率限制：使用 Map 存储每个 socket 的消息时间记录（已优化）
// 数据结构：Map<socketId, Array<timestamp>>
const socketMessageTimes = new Map();
// 频率限制配置：每3秒最多发送5条消息
const RATE_LIMIT_WINDOW = 3000; // 3秒
const RATE_LIMIT_MAX = 5; // 最多5条

// 延迟清理任务：存储需要延迟清理的房间和用户信息
// 数据结构：Map<socketId, { roomId, timeout }>
const delayedCleanupTasks = new Map();

// ==================== Phase 2: 消息类型检测 ====================
/**
 * 检测消息类型（Emoji、URL等）
 * @param {string} text - 消息文本
 * @returns {string} 消息类型：'emoji', 'text'
 */
function detectContentType(text) {
  if (!text || typeof text !== 'string') return 'text';
  
  // 检测是否为纯Emoji消息（只包含Emoji和空白字符）
  // Unicode Emoji范围：U+1F300-U+1F9FF, U+2600-U+26FF, U+2700-U+27BF, U+1F600-U+1F64F等
  const emojiRegex = /^[\s\p{Emoji_Presentation}\p{Emoji}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]+$/u;
  
  // 如果消息只包含Emoji和空白字符，且至少有一个Emoji字符
  if (emojiRegex.test(text) && /[\p{Emoji_Presentation}\p{Emoji}]/u.test(text)) {
    return 'emoji';
  }
  
  return 'text';
}

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

function emitRoomUsers(roomId) {
  const usersMap = roomIdToUsers.get(roomId) || new Map();
  const users = Array.from(usersMap.values());
  io.to(roomId).emit("room_users", users);
}

/**
 * 立即从房间移除用户（不延迟）
 * @param {Object} socket - Socket.IO socket对象
 * @param {string} roomId - 房间ID
 */
function removeUserFromRoomImmediate(socket, roomId) {
  if (!roomId) return;
  const usersMap = roomIdToUsers.get(roomId);
  if (usersMap && usersMap.has(socket.id)) {
    usersMap.delete(socket.id);
    if (usersMap.size === 0) {
      roomIdToUsers.delete(roomId);
      // 房间无人后，重置房间：清空消息、置空密码与creator_session
      (async () => {
        try {
          if (typeof db.clearMessagesForRoom === 'function') {
            await db.clearMessagesForRoom(roomId);
          } else {
            await db.clearHistoryForRoom(roomId);
          }
          await db.updateRoom(roomId, { password: null, creatorSession: null });
          console.log(`Room ${roomId} reset after empty: messages cleared, password and creator reset.`);
        } catch (err) {
          console.error(`Failed to reset empty room ${roomId}:`, err);
        }
      })();
    }
    emitRoomUsers(roomId);
    console.log(`User disconnected from room ${roomId}`);
  }
}

/**
 * 延迟清理用户（断开连接后延迟3分钟删除，避免频繁创建）
 * @param {Object} socket - Socket.IO socket对象
 * @param {string} roomId - 房间ID
 */
function removeUserFromRoom(socket, roomId) {
  if (!roomId) return;
  
  // 取消之前的清理任务（如果用户重新连接）
  const existingTask = delayedCleanupTasks.get(socket.id);
  if (existingTask) {
    clearTimeout(existingTask.timeout);
    delayedCleanupTasks.delete(socket.id);
    return; // 用户重新连接，不执行清理
  }
  
  // 设置延迟清理任务
  const timeout = setTimeout(() => {
    removeUserFromRoomImmediate(socket, roomId);
    delayedCleanupTasks.delete(socket.id);
  }, CLEANUP_DELAY);
  
  delayedCleanupTasks.set(socket.id, { roomId, timeout });
}

io.on("connection", (socket) => {
  let joinedRoomId = null;
  let nickname = null;
  
  // 初始化消息时间记录
  socketMessageTimes.set(socket.id, []);
  
  // 如果用户重新连接，取消延迟清理任务
  const existingTask = delayedCleanupTasks.get(socket.id);
  if (existingTask) {
    clearTimeout(existingTask.timeout);
    delayedCleanupTasks.delete(socket.id);
  }
  
  // 清理断开连接的socket记录
  socket.on("disconnect", () => {
    socketMessageTimes.delete(socket.id);
    removeUserFromRoom(socket, joinedRoomId);
  });

  socket.on("join_room", async (payload, ack) => {
    try {
      const roomId = String(payload?.roomId || "").trim();
      const name = String(payload?.nickname || "").trim();
      const password = payload?.password || null; // Phase 2: 支持密码
      
      if (!roomId || !name) {
        return ack({ ok: false, error: "roomId 和 nickname 必填" });
      }

      // Phase 2: 检查房间密码
      const room = await db.getRoom(roomId);
      if (room && room.password) {
        // 房间有密码，需要验证
        if (!password || password !== room.password) {
          return ack({ ok: false, error: "PASSWORD_REQUIRED", message: "该房间需要密码" });
        }
      }

      const usersMap = roomIdToUsers.get(roomId) || new Map();
      let existingSocketId = null;
      for (const [socketId, nickname] of usersMap.entries()) {
        if (nickname === name) {
          existingSocketId = socketId;
          break;
        }
      }

      if (existingSocketId) {
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (!oldSocket) {
          usersMap.delete(existingSocketId);
        } else {
          const isAlive = await new Promise((resolve) => {
            oldSocket.timeout(2000).emit("server-ping", (err, pong) => {
              resolve(!err && pong === "ok");
            });
          });
          if (isAlive) {
            return ack({ ok: false, error: "该昵称已被占用" });
          } else {
            removeUserFromRoom(oldSocket, roomId);
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
      const existingTask = delayedCleanupTasks.get(socket.id);
      if (existingTask) {
        clearTimeout(existingTask.timeout);
        delayedCleanupTasks.delete(socket.id);
      }

      const newUsersMap = roomIdToUsers.get(roomId) || new Map();
      newUsersMap.set(socket.id, nickname);
      roomIdToUsers.set(roomId, newUsersMap);

      const history = await db.getRecentMessages(roomId, 20);
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
      const now = Date.now();
      const messageTimes = socketMessageTimes.get(socket.id) || [];
      
      // 清理超过时间窗口的旧记录
      const recentTimes = messageTimes.filter(time => now - time < RATE_LIMIT_WINDOW);
      
      // 检查是否超过频率限制
      if (recentTimes.length >= RATE_LIMIT_MAX) {
        return ack({ ok: false, error: "rate_limit", message: "消息发送过于频繁，请稍后再试" });
      }
      
      // 记录本次消息时间
      recentTimes.push(now);
      socketMessageTimes.set(socket.id, recentTimes);
      
      // Phase 2: 支持对象payload并透传clientId
      const incoming = typeof payload === 'string' ? { text: payload } : (payload || {});
      const textStr = String(incoming.text || "");
      const clientId = incoming.clientId || null;

      // Phase 2: 检测消息类型
      const contentType = detectContentType(textStr);
      
      const message = await db.saveMessage({
        roomId: joinedRoomId,
        nickname,
        text: textStr,
        createdAt: now,
        contentType: contentType
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

// 解析命令行参数
const args = process.argv.slice(2);
let PORT = Number(process.env.LINK_SPACE_PORT || 3000);
let enableNgrok = false;

// 检查参数：如果第一个参数是"ngrok"，启用ngrok；如果是数字，使用该端口
if (args.length > 0) {
  const firstArg = args[0].toLowerCase();
  if (firstArg === "ngrok") {
    enableNgrok = true;
    // ngrok模式下，端口可以从第二个参数获取，或使用环境变量/默认值
    if (args.length > 1 && !isNaN(Number(args[1]))) {
      PORT = Number(args[1]);
    }
  } else if (!isNaN(Number(firstArg))) {
    PORT = Number(firstArg);
  }
}

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
  
  if (memUsagePercent > MEMORY_ALERT_THRESHOLD) {
    console.warn(`[内存告警] 系统内存使用率: ${(memUsagePercent * 100).toFixed(2)}% (阈值: ${MEMORY_ALERT_THRESHOLD * 100}%)`);
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
    const deletedCount = await db.cleanOldMessages(MESSAGE_RETENTION_DAYS);
    if (deletedCount > 0) {
      console.log(`[自动清理] 已清理 ${deletedCount} 条超过 ${MESSAGE_RETENTION_DAYS} 天的消息`);
    }
  } catch (err) {
    console.error("[自动清理] 清理旧消息失败:", err);
  }
  
  // 每小时执行一次
  setTimeout(cleanupOldMessages, MESSAGE_CLEANUP_INTERVAL);
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
  setTimeout(performHealthCheck, HEALTH_CHECK_INTERVAL);
}

// ==================== 启动服务器 ====================
async function main() {
  // 确保数据库初始化与迁移完成，避免写入竞态
  if (db && typeof db.ready?.then === 'function') {
    await db.ready;
  }

  server.listen(PORT, async () => {
    console.log(`本地服务运行在 http://localhost:${PORT}`);
    const lan = getLanAddress();
    console.log(`局域网访问: http://${lan}:${PORT}`);
    console.log(`[配置] 消息保留天数: ${MESSAGE_RETENTION_DAYS} 天`);
    console.log(`[配置] 请求日志: ${ENABLE_REQUEST_LOG ? '已启用' : '已禁用'}`);

    // 如果启用ngrok
    if (enableNgrok) {
      const ngrok = require("ngrok");
      const authtoken = process.env.NGROK_AUTHTOKEN;
      
      if (!authtoken) {
        console.warn("警告: 未设置 NGROK_AUTHTOKEN 环境变量，ngrok 可能无法正常工作");
        console.warn("请设置环境变量: set NGROK_AUTHTOKEN=你的token");
      } else {
        try {
          await ngrok.authtoken(authtoken);
          const url = await ngrok.connect(PORT);
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