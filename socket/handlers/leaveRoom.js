// --- socket/handlers/leaveRoom.js ---
// 离开房间事件处理器

/**
 * 离开房间事件处理器
 * @param {Object} socket - Socket.IO socket对象
 * @param {Object} socketState - Socket连接状态对象
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.io - Socket.IO Server实例
 * @param {Object} deps.roomState - 房间状态服务
 * @param {Object} deps.db - 数据库实例
 */
function leaveRoomHandler(socket, socketState, { io, roomState, db }) {
  socket.on("leave_room", () => {
    // 主动离开房间时立即清理
    if (socketState.joinedRoomId) {
      roomState.removeUserImmediate(socket.id, socketState.joinedRoomId, db);
      // 广播房间用户列表更新
      const users = roomState.getUsers(socketState.joinedRoomId);
      io.to(socketState.joinedRoomId).emit("room_users", users);
    }
    socketState.joinedRoomId = null;
    socketState.nickname = null;
  });
}

module.exports = leaveRoomHandler;

