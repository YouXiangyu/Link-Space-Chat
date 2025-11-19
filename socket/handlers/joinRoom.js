// --- socket/handlers/joinRoom.js ---
// 加入房间事件处理器

const { ErrorCodes, createErrorResponse, createSuccessResponse } = require("../../utils/errors");

/**
 * 加入房间事件处理器
 * @param {Object} socket - Socket.IO socket对象
 * @param {Object} socketState - Socket连接状态对象
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.io - Socket.IO Server实例
 * @param {Object} deps.roomState - 房间状态服务
 * @param {Object} deps.messageService - 消息服务
 * @param {Object} deps.db - 数据库实例
 */
function joinRoomHandler(socket, socketState, { io, roomState, messageService, db }) {
  socket.on("join_room", async (payload, ack) => {
    try {
      const roomId = String(payload?.roomId || "").trim();
      const name = String(payload?.nickname || "").trim();
      const password = payload?.password || null;
      
      if (!roomId || !name) {
        return ack(createErrorResponse(ErrorCodes.INVALID_REQUEST, "roomId 和 nickname 必填"));
      }

      // 获取当前内存中的房间在线用户映射
      const usersMap = roomState.getUsersMap(roomId);

      // Phase 2: 检查房间密码（考虑"空房即重置"的业务规则）
      let room = await db.getRoom(roomId);
      if (room) {
        // 如果房间存在且当前在线用户为0（包括服务重启后的空映射），按照业务约定重置房间状态
        const userCount = usersMap ? usersMap.size : 0;
        if (userCount === 0 && (room.password || room.creatorSession)) {
          // 清空消息 + 清空密码与创建者
          if (typeof db.clearMessagesForRoom === 'function') {
            await db.clearMessagesForRoom(roomId);
          } else {
            await db.clearHistoryForRoom(roomId);
          }
          await db.updateRoom(roomId, { password: null, creatorSession: null });
          // 重新读取房间信息（已清空密码）
          room = await db.getRoom(roomId);
        }
        // 若仍有密码（非空房情况），则按正常逻辑验证密码
        if (room.password) {
          if (!password) {
            return ack(createErrorResponse(ErrorCodes.PASSWORD_REQUIRED, "当前房间需要密码，请重试密码"));
          }
          if (password !== room.password) {
            return ack(createErrorResponse(ErrorCodes.PASSWORD_REQUIRED, "当前密码输入错误，请重试"));
          }
        }
      }

      // 检查昵称是否已被占用
      let existingSocketId = roomState.findSocketIdByNickname(roomId, name);

      if (existingSocketId) {
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (!oldSocket) {
          // Socket不存在，从房间状态中移除（通过removeUserImmediate）
          roomState.removeUserImmediate(existingSocketId, roomId, db);
        } else {
          const isAlive = await new Promise((resolve) => {
            oldSocket.timeout(2000).emit("server-ping", (err, pong) => {
              resolve(!err && pong === "ok");
            });
          });
          if (isAlive) {
            return ack(createErrorResponse(ErrorCodes.NICKNAME_TAKEN, "该昵称已被占用"));
          } else {
            // 选择C：立即清理旧连接，避免残留
            roomState.removeUserImmediate(oldSocket.id, roomId, db);
            oldSocket.disconnect(true);
          }
        }
      }

      // Phase 2: 如果房间不存在，创建时记录创建者
      const existingRoom = await db.getRoom(roomId);
      if (!existingRoom) {
        await db.ensureRoom(roomId, socket.id);
      } else if (!existingRoom.creatorSession) {
        // 如果房间存在但没有创建者，设置当前用户为创建者
        await db.updateRoom(roomId, { creatorSession: socket.id });
      }

      await socket.join(roomId);
      socketState.joinedRoomId = roomId;
      socketState.nickname = name;

      // 如果用户重新连接，取消之前的清理任务
      roomState.cancelRemoval(socket.id);

      // 添加用户到房间
      roomState.addUser(roomId, socket.id, socketState.nickname);

      const history = await messageService.getRecentMessages(db, roomId, 20);
      const roomInfo = await db.getRoom(roomId);
      // Phase 2: 添加isCreator字段
      const roomInfoWithCreator = roomInfo ? {
        ...roomInfo,
        isCreator: roomInfo.creatorSession === socket.id
      } : { id: roomId, isCreator: false };
      socket.emit("history", history);
      socket.emit("room_info", roomInfoWithCreator);
      
      // 广播房间用户列表
      const users = roomState.getUsers(roomId);
      io.to(roomId).emit("room_users", users);
      
      ack(createSuccessResponse());
    } catch (e) {
      ack(createErrorResponse(ErrorCodes.JOIN_ROOM_ERROR, String(e)));
    }
  });
}

module.exports = joinRoomHandler;

