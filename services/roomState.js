/**
 * 房间状态管理服务
 * 
 * 这个模块负责在内存中维护每个房间的在线用户列表。
 * 为什么不把用户列表存在数据库里？
 * - 用户列表是实时变化的（用户随时加入/离开），需要快速查询和更新
 * - 数据库操作比内存操作慢，频繁读写会影响性能
 * - 用户列表是临时数据，服务器重启后可以重新构建
 * 
 * 数据结构说明：
 * - roomIdToUsers: Map<房间ID, Map<Socket连接ID, 用户昵称>>
 *   例如：{ "room1" => { "socket123" => "张三", "socket456" => "李四" } }
 * 
 * 注意：当房间内所有用户都离开后，会自动清空该房间的聊天记录和密码
 */

// 房间用户映射：Map<房间ID, Map<Socket连接ID, 用户昵称>>
const roomIdToUsers = new Map();

/**
 * 获取房间的用户昵称列表
 * 用于在侧边栏显示当前房间的在线用户
 * 
 * @param {string} roomId - 房间ID
 * @returns {Array<string>} 用户昵称数组，例如 ["张三", "李四"]
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
 * 立即从房间移除用户（当用户断开连接时调用）
 * 
 * 重要：如果房间内所有用户都离开了，会自动执行以下操作：
 * 1. 清空该房间的所有聊天消息
 * 2. 清除房间密码（变为开放房间）
 * 3. 清除创建者信息
 * 
 * 这样设计的原因：
 * - 房间是临时的，当没有人使用时应该重置状态
 * - 避免房间密码和聊天记录永久保留，占用资源
 * - 下次有人加入时，房间会是一个全新的状态
 * 
 * @param {string} socketId - Socket 连接 ID（每个用户连接都有一个唯一的 ID）
 * @param {string} roomId - 房间ID
 * @param {Object} db - 数据库实例（用于清空消息和重置房间信息）
 * @returns {boolean} 是否成功移除用户
 */
function removeUserImmediate(socketId, roomId, db) {
  if (!roomId) return false;
  const usersMap = roomIdToUsers.get(roomId);
  if (usersMap && usersMap.has(socketId)) {
    usersMap.delete(socketId);
    // 如果房间内没有用户了，重置房间状态
    if (usersMap.size === 0) {
      roomIdToUsers.delete(roomId);
      // 异步执行清理操作，不阻塞主流程
      (async () => {
        try {
          await db.clearMessagesForRoom(roomId);
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
  removeUserImmediate,
  findSocketIdByNickname,
  getUsersMap,
  hasRoom,
  getRoomCount
};

