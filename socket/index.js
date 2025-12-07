// --- socket/index.js ---
// Socket事件处理器注册：统一注册所有Socket事件处理器

const joinRoomHandler = require("./handlers/joinRoom");
const leaveRoomHandler = require("./handlers/leaveRoom");
const chatMessageHandler = require("./handlers/chatMessage");
const getRoomInfoHandler = require("./handlers/getRoomInfo");
const updateRoomHandler = require("./handlers/updateRoom");
const pollHandler = require("./handlers/poll");

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
    // 清理断开连接的socket记录
    socket.on("disconnect", () => {
      rateLimiter.cleanupSocket(socket.id);
      if (socketState.joinedRoomId) {
        const roomId = socketState.joinedRoomId;
        const removed = roomState.removeUserImmediate(socket.id, roomId, db);
        if (removed) {
          const users = roomState.getUsers(roomId);
          io.to(roomId).emit("room_users", users);
        }
      }
    });
    
    // 注册各个事件处理器
    joinRoomHandler(socket, socketState, { io, roomState, messageService, db });
    leaveRoomHandler(socket, socketState, { io, roomState, db });
    chatMessageHandler(socket, socketState, { io, rateLimiter, messageService, db });
    getRoomInfoHandler(socket, socketState, { db });
    updateRoomHandler(socket, socketState, { io, db });
    pollHandler(socket, socketState, { io, messageService, db });
  });
}

module.exports = {
  registerSocketHandlers
};

