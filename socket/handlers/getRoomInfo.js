// --- socket/handlers/getRoomInfo.js ---
// 获取房间信息事件处理器

const { ErrorCodes, createErrorResponse, createSuccessResponse } = require("../../utils/errors");

/**
 * 获取房间信息事件处理器
 * @param {Object} socket - Socket.IO socket对象
 * @param {Object} socketState - Socket连接状态对象
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.db - 数据库实例
 */
function getRoomInfoHandler(socket, socketState, { db }) {
  socket.on("get_room_info", async (payload, ack) => {
    try {
      if (!socketState.joinedRoomId) {
        return ack(createErrorResponse(ErrorCodes.NOT_IN_ROOM, "未加入房间"));
      }
      const room = await db.getRoom(socketState.joinedRoomId);
      const roomWithCreator = room ? {
        ...room,
        isCreator: room.creatorSession === socket.id
      } : { id: socketState.joinedRoomId, isCreator: false };
      ack(createSuccessResponse({ room: roomWithCreator }));
    } catch (e) {
      ack(createErrorResponse(ErrorCodes.GET_ROOM_INFO_ERROR, String(e)));
    }
  });
}

module.exports = getRoomInfoHandler;

