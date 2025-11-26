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
    // 清理断开连接的socket记录
    socket.on("disconnect", () => {
      rateLimiter.cleanupSocket(socket.id);
      // 修复：断开连接不再立刻清空房间，使用延迟清理，避免短暂网络抖动导致消息被误删
      if (socketState.joinedRoomId) {
        roomState.scheduleRemoval(socket.id, socketState.joinedRoomId, db);
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

