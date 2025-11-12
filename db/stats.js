// --- db/stats.js ---
// 数据库统计相关操作

const fs = require("fs");

/**
 * 获取数据库统计信息
 * @param {Object} db - SQLite数据库实例
 * @param {string} dbPath - 数据库文件路径
 * @returns {Promise<Object>} 统计信息对象
 */
function getDatabaseStats(db, dbPath) {
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
 * 检查数据库连接是否正常
 * @param {Object} db - SQLite数据库实例
 * @returns {Promise<boolean>}
 */
function checkConnection(db) {
  return new Promise((resolve) => {
    db.get("SELECT 1", (err) => {
      resolve(!err);
    });
  });
}

module.exports = {
  getDatabaseStats,
  checkConnection
};

