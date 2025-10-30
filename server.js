// --- server.js (修改后，已移除 Ngrok) ---

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
      const message = await db.saveMessage({
        roomId: joinedRoomId,
        nickname,
        text: String(text || ""),
        createdAt: Date.now(),
      });
      io.to(joinedRoomId).emit("chat_message", message);
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: String(e) });
    }
  });

  socket.on("disconnect", () => {
    removeUserFromRoom(socket, joinedRoomId);
  });
});

const PORT = Number(process.argv[2] || process.env.LINK_SPACE_PORT || 3000);

server.listen(PORT, () => {
  console.log(`本地服务运行在 http://localhost:${PORT}`);
  const lan = getLanAddress();
  console.log(`局域网访问: http://${lan}:${PORT}`);

  // ---- 这里是修改过的部分 ----
  console.log("服务已启动，请通过宝塔面板设置的反向代理域名进行访问。");
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