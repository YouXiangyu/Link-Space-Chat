// --- server.js (支持 Ngrok 和消息频率限制) ---

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const os = require("os");
const path = require("path");
const readline = require("readline");
const db = require("./sqlite");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/rooms/:roomId/messages", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const messages = await db.getRecentMessages(req.params.roomId, limit);
    res.json({ messages });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get(["/", "/r/:roomId"], (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const roomIdToUsers = new Map();

// 消息频率限制：每个socket的消息发送时间记录
const socketMessageTimes = new Map();
// 频率限制配置：每3秒最多发送5条消息
const RATE_LIMIT_WINDOW = 3000; // 3秒
const RATE_LIMIT_MAX = 5; // 最多5条

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

function removeUserFromRoom(socket, roomId) {
  if (!roomId) return;
  const usersMap = roomIdToUsers.get(roomId);
  if (usersMap && usersMap.has(socket.id)) {
    usersMap.delete(socket.id);
    if (usersMap.size === 0) {
      roomIdToUsers.delete(roomId);
      db.clearHistoryForRoom(roomId)
        .then(() => console.log(`History for empty room ${roomId} cleared.`))
        .catch(err => console.error(`Failed to clear history for room ${roomId}:`, err));
    }
    emitRoomUsers(roomId);
    console.log(`User disconnected from room ${roomId}`);
  }
}

io.on("connection", (socket) => {
  let joinedRoomId = null;
  let nickname = null;
  
  // 初始化消息时间记录
  socketMessageTimes.set(socket.id, []);
  
  // 清理断开连接的socket记录
  socket.on("disconnect", () => {
    socketMessageTimes.delete(socket.id);
    removeUserFromRoom(socket, joinedRoomId);
  });

  socket.on("join_room", async (payload, ack) => {
    try {
      const roomId = String(payload?.roomId || "").trim();
      const name = String(payload?.nickname || "").trim();
      if (!roomId || !name) {
        return ack({ ok: false, error: "roomId 和 nickname 必填" });
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
              resolve(!(err || !pong || pong[0] !== "ok"));
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

      await db.ensureRoom(roomId);
      await socket.join(roomId);
      joinedRoomId = roomId;
      nickname = name;

      const newUsersMap = roomIdToUsers.get(roomId) || new Map();
      newUsersMap.set(socket.id, nickname);
      roomIdToUsers.set(roomId, newUsersMap);

      const history = await db.getRecentMessages(roomId, 20);
      socket.emit("history", history);
      emitRoomUsers(roomId);
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: String(e) });
    }
  });

  socket.on("leave_room", () => {
    removeUserFromRoom(socket, joinedRoomId);
    joinedRoomId = null;
    nickname = null;
  });

  socket.on("chat_message", async (text, ack) => {
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
      
      const message = await db.saveMessage({
        roomId: joinedRoomId,
        nickname,
        text: String(text || ""),
        createdAt: now,
      });
      io.to(joinedRoomId).emit("chat_message", message);
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: String(e) });
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

server.listen(PORT, async () => {
  console.log(`本地服务运行在 http://localhost:${PORT}`);
  const lan = getLanAddress();
  console.log(`局域网访问: http://${lan}:${PORT}`);

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