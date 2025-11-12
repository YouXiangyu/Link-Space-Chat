// --- socket/handlers/updateRoom.js ---
// 更新房间信息事件处理器

const { ErrorCodes, createErrorResponse, createSuccessResponse } = require("../../utils/errors");

/**
 * 更新房间信息事件处理器
 * @param {Object} socket - Socket.IO socket对象
 * @param {Object} socketState - Socket连接状态对象
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.io - Socket.IO Server实例
 * @param {Object} deps.db - 数据库实例
 */
function updateRoomHandler(socket, socketState, { io, db }) {
  socket.on("update_room", async (payload, ack) => {
    try {
      if (!socketState.joinedRoomId) {
        return ack(createErrorResponse(ErrorCodes.NOT_IN_ROOM, "未加入房间"));
      }

      // 检查是否为默认房间（不能设置密码）
      if (socketState.joinedRoomId === "1" && payload.password !== undefined && payload.password !== null) {
        return ack(createErrorResponse(ErrorCodes.DEFAULT_ROOM_NO_PASSWORD, "默认房间不能设置密码"));
      }

      // 检查创建者权限
      const room = await db.getRoom(socketState.joinedRoomId);
      if (!room || room.creatorSession !== socket.id) {
        return ack(createErrorResponse(ErrorCodes.NOT_CREATOR, "只有房间创建者可以修改房间信息"));
      }

      const updates = {};
      if (payload.name !== undefined) {
        updates.name = String(payload.name || "").trim() || null;
      }
      if (payload.description !== undefined) {
        updates.description = String(payload.description || "").trim() || null;
      }
      if (payload.password !== undefined) {
        const password = String(payload.password || "").trim();
        updates.password = password || null; // 空字符串转为null（取消密码）
      }

      await db.updateRoom(socketState.joinedRoomId, updates);

      // 如果修改了密码，仅清空该房间消息并通知所有用户（不删除房间，保留元数据与密码）
      if (payload.password !== undefined) {
        if (typeof db.clearMessagesForRoom === 'function') {
          await db.clearMessagesForRoom(socketState.joinedRoomId);
        } else {
          // 兼容旧方法（将会删除房间，不推荐）
          await db.clearHistoryForRoom(socketState.joinedRoomId);
        }
        io.to(socketState.joinedRoomId).emit("room_refresh", { message: "房间密码已更改，聊天记录已清空" });
      }

      const updatedRoom = await db.getRoom(socketState.joinedRoomId);
      const roomWithCreator = updatedRoom ? {
        ...updatedRoom,
        isCreator: updatedRoom.creatorSession === socket.id
      } : { id: socketState.joinedRoomId, isCreator: false };
      io.to(socketState.joinedRoomId).emit("room_info", roomWithCreator);
      ack(createSuccessResponse({ room: roomWithCreator }));
    } catch (e) {
      ack(createErrorResponse(ErrorCodes.UPDATE_ROOM_ERROR, String(e)));
    }
  });
}

module.exports = updateRoomHandler;

