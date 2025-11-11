const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

// SQLite 数据库文件路径（保存在项目根目录）
const dbPath = path.join(__dirname, "chat.db");
const db = new sqlite3.Database(dbPath);

// 启用 WAL 模式以提升并发性能
db.run("PRAGMA journal_mode = WAL");
// 设置同步模式为 NORMAL（WAL模式下更安全且性能更好）
db.run("PRAGMA synchronous = NORMAL");
// 设置缓存大小（10MB，提升查询性能）
db.run("PRAGMA cache_size = -10240");
// 设置临时存储为内存（提升性能）
db.run("PRAGMA temp_store = MEMORY");

/**
 * 初始化数据库表结构
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 房间表：记录房间基础信息
      db.run("CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL)", (err) => {
        if (err) return reject(err);
      });
      
      // 消息表：记录消息历史（按房间归档）
      db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room_id TEXT NOT NULL, nickname TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY(room_id) REFERENCES rooms(id))", (err) => {
        if (err) return reject(err);
      });
      
      // 优化索引：使用联合索引 (room_id, created_at) 提升查询性能
      // 这个索引可以同时优化 WHERE room_id = ? 和 ORDER BY created_at 的查询
      db.run("CREATE INDEX IF NOT EXISTS idx_messages_room_time ON messages(room_id, created_at DESC)", (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

// 初始化数据库
initializeDatabase().catch(err => {
  console.error("数据库初始化失败:", err);
  process.exit(1);
});

/**
 * 确保房间存在（若不存在则插入）
 * @param {string} roomId - 房间ID
 * @param {string} creatorSession - 创建者session ID（可选）
 * @returns {Promise<void>}
 */
function ensureRoom(roomId, creatorSession = null) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT OR IGNORE INTO rooms(id, created_at, creator_session) VALUES(?, ?, ?)",
      [roomId, Date.now(), creatorSession],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

/**
 * 获取房间信息
 * @param {string} roomId - 房间ID
 * @returns {Promise<Object|null>} 房间信息对象
 */
function getRoom(roomId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, name, description, password, creator_session as creatorSession, created_at as createdAt FROM rooms WHERE id = ?",
      [roomId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

/**
 * 更新房间信息
 * @param {string} roomId - 房间ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<void>}
 */
function updateRoom(roomId, updates) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.password !== undefined) {
      fields.push("password = ?");
      values.push(updates.password);
    }
    
    if (fields.length === 0) {
      return resolve();
    }
    
    values.push(roomId);
    db.run(
      `UPDATE rooms SET ${fields.join(", ")} WHERE id = ?`,
      values,
      (err) => (err ? reject(err) : resolve())
    );
  });
}

/**
 * 保存一条消息
 * @param {Object} params - 消息参数
 * @param {string} params.roomId - 房间ID
 * @param {string} params.nickname - 昵称
 * @param {string} params.text - 消息内容
 * @param {number} params.createdAt - 创建时间戳
 * @param {string} params.contentType - 消息类型（默认'text'）
 * @returns {Promise<Object>} 保存的消息对象
 */
function saveMessage({ roomId, nickname, text, createdAt, contentType = 'text' }) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO messages(room_id, nickname, text, created_at, content_type) VALUES(?, ?, ?, ?, ?)",
      [roomId, nickname, text, createdAt, contentType],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, roomId, nickname, text, createdAt, contentType });
      }
    );
  });
}

/**
 * 获取指定房间最近 limit 条消息（按时间升序返回）
 * 优化：只查询需要的字段，减少数据传输
 * @param {string} roomId - 房间ID
 * @param {number} limit - 消息数量限制，默认20
 * @returns {Promise<Array>} 消息列表
 */
function getRecentMessages(roomId, limit = 20) {
  return new Promise((resolve, reject) => {
    // 只查询需要的字段，减少数据传输
    db.all(
      "SELECT id, room_id as roomId, nickname, text, created_at as createdAt, content_type as contentType FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?",
      [roomId, limit],
      (err, rows) => {
        if (err) return reject(err);
        // 反转数组，使时间从旧到新
        resolve(rows.reverse());
      }
    );
  });
}

/**
 * 清理指定天数之前的消息
 * @param {number} days - 保留最近N天的消息，默认1天
 * @returns {Promise<number>} 删除的消息数量
 */
function cleanOldMessages(days = 1) {
  return new Promise((resolve, reject) => {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    db.run(
      "DELETE FROM messages WHERE created_at < ?",
      [cutoffTime],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      }
    );
  });
}

/**
 * 获取数据库统计信息
 * @returns {Promise<Object>} 统计信息对象
 */
function getDatabaseStats() {
  return new Promise((resolve, reject) => {
    const stats = {};
    
    // 获取数据库文件大小
    try {
      const stats_fs = fs.statSync(dbPath);
      stats.dbSize = stats_fs.size;
    } catch (err) {
      stats.dbSize = 0;
    }
    
    // 获取消息总数
    db.get("SELECT COUNT(*) as count FROM messages", (err, row) => {
      if (err) return reject(err);
      stats.messageCount = row.count;
      
      // 获取房间总数
      db.get("SELECT COUNT(*) as count FROM rooms", (err, row) => {
        if (err) return reject(err);
        stats.roomCount = row.count;
        
        // 获取最旧的消息时间
        db.get("SELECT MIN(created_at) as oldest FROM messages", (err, row) => {
          if (err) return reject(err);
          stats.oldestMessageTime = row.oldest || null;
          resolve(stats);
        });
      });
    });
  });
}

/**
 * 清理指定房间的历史记录
 * @param {string} roomId - 房间ID
 * @returns {Promise<void>}
 */
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
      // Commit the transaction
      db.run("COMMIT", (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

/**
 * 仅清空指定房间的消息（不删除房间）
 * @param {string} roomId
 * @returns {Promise<void>}
 */
function clearMessagesForRoom(roomId) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM messages WHERE room_id = ?", [roomId], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * 清空所有数据
 * @returns {Promise<void>}
 */
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

/**
 * 数据库迁移脚本
 * Phase 2: 添加房间和消息的新字段
 * 使用 ALTER TABLE ADD COLUMN IF NOT EXISTS 确保向后兼容
 * @returns {Promise<void>}
 */
function migrateDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Phase 2: 为 rooms 表添加新字段
      db.run("ALTER TABLE rooms ADD COLUMN name TEXT", (err) => {
        // 忽略"重复列"错误，因为字段可能已存在
        if (err && !err.message.includes("duplicate column") && !err.message.includes("already exists")) {
          console.warn("添加 rooms.name 字段时出现警告:", err.message);
        }
      });
      
      db.run("ALTER TABLE rooms ADD COLUMN description TEXT", (err) => {
        if (err && !err.message.includes("duplicate column") && !err.message.includes("already exists")) {
          console.warn("添加 rooms.description 字段时出现警告:", err.message);
        }
      });
      
      db.run("ALTER TABLE rooms ADD COLUMN password TEXT", (err) => {
        if (err && !err.message.includes("duplicate column") && !err.message.includes("already exists")) {
          console.warn("添加 rooms.password 字段时出现警告:", err.message);
        }
      });
      
      db.run("ALTER TABLE rooms ADD COLUMN creator_session TEXT", (err) => {
        if (err && !err.message.includes("duplicate column") && !err.message.includes("already exists")) {
          console.warn("添加 rooms.creator_session 字段时出现警告:", err.message);
        }
      });
      
      // Phase 2: 为 messages 表添加 content_type 字段
      db.run("ALTER TABLE messages ADD COLUMN content_type TEXT DEFAULT 'text'", (err) => {
        if (err && !err.message.includes("duplicate column") && !err.message.includes("already exists")) {
          console.warn("添加 messages.content_type 字段时出现警告:", err.message);
        }
      });
      
      // 检查并优化索引（如果索引不存在或需要更新）
      db.run("CREATE INDEX IF NOT EXISTS idx_messages_room_time ON messages(room_id, created_at DESC)", (err) => {
        if (err) {
          // 如果错误不是"索引已存在"，则拒绝
          if (!err.message.includes("already exists") && !err.message.includes("duplicate")) {
            return reject(err);
          }
        }
        resolve();
      });
    });
  });
}

/**
 * 检查数据库连接是否正常
 * @returns {Promise<boolean>}
 */
function checkConnection() {
  return new Promise((resolve) => {
    db.get("SELECT 1", (err) => {
      resolve(!err);
    });
  });
}

// 执行数据库迁移
migrateDatabase().catch(err => {
  console.error("数据库迁移失败:", err);
});

module.exports = { 
  ensureRoom, 
  getRoom,
  updateRoom,
  saveMessage, 
  getRecentMessages, 
  clearHistoryForRoom, 
  clearMessagesForRoom,
  clearAllData,
  cleanOldMessages,
  getDatabaseStats,
  checkConnection
};


