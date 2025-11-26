/**
 * 聊天消息事件处理器
 * 
 * 这个文件处理客户端发送的 "chat_message" 事件。
 * 当用户在输入框输入消息并按 Enter 发送时，前端会通过 Socket.IO 发送 chat_message 事件。
 * 
 * 处理流程：
 * 1. 检查用户是否已加入房间
 * 2. 检查消息频率限制（防止刷屏）
 * 3. 检测消息类型（文本、Emoji、高亮等）
 * 4. 保存消息到数据库
 * 5. 向房间内所有用户广播消息
 * 
 * @param {Object} socket - Socket.IO socket 对象（代表一个客户端连接）
 * @param {Object} socketState - Socket 连接状态对象（包含当前所在的房间、昵称等信息）
 * @param {Object} deps - 依赖对象
 *   - io: Socket.IO 服务器实例（用于广播消息）
 *   - rateLimiter: 频率限制服务（防止刷屏）
 *   - messageService: 消息服务（处理消息保存和类型检测）
 *   - db: 数据库实例（用于保存消息）
 */
const { ErrorCodes, createErrorResponse, createSuccessResponse } = require("../../utils/errors");

function chatMessageHandler(socket, socketState, { io, rateLimiter, messageService, db }) {
  // 监听客户端发送的 "chat_message" 事件
  socket.on("chat_message", async (payload, ack) => {
    try {
      // 检查用户是否已加入房间（防止未加入房间就发送消息）
      if (!socketState.joinedRoomId || !socketState.nickname) return;
      
      // 检查消息频率限制（防止用户刷屏）
      // 默认限制：3秒内最多发送5条消息
      const rateLimitResult = rateLimiter.checkRateLimit(socket.id);
      if (!rateLimitResult.allowed) {
        return ack(createErrorResponse(ErrorCodes.RATE_LIMIT, rateLimitResult.message));
      }
      
      // 解析客户端发送的数据
      // payload 可能是字符串（旧格式）或对象（新格式，包含更多信息）
      const incoming = typeof payload === 'string' ? { text: payload } : (payload || {});
      const textStr = String(incoming.text || "");
      const clientId = incoming.clientId || null; // 客户端临时ID，用于前端显示"发送中"状态
      const parentMessageId = incoming.parentMessageId || null; // 回复的消息ID（如果有）
      const isHighlighted = incoming.isHighlighted || false; // 是否高亮消息（如 # 开头的标题）

      // 保存消息到数据库
      const now = Date.now();
      const message = await messageService.saveMessage({
        db,
        roomId: socketState.joinedRoomId,
        nickname: socketState.nickname,
        text: textStr,
        createdAt: now,
        parentMessageId,
        isHighlighted
      });
      
      // 构建要广播的消息对象
      // 包含 clientId 用于前端替换"发送中"状态为实际消息
      // 包含 roomId 用于客户端区分不同房间的消息
      const out = clientId 
        ? { ...message, clientId, roomId: socketState.joinedRoomId } 
        : { ...message, roomId: socketState.joinedRoomId };
      
      // 向房间内所有用户（包括发送者）广播消息
      // io.to(roomId) 表示向指定房间内的所有 Socket 连接发送消息
      io.to(socketState.joinedRoomId).emit("chat_message", out);
      
      // 向发送者返回成功响应
      ack(createSuccessResponse());
    } catch (e) {
      ack(createErrorResponse(ErrorCodes.SEND_MESSAGE_ERROR, String(e)));
    }
  });
}

module.exports = chatMessageHandler;

