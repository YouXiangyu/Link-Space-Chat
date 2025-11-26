// --- socket/index.js ---
// Socket事件处理器注册：统一注册所有Socket事件处理器

const joinRoomHandler = require("./handlers/joinRoom");
const leaveRoomHandler = require("./handlers/leaveRoom");
const chatMessageHandler = require("./handlers/chatMessage");
const getRoomInfoHandler = require("./handlers/getRoomInfo");
const updateRoomHandler = require("./handlers/updateRoom");

/**
 * 注册Socket事件处理器
 * @param {Object} params - 参数对象
 * @param {Object} params.io - Socket.IO Server实例
 * @param {Object} params.roomState - 房间状态服务
 * @param {Object} params.rateLimiter - 频率限制服务
 * @param {Object} params.messageService - 消息服务
 * @param {Object} params.db - 数据库实例
 */
function registerSocketHandlers({ io, roomState, rateLimiter, messageService, db }) {
  io.on("connection", (socket) => {
    // Socket连接状态（每个socket独立的状态）
    const socketState = {
      joinedRoomId: null,
      nickname: null
    };
    
    // 初始化消息时间记录
    rateLimiter.initSocket(socket.id);
    
    // 清理断开连接的socket记录
    socket.on("disconnect", () => {
      rateLimiter.cleanupSocket(socket.id);
      // 选择C：空房立即重置，断开时立即清理用户与房间
      if (socketState.joinedRoomId) {
        const removed = roomState.removeUserImmediate(socket.id, socketState.joinedRoomId, db);
        if (removed) {
          // 广播房间用户列表更新
          const users = roomState.getUsers(socketState.joinedRoomId);
          io.to(socketState.joinedRoomId).emit("room_users", users);
          console.log(`User disconnected from room ${socketState.joinedRoomId}`);
        }
      }
    });
    
    // 注册各个事件处理器
    joinRoomHandler(socket, socketState, { io, roomState, messageService, db });
    leaveRoomHandler(socket, socketState, { io, roomState, db });
    chatMessageHandler(socket, socketState, { io, rateLimiter, messageService, db });
    getRoomInfoHandler(socket, socketState, { db });
    updateRoomHandler(socket, socketState, { io, db });
  });
}

module.exports = {
  registerSocketHandlers
};

