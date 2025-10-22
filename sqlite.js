const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// SQLite 数据库文件路径（保存在项目根目录）
const dbPath = path.join(__dirname, "chat.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 房间表：记录房间基础信息
  db.run("CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL)");
  // 消息表：记录消息历史（按房间归档）
  db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room_id TEXT NOT NULL, nickname TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY(room_id) REFERENCES rooms(id))");
  // 索引：按房间与时间查询最近消息
  db.run("CREATE INDEX IF NOT EXISTS idx_messages_room_time ON messages(room_id, created_at)");
});

// 确保房间存在（若不存在则插入）
function ensureRoom(roomId) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT OR IGNORE INTO rooms(id, created_at) VALUES(?, ?)",
      [roomId, Date.now()],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// 保存一条消息
function saveMessage({ roomId, nickname, text, createdAt }) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO messages(room_id, nickname, text, created_at) VALUES(?, ?, ?, ?)",
      [roomId, nickname, text, createdAt],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, roomId, nickname, text, createdAt });
      }
    );
  });
}

// 获取指定房间最近 limit 条消息（按时间升序返回）
function getRecentMessages(roomId, limit = 20) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT id, room_id as roomId, nickname, text, created_at as createdAt FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?",
      [roomId, limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows.reverse());
      }
    );
  });
}

function clearHistoryForRoom(roomId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Begin a transaction
      db.run("BEGIN TRANSACTION");
      // Delete messages for the given room
      db.run("DELETE FROM messages WHERE room_id = ?", [roomId], function (err) {
        if (err) {
          db.run("ROLLBACK");
          return reject(err);
        }
      });
      // Delete the room itself
      db.run("DELETE FROM rooms WHERE id = ?", [roomId], function (err) {
        if (err) {
          db.run("ROLLBACK");
          return reject(err);
        }
      });
      // Commit the transaction
      db.run("COMMIT", (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

function clearAllData() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("DELETE FROM messages", [], function (err) {
        if (err) {
          db.run("ROLLBACK");
          return reject(err);
        }
      });
      db.run("DELETE FROM rooms", [], function (err) {
        if (err) {
          db.run("ROLLBACK");
          return reject(err);
        }
      });
      db.run("COMMIT", (err) => {
        if (err) return reject(err);
        console.log("All chat history has been cleared.");
        resolve();
      });
    });
  });
}

module.exports = { ensureRoom, saveMessage, getRecentMessages, clearHistoryForRoom, clearAllData };


