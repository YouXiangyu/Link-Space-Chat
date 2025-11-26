/**
 * 加入房间事件处理器
 * 
 * 这个文件处理客户端发送的 "join_room" 事件。
 * 当用户在浏览器中输入房间ID和昵称，点击"加入"按钮时，前端会通过 Socket.IO 发送 join_room 事件。
 * 
 * 处理流程：
 * 1. 验证房间ID和昵称是否有效
 * 2. 检查房间密码（如果房间设置了密码）
 * 3. 检查昵称是否已被占用（同一房间内不能有重复昵称）
 * 4. 如果房间不存在，创建房间并设置当前用户为创建者
 * 5. 将用户添加到房间的在线用户列表
 * 6. 加载房间的历史消息（最近20条）
 * 7. 通知房间内其他用户有新用户加入
 * 
 * @param {Object} socket - Socket.IO socket 对象（代表一个客户端连接）
 * @param {Object} socketState - Socket 连接状态对象（存储该连接当前所在的房间、昵称等信息）
 * @param {Object} deps - 依赖对象
 *   - io: Socket.IO 服务器实例（用于向所有客户端广播消息）
 *   - roomState: 房间状态服务（管理在线用户列表）
 *   - messageService: 消息服务（处理消息相关逻辑）
 *   - db: 数据库实例（用于查询和保存数据）
 */
const { ErrorCodes, createErrorResponse, createSuccessResponse } = require("../../utils/errors");

function joinRoomHandler(socket, socketState, { io, roomState, messageService, db }) {
  // 监听客户端发送的 "join_room" 事件
  // payload: 客户端发送的数据（包含房间ID、昵称、密码等）
  // ack: 回调函数，用于向客户端返回处理结果
  socket.on("join_room", async (payload, ack) => {
    try {
      const roomId = String(payload?.roomId || "").trim();
      const name = String(payload?.nickname || "").trim();
      const password = payload?.password || null;
      
      if (!roomId || !name) {
        return ack(createErrorResponse(ErrorCodes.INVALID_REQUEST, "roomId 和 nickname 必填"));
      }

      // 获取当前内存中的房间在线用户映射（用于判断房间是否为空）
      const usersMap = roomState.getUsersMap(roomId);

      // 检查房间密码（考虑"空房即重置"的业务规则）
      // 如果房间在数据库中存在，但内存中没有在线用户（可能是服务器重启了），需要重置房间状态
      let room = await db.getRoom(roomId);
      if (room) {
        const userCount = usersMap ? usersMap.size : 0;
        // 如果房间存在但当前没有在线用户，且房间有密码或创建者信息，说明是服务器重启后的情况
        // 按照业务规则，空房间应该重置（清空消息、密码、创建者信息）
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
        // 如果房间有密码，验证用户输入的密码是否正确
        if (room.password) {
          if (!password) {
            return ack(createErrorResponse(ErrorCodes.PASSWORD_REQUIRED, "当前房间需要密码，请重试密码"));
          }
          if (password !== room.password) {
            return ack(createErrorResponse(ErrorCodes.PASSWORD_REQUIRED, "当前密码输入错误，请重试"));
          }
        }
      }

      // 检查昵称是否已被占用（同一房间内不能有重复昵称）
      let existingSocketId = roomState.findSocketIdByNickname(roomId, name);

      if (existingSocketId) {
        // 如果昵称已被占用，检查占用该昵称的用户是否还在线
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (!oldSocket) {
          // Socket 不存在（可能是异常断开），从房间状态中移除
          roomState.removeUserImmediate(existingSocketId, roomId, db);
        } else {
          // Socket 存在，发送 ping 消息检查是否真的在线
          const isAlive = await new Promise((resolve) => {
            oldSocket.timeout(2000).emit("server-ping", (err, pong) => {
              resolve(!err && pong === "ok");
            });
          });
          if (isAlive) {
            // 用户确实在线，拒绝使用该昵称
            return ack(createErrorResponse(ErrorCodes.NICKNAME_TAKEN, "该昵称已被占用"));
          } else {
            // 用户不在线（可能是僵尸连接），清理旧连接
            roomState.removeUserImmediate(oldSocket.id, roomId, db);
            oldSocket.disconnect(true);
          }
        }
      }

      // 如果房间不存在，创建房间并设置当前用户为创建者
      // 创建者可以设置房间密码、修改房间名称等
      const existingRoom = await db.getRoom(roomId);
      if (!existingRoom) {
        await db.ensureRoom(roomId, socket.id);
      } else if (!existingRoom.creatorSession) {
        // 如果房间存在但没有创建者（可能是旧数据），设置当前用户为创建者
        await db.updateRoom(roomId, { creatorSession: socket.id });
      }

      // 将 Socket 连接加入到房间（Socket.IO 会自动管理房间成员）
      // 加入后，可以通过 io.to(roomId).emit() 向房间内所有用户广播消息
      await socket.join(roomId);
      
      // 更新 Socket 连接状态
      socketState.joinedRoomId = roomId;
      socketState.nickname = name;

      // 将用户添加到房间的在线用户列表（用于在侧边栏显示）
      roomState.addUser(roomId, socket.id, socketState.nickname);

      // 加载房间的历史消息（最近20条）
      const history = await messageService.getRecentMessages(db, roomId, 20);
      console.log(
        "[join_room] history loaded",
        JSON.stringify({
          roomId,
          nickname: name,
          count: Array.isArray(history) ? history.length : -1,
        })
      );
      
      // 获取房间信息（名称、描述、密码等）
      const roomInfo = await db.getRoom(roomId);
      // 添加 isCreator 字段，标识当前用户是否为房间创建者
      const roomInfoWithCreator = roomInfo ? {
        ...roomInfo,
        isCreator: roomInfo.creatorSession === socket.id
      } : { id: roomId, isCreator: false };
      
      // 向当前用户发送历史消息和房间信息
      console.log(
        "[join_room] emitting history",
        JSON.stringify({
          socketId: socket.id,
          roomId,
          nickname: name,
          count: Array.isArray(history) ? history.length : -1,
        })
      );
      
      // 向当前用户发送历史消息和房间信息
      socket.emit("history", history);
      socket.emit("room_info", roomInfoWithCreator);
      
      // 向房间内所有用户（包括当前用户）广播最新的用户列表
      const users = roomState.getUsers(roomId);
      io.to(roomId).emit("room_users", users);
      
      // 向客户端返回成功响应
      ack(createSuccessResponse());
    } catch (e) {
      ack(createErrorResponse(ErrorCodes.JOIN_ROOM_ERROR, String(e)));
    }
  });
}

module.exports = joinRoomHandler;

