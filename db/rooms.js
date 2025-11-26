/**
 * 房间相关数据库操作
 * 
 * 这个模块提供房间数据的增删改查功能。
 * 房间信息存储在 rooms 表中，包括房间ID、名称、描述、密码、创建者等。
 */

/**
 * 确保房间存在（如果不存在则创建）
 * 
 * 使用场景：当用户加入一个不存在的房间时，自动创建该房间。
 * INSERT OR IGNORE 表示：如果房间已存在，则忽略插入操作（不会报错）。
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {string} roomId - 房间ID（如 "room1"）
 * @param {string} creatorSession - 创建者的 Socket 连接 ID（用于标识房间创建者）
 * @returns {Promise<void>} 操作完成时 resolve
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

