// --- socket/handlers/chatMessage.js ---
// 聊天消息事件处理器

/**
 * 聊天消息事件处理器
 * @param {Object} socket - Socket.IO socket对象
 * @param {Object} socketState - Socket连接状态对象
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.io - Socket.IO Server实例
 * @param {Object} deps.rateLimiter - 频率限制服务
 * @param {Object} deps.messageService - 消息服务
 * @param {Object} deps.db - 数据库实例
 */
function chatMessageHandler(socket, socketState, { io, rateLimiter, messageService, db }) {
  socket.on("chat_message", async (payload, ack) => {
    try {
      if (!socketState.joinedRoomId || !socketState.nickname) return;
      
      // 消息频率限制检查
      const rateLimitResult = rateLimiter.checkRateLimit(socket.id);
      if (!rateLimitResult.allowed) {
        return ack({ ok: false, error: "rate_limit", message: rateLimitResult.message });
      }
      
      // Phase 2: 支持对象payload并透传clientId
      const incoming = typeof payload === 'string' ? { text: payload } : (payload || {});
      const textStr = String(incoming.text || "");
      const clientId = incoming.clientId || null;
      // Phase 3: 支持 parentMessageId 和 isHighlighted
      const parentMessageId = incoming.parentMessageId || null;
      const isHighlighted = incoming.isHighlighted || false;

      // 处理并保存消息
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
      
      // 将clientId一并回传用于前端平滑替换
      const out = clientId ? { ...message, clientId } : message;
      io.to(socketState.joinedRoomId).emit("chat_message", out);
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, error: 'SEND_MESSAGE_ERROR', message: String(e) });
    }
  });
}

module.exports = chatMessageHandler;

