// --- services/roomState.js ---
// 房间与用户状态管理服务：集中管理房间用户 Map、延迟清理任务、房间清空重置

const config = require("../config");

// 房间用户映射：Map<roomId, Map<socketId, nickname>>
const roomIdToUsers = new Map();

// 延迟清理任务：Map<socketId, { roomId, timeout }>
const delayedCleanupTasks = new Map();

/**
 * 获取房间用户列表
 * @param {string} roomId - 房间ID
 * @returns {Array<string>} 用户昵称数组
 */
function getUsers(roomId) {
  const usersMap = roomIdToUsers.get(roomId) || new Map();
  return Array.from(usersMap.values());
}

/**
 * 获取房间状态快照（供健康检查使用）
 * @returns {Map} 房间用户映射
 */
function getSnapshot() {
  return roomIdToUsers;
}

/**
 * 向房间添加用户
 * @param {string} roomId - 房间ID
 * @param {string} socketId - Socket ID
 * @param {string} nickname - 用户昵称
 */
function addUser(roomId, socketId, nickname) {
  const usersMap = roomIdToUsers.get(roomId) || new Map();
  usersMap.set(socketId, nickname);
  roomIdToUsers.set(roomId, usersMap);
}

/**
 * 取消延迟清理任务（用户重新连接时调用）
 * @param {string} socketId - Socket ID
 */
function cancelRemoval(socketId) {
  const existingTask = delayedCleanupTasks.get(socketId);
  if (existingTask) {
    clearTimeout(existingTask.timeout);
    delayedCleanupTasks.delete(socketId);
  }
}

/**
 * 立即从房间移除用户（不延迟）
 * @param {string} socketId - Socket ID
 * @param {string} roomId - 房间ID
 * @param {Object} db - 数据库实例（用于房间清空时清理数据）
 * @returns {boolean} 是否成功移除
 */
function removeUserImmediate(socketId, roomId, db) {
  if (!roomId) return false;
  const usersMap = roomIdToUsers.get(roomId);
  if (usersMap && usersMap.has(socketId)) {
    usersMap.delete(socketId);
    if (usersMap.size === 0) {
      roomIdToUsers.delete(roomId);
      // 房间无人后，重置房间：清空消息、置空密码与creator_session
      (async () => {
        try {
          if (typeof db.clearMessagesForRoom === 'function') {
            await db.clearMessagesForRoom(roomId);
          } else {
            await db.clearHistoryForRoom(roomId);
          }
          await db.updateRoom(roomId, { password: null, creatorSession: null });
          console.log(`Room ${roomId} reset after empty: messages cleared, password and creator reset.`);
        } catch (err) {
          console.error(`Failed to reset empty room ${roomId}:`, err);
        }
      })();
    }
    return true;
  }
  return false;
}

/**
 * 延迟清理用户（断开连接后延迟3分钟删除，避免频繁创建）
 * @param {string} socketId - Socket ID
 * @param {string} roomId - 房间ID
 * @param {Object} db - 数据库实例
 * @returns {boolean} 是否设置了延迟清理任务
 */
function scheduleRemoval(socketId, roomId, db) {
  if (!roomId) return false;
  
  // 取消之前的清理任务（如果用户重新连接）
  const existingTask = delayedCleanupTasks.get(socketId);
  if (existingTask) {
    clearTimeout(existingTask.timeout);
    delayedCleanupTasks.delete(socketId);
    return false; // 用户重新连接，不执行清理
  }
  
  // 设置延迟清理任务
  const timeout = setTimeout(() => {
    removeUserImmediate(socketId, roomId, db);
    delayedCleanupTasks.delete(socketId);
  }, config.cleanup.delay);
  
  delayedCleanupTasks.set(socketId, { roomId, timeout });
  return true;
}

/**
 * 检查昵称是否已被占用
 * @param {string} roomId - 房间ID
 * @param {string} nickname - 昵称
 * @returns {string|null} 占用该昵称的 socketId，如果未被占用则返回 null
 */
function findSocketIdByNickname(roomId, nickname) {
  const usersMap = roomIdToUsers.get(roomId);
  if (!usersMap) return null;
  
  for (const [socketId, name] of usersMap.entries()) {
    if (name === nickname) {
      return socketId;
    }
  }
  return null;
}

/**
 * 获取房间用户映射（供内部使用）
 * @param {string} roomId - 房间ID
 * @returns {Map<string, string>|null} 用户映射 Map<socketId, nickname>，如果房间不存在则返回 null
 */
function getUsersMap(roomId) {
  return roomIdToUsers.get(roomId) || null;
}

/**
 * 检查房间是否存在
 * @param {string} roomId - 房间ID
 * @returns {boolean} 房间是否存在
 */
function hasRoom(roomId) {
  return roomIdToUsers.has(roomId);
}

/**
 * 获取房间数量
 * @returns {number} 房间数量
 */
function getRoomCount() {
  return roomIdToUsers.size;
}

module.exports = {
  getUsers,
  getSnapshot,
  addUser,
  cancelRemoval,
  removeUserImmediate,
  scheduleRemoval,
  findSocketIdByNickname,
  getUsersMap,
  hasRoom,
  getRoomCount
};

