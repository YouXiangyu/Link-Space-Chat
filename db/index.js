/**
 * 数据库模块主入口
 * 
 * 这个文件负责：
 * 1. 创建和配置 SQLite 数据库连接
 * 2. 初始化数据库表结构（rooms 表和 messages 表）
 * 3. 执行数据库迁移（添加新字段、创建索引等）
 * 4. 导出统一的数据库操作接口
 * 
 * SQLite 是什么？
 * SQLite 是一个轻量级的文件数据库，不需要单独的数据库服务器。
 * 所有数据都存储在一个文件中（chat.db），非常适合小型应用。
 * 
 * WAL 模式是什么？
 * WAL (Write-Ahead Logging) 是 SQLite 的一种日志模式，可以：
 * - 提升并发性能（多个连接可以同时读取和写入）
 * - 减少数据库锁定时间
 * - 提升写入速度
 */

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// SQLite 数据库文件路径（保存在项目根目录，文件名为 chat.db）
const dbPath = path.join(__dirname, "..", "chat.db");
const db = new sqlite3.Database(dbPath);

// 配置数据库性能参数
// 这些 PRAGMA 语句用于优化 SQLite 的性能和并发能力

// 启用 WAL 模式以提升并发性能（多个用户同时读写时不会互相阻塞）
db.run("PRAGMA journal_mode = WAL");

// 设置同步模式为 NORMAL（WAL 模式下更安全且性能更好）
// NORMAL 模式：在关键时刻同步，平衡了安全性和性能
db.run("PRAGMA synchronous = NORMAL");

// 设置缓存大小（10MB，提升查询性能）
// 负数表示以 KB 为单位，-10240 表示 10MB
db.run("PRAGMA cache_size = -10240");

// 设置临时存储为内存（提升性能）
// 临时数据（如排序、连接等）存储在内存中，而不是磁盘
db.run("PRAGMA temp_store = MEMORY");

const migrations = require("./migrations");
const rooms = require("./rooms");
const messages = require("./messages");
const stats = require("./stats");

/**
 * 初始化数据库表结构
 * 
 * 创建两个主要的数据表：
 * 1. rooms 表：存储房间信息（ID、名称、描述、密码、创建者等）
 * 2. messages 表：存储所有聊天消息（房间ID、昵称、内容、时间等）
 * 
 * 索引说明：
 * - idx_messages_room_time：联合索引，用于快速查询某个房间的消息并按时间排序
 *   这个索引可以同时优化以下查询：
 *   - WHERE room_id = ?（查找某个房间的消息）
 *   - ORDER BY created_at DESC（按时间倒序排列）
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 创建房间表
      // id: 房间ID（主键，文本类型，如 "room1"）
      // created_at: 创建时间（时间戳，整数）
      // 注意：其他字段（name、description、password 等）通过迁移脚本添加
      db.run("CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL)", (err) => {
        if (err) return reject(err);
      });
      
      // 创建消息表
      // id: 消息ID（主键，自增整数）
      // room_id: 房间ID（外键，关联到 rooms 表）
      // nickname: 发送者昵称
      // text: 消息内容
      // created_at: 创建时间（时间戳）
      // 注意：其他字段（parent_message_id、is_highlighted 等）通过迁移脚本添加
      db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room_id TEXT NOT NULL, nickname TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY(room_id) REFERENCES rooms(id))", (err) => {
        if (err) return reject(err);
      });
      
      // 创建联合索引，提升查询性能
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

