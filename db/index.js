// --- db/index.js ---
// 数据库模块主入口：暴露统一接口和ready

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// SQLite 数据库文件路径（保存在项目根目录）
const dbPath = path.join(__dirname, "..", "chat.db");
const db = new sqlite3.Database(dbPath);

// 启用 WAL 模式以提升并发性能
db.run("PRAGMA journal_mode = WAL");
// 设置同步模式为 NORMAL（WAL模式下更安全且性能更好）
db.run("PRAGMA synchronous = NORMAL");
// 设置缓存大小（10MB，提升查询性能）
db.run("PRAGMA cache_size = -10240");
// 设置临时存储为内存（提升性能）
db.run("PRAGMA temp_store = MEMORY");

const migrations = require("./migrations");
const rooms = require("./rooms");
const messages = require("./messages");
const stats = require("./stats");

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

// 初始化与迁移准备（导出为 ready，供外部 await，防止迁移与写入竞态）
const ready = (async () => {
  try {
    await initializeDatabase();
    await migrations.migrateDatabase(db);
  } catch (err) {
    console.error("数据库初始化/迁移失败:", err);
    process.exit(1);
  }
})();

// 导出统一接口
module.exports = {
  ready,
  // 房间相关操作
  ensureRoom: (roomId, creatorSession) => rooms.ensureRoom(db, roomId, creatorSession),
  getRoom: (roomId) => rooms.getRoom(db, roomId),
  updateRoom: (roomId, updates) => rooms.updateRoom(db, roomId, updates),
  // 消息相关操作
  saveMessage: (params) => messages.saveMessage(db, params),
  getRecentMessages: (roomId, limit) => messages.getRecentMessages(db, roomId, limit),
  cleanOldMessages: (days) => messages.cleanOldMessages(db, days),
  clearHistoryForRoom: (roomId) => messages.clearHistoryForRoom(db, roomId),
  clearMessagesForRoom: (roomId) => messages.clearMessagesForRoom(db, roomId),
  clearAllData: () => messages.clearAllData(db),
  // 统计相关操作
  getDatabaseStats: () => stats.getDatabaseStats(db, dbPath),
  checkConnection: () => stats.checkConnection(db)
};

