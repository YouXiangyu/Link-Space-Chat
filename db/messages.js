/**
 * 消息相关数据库操作
 * 
 * 这个模块提供消息数据的增删改查功能。
 * 消息信息存储在 messages 表中，包括消息ID、房间ID、昵称、内容、时间等。
 */

/**
 * 保存一条消息到数据库
 * 
 * 当用户发送消息时，调用此函数将消息保存到数据库。
 * 保存后，消息会永久存储在 chat.db 文件中，即使服务器重启也不会丢失。
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {Object} params - 消息参数对象
 * @param {string} params.roomId - 房间ID（消息属于哪个房间）
 * @param {string} params.nickname - 发送者昵称
 * @param {string} params.text - 消息内容
 * @param {number} params.createdAt - 创建时间戳（毫秒）
 * @param {number} params.parentMessageId - 父消息ID（可选，用于回复功能，表示这条消息是回复哪条消息的）
 * @param {boolean} params.isHighlighted - 是否高亮（可选，用于标题消息，如 # 开头的消息）
 * @returns {Promise<Object>} 保存的消息对象（包含数据库生成的 id）
 */
function saveMessage(db, { roomId, nickname, text, createdAt, parentMessageId = null, isHighlighted = false }) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO messages(room_id, nickname, text, created_at, parent_message_id, is_highlighted) VALUES(?, ?, ?, ?, ?, ?)",
      [roomId, nickname, text, createdAt, parentMessageId, isHighlighted ? 1 : 0],
      function (err) {
        if (err) return reject(err);
        resolve({ 
          id: this.lastID, 
          roomId, 
          nickname, 
          text, 
          createdAt, 
          parentMessageId: parentMessageId || null,
          isHighlighted: isHighlighted || false
        });
      }
    );
  });
}

/**
 * 获取指定房间最近的消息（用于加载历史记录）
 * 
 * 当用户加入房间时，调用此函数加载最近的消息，让用户看到聊天历史。
 * 
 * 查询逻辑：
 * 1. 查找指定房间的所有消息
 * 2. 按创建时间倒序排列（最新的在前）
 * 3. 限制返回数量（默认20条）
 * 4. 反转数组，使时间从旧到新（方便前端按时间顺序显示）
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {string} roomId - 房间ID
 * @param {number} limit - 消息数量限制，默认20条
 * @returns {Promise<Array>} 消息列表（按时间从旧到新排列）
 */
function getRecentMessages(db, roomId, limit = 20) {
  return new Promise((resolve, reject) => {
    // 查询消息，按创建时间倒序排列，限制返回数量
    db.all(
      "SELECT id, room_id as roomId, nickname, text, created_at as createdAt, parent_message_id as parentMessageId, is_highlighted as isHighlighted FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?",
      [roomId, limit],
      (err, rows) => {
        if (err) return reject(err);
        // 反转数组，使时间从旧到新（数据库返回的是从新到旧）
        // 转换 isHighlighted 为布尔值（数据库存储为 0/1）
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
 * 清空指定房间的消息
 * @param {Object} db - SQLite数据库实例
 * @param {string} roomId - 房间ID
 * @param {boolean} useTransaction - 是否使用事务（默认false，直接删除更快）
 * @returns {Promise<void>}
 */
function clearMessagesForRoom(db, roomId, useTransaction = false) {
  return new Promise((resolve, reject) => {
    if (useTransaction) {
      // 使用事务模式（兼容旧代码）
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run("DELETE FROM messages WHERE room_id = ?", [roomId], function (err) {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }
        });
        db.run("COMMIT", (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    } else {
      // 直接删除（更快，推荐）
      db.run("DELETE FROM messages WHERE room_id = ?", [roomId], function (err) {
        if (err) return reject(err);
        resolve();
      });
    }
  });
}

/**
 * 清理指定房间的历史记录（已废弃，使用clearMessagesForRoom替代）
 * @deprecated 使用 clearMessagesForRoom(db, roomId, true) 替代
 * @param {Object} db - SQLite数据库实例
 * @param {string} roomId - 房间ID
 * @returns {Promise<void>}
 */
function clearHistoryForRoom(db, roomId) {
  return clearMessagesForRoom(db, roomId, true);
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

