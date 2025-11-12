// --- db/messages.js ---
// 消息相关数据库操作

/**
 * 保存一条消息
 * @param {Object} db - SQLite数据库实例
 * @param {Object} params - 消息参数
 * @param {string} params.roomId - 房间ID
 * @param {string} params.nickname - 昵称
 * @param {string} params.text - 消息内容
 * @param {number} params.createdAt - 创建时间戳
 * @param {string} params.contentType - 消息类型（默认'text'）
 * @param {number} params.parentMessageId - 父消息ID（可选，Phase 3）
 * @param {boolean} params.isHighlighted - 是否高亮（可选，Phase 3）
 * @returns {Promise<Object>} 保存的消息对象
 */
function saveMessage(db, { roomId, nickname, text, createdAt, contentType = 'text', parentMessageId = null, isHighlighted = false }) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO messages(room_id, nickname, text, created_at, content_type, parent_message_id, is_highlighted) VALUES(?, ?, ?, ?, ?, ?, ?)",
      [roomId, nickname, text, createdAt, contentType, parentMessageId, isHighlighted ? 1 : 0],
      function (err) {
        if (err) return reject(err);
        resolve({ 
          id: this.lastID, 
          roomId, 
          nickname, 
          text, 
          createdAt, 
          contentType,
          parentMessageId: parentMessageId || null,
          isHighlighted: isHighlighted || false
        });
      }
    );
  });
}

/**
 * 获取指定房间最近 limit 条消息（按时间升序返回）
 * 优化：只查询需要的字段，减少数据传输
 * @param {Object} db - SQLite数据库实例
 * @param {string} roomId - 房间ID
 * @param {number} limit - 消息数量限制，默认20
 * @returns {Promise<Array>} 消息列表
 */
function getRecentMessages(db, roomId, limit = 20) {
  return new Promise((resolve, reject) => {
    // Phase 3: 包含 parent_message_id 和 is_highlighted 字段
    db.all(
      "SELECT id, room_id as roomId, nickname, text, created_at as createdAt, content_type as contentType, parent_message_id as parentMessageId, is_highlighted as isHighlighted FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?",
      [roomId, limit],
      (err, rows) => {
        if (err) return reject(err);
        // 反转数组，使时间从旧到新
        // Phase 3: 转换 isHighlighted 为布尔值
        const processedRows = rows.reverse().map(row => ({
          ...row,
          isHighlighted: row.isHighlighted === 1 || row.isHighlighted === true,
          parentMessageId: row.parentMessageId || null
        }));
        resolve(processedRows);
      }
    );
  });
}

/**
 * 清理指定天数之前的消息
 * @param {Object} db - SQLite数据库实例
 * @param {number} days - 保留最近N天的消息，默认1天
 * @returns {Promise<number>} 删除的消息数量
 */
function cleanOldMessages(db, days = 1) {
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
 * 清理指定房间的历史记录
 * @param {Object} db - SQLite数据库实例
 * @param {string} roomId - 房间ID
 * @returns {Promise<void>}
 */
function clearHistoryForRoom(db, roomId) {
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
 * @param {Object} db - SQLite数据库实例
 * @param {string} roomId
 * @returns {Promise<void>}
 */
function clearMessagesForRoom(db, roomId) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM messages WHERE room_id = ?", [roomId], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * 清空所有数据
 * @param {Object} db - SQLite数据库实例
 * @returns {Promise<void>}
 */
function clearAllData(db) {
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

module.exports = {
  saveMessage,
  getRecentMessages,
  cleanOldMessages,
  clearHistoryForRoom,
  clearMessagesForRoom,
  clearAllData
};

