// --- db/rooms.js ---
// 房间相关数据库操作

/**
 * 确保房间存在（若不存在则插入）
 * @param {Object} db - SQLite数据库实例
 * @param {string} roomId - 房间ID
 * @param {string} creatorSession - 创建者session ID（可选）
 * @returns {Promise<void>}
 */
function ensureRoom(db, roomId, creatorSession = null) {
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
 * @param {Object} db - SQLite数据库实例
 * @param {string} roomId - 房间ID
 * @returns {Promise<Object|null>} 房间信息对象
 */
function getRoom(db, roomId) {
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
 * @param {Object} db - SQLite数据库实例
 * @param {string} roomId - 房间ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<void>}
 */
function updateRoom(db, roomId, updates) {
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
    if (updates.creatorSession !== undefined) {
      fields.push("creator_session = ?");
      values.push(updates.creatorSession);
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

module.exports = {
  ensureRoom,
  getRoom,
  updateRoom
};

