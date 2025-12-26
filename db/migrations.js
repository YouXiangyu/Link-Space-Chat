// --- db/migrations.js ---
// 数据库迁移：处理数据库结构变更

/**
 * 数据库迁移脚本
 * Phase 2: 添加房间和消息的新字段
 * 使用 ALTER TABLE ADD COLUMN IF NOT EXISTS 确保向后兼容
 * @param {Object} db - SQLite数据库实例
 * @returns {Promise<void>}
 */
function migrateDatabase(db) {
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
      
      // Phase 3: 为 messages 表添加 parent_message_id 和 is_highlighted 字段
      db.run("ALTER TABLE messages ADD COLUMN parent_message_id INTEGER", (err) => {
        if (err && !err.message.includes("duplicate column") && !err.message.includes("already exists")) {
          console.warn("添加 messages.parent_message_id 字段时出现警告:", err.message);
        }
      });
      
      db.run("ALTER TABLE messages ADD COLUMN is_highlighted INTEGER DEFAULT 0", (err) => {
        if (err && !err.message.includes("duplicate column") && !err.message.includes("already exists")) {
          console.warn("添加 messages.is_highlighted 字段时出现警告:", err.message);
        }
      });
      
      // Phase 3: 为 parent_message_id 创建索引
      db.run("CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id)", (err) => {
        if (err && !err.message.includes("already exists") && !err.message.includes("duplicate")) {
          console.warn("创建 idx_messages_parent 索引时出现警告:", err.message);
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
      });
      
      // Phase 5: 创建投票相关表
      // 创建 polls 表（投票主表）
      db.run(`CREATE TABLE IF NOT EXISTS polls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        expires_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
      )`, (err) => {
        if (err && !err.message.includes("already exists")) {
          console.warn("创建 polls 表时出现警告:", err.message);
        }
      });
      
      // 创建 poll_options 表（投票选项表）
      db.run(`CREATE TABLE IF NOT EXISTS poll_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id INTEGER NOT NULL,
        option_text TEXT NOT NULL,
        option_index INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(poll_id) REFERENCES polls(id) ON DELETE CASCADE
      )`, (err) => {
        if (err && !err.message.includes("already exists")) {
          console.warn("创建 poll_options 表时出现警告:", err.message);
        }
      });
      
      // 创建 votes 表（投票记录表）
      db.run(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        option_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
        UNIQUE(option_id, session_id)
      )`, (err) => {
        if (err && !err.message.includes("already exists")) {
          console.warn("创建 votes 表时出现警告:", err.message);
        }
      });
      
      // 创建投票相关索引
      db.run("CREATE INDEX IF NOT EXISTS idx_polls_message ON polls(message_id)", (err) => {
        if (err && !err.message.includes("already exists") && !err.message.includes("duplicate")) {
          console.warn("创建 idx_polls_message 索引时出现警告:", err.message);
        }
      });
      
      db.run("CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id)", (err) => {
        if (err && !err.message.includes("already exists") && !err.message.includes("duplicate")) {
          console.warn("创建 idx_poll_options_poll 索引时出现警告:", err.message);
        }
      });
      
      db.run("CREATE INDEX IF NOT EXISTS idx_votes_option ON votes(option_id)", (err) => {
        if (err && !err.message.includes("already exists") && !err.message.includes("duplicate")) {
          console.warn("创建 idx_votes_option 索引时出现警告:", err.message);
        }
      });
      
      db.run("CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id)", (err) => {
        if (err && !err.message.includes("already exists") && !err.message.includes("duplicate")) {
          console.warn("创建 idx_votes_session 索引时出现警告:", err.message);
        }
        resolve();
      });
    });
  });
}

module.exports = {
  migrateDatabase
};

