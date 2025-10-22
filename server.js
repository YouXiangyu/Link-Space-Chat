const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
const readline = require("readline"); // Import readline for interactive prompts
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
  const privateIps = [];
  const otherIps = [];

  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(iface.address)) {
          privateIps.push(iface.address);
        } else {
          otherIps.push(iface.address);
        }
      }
    }
  }
  return privateIps[0] || otherIps[0] || "localhost";
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
        console.log(`Nickname "${name}" exists. Pinging old socket...`);
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (!oldSocket) {
          console.log("Old socket not found, allowing reclaim.");
          usersMap.delete(existingSocketId);
        } else {
          // Use the built-in timeout feature, which is much cleaner.
          const isAlive = await new Promise((resolve) => {
            oldSocket.timeout(2000).emit("server-ping", (err, pong) => {
              // If there's an error (timeout) or the response is not "ok", 
              // we consider the old socket dead.
              if (err || !pong || pong[0] !== "ok") {
                resolve(false);
              } else {
                resolve(true);
              }
            });
          });

          if (isAlive) {
            // The old user is still active.
            return ack({ ok: false, error: "该昵称已被占用" });
          } else {
            // The old user is a zombie. Reclaim the name.
            console.log("Ping timed out or failed, reclaiming nickname.");
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

let ngrokProcess = null;
const PORT = Number(process.argv[2] || process.env.PORT || 3000);

server.listen(PORT, () => {
  console.log(`本地服务运行在 http://localhost:${PORT}`);
  const lan = getLanAddress();
  console.log(`局域网访问: http://${lan}:${PORT}`);
  console.log(`房间链接格式: http://${lan}:${PORT}/r/<your-room-id>`);

  if (process.env.ENABLE_NGROK) {
    console.log("Attempting to start ngrok via child_process...");
    const ngrokPath = path.join(__dirname, "node_modules", "ngrok", "bin", "ngrok.exe");
    ngrokProcess = spawn(ngrokPath, ["http", PORT]);

    ngrokProcess.stdout.on("data", (data) => console.log(`[ngrok stdout]: ${data}`));
    ngrokProcess.stderr.on("data", (data) => console.error(`[ngrok stderr]: ${data}`));

    setTimeout(() => {
      http.get("http://127.0.0.1:4040/api/tunnels", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const tunnels = JSON.parse(data).tunnels;
            const httpsTunnel = tunnels.find((t) => t.proto === "https");
            if (httpsTunnel) {
              console.log(`\n=================================================================`);
              console.log(`  Ngrok 公网地址: ${httpsTunnel.public_url}`);
              console.log(`  房间链接示例: ${httpsTunnel.public_url}/r/your-room-id`);
              console.log(`=================================================================\n`);
            } else {
              console.error("Ngrok API 未返回 HTTPS 隧道信息。");
            }
          } catch (e) {
            console.error("解析 Ngrok API 响应失败:", e);
          }
        });
      }).on("error", (err) => {
        console.error("连接 Ngrok API 失败: ", err.message);
        console.error("请确认 ngrok 进程是否已成功启动，并且 4040 端口未被占用。");
      });
    }, 3000);
  } else {
    console.log("未开启 ngrok。如需公网访问，请在启动时添 加任意第二个参数，例如: start-chat.bat 3000 ngrok-on");
  }
});

// --- NEW: Interactive Shutdown Logic ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function gracefulShutdown(askForCleanup = false) {
  console.log("\nShutting down gracefully...");

  const cleanupAndExit = async (cleanup) => {
    if (cleanup) {
      try {
        await db.clearAllData();
      } catch (e) {
        console.error("Error clearing database:", e);
      }
    }
    if (ngrokProcess) {
      console.log("Attempting to kill ngrok process...");
      ngrokProcess.kill();
      console.log("Ngrok process killed.");
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
    await cleanupAndExit(false); // Default to not cleaning up
  }
}

process.on("SIGINT", () => gracefulShutdown(true)); // Ask on Ctrl+C
process.on("SIGTERM", () => gracefulShutdown(false)); // Don't ask on other termination signals
