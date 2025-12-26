/**
 * 投票事件处理器
 * 
 * 这个文件处理客户端发送的投票相关事件。
 * 
 * 处理的事件：
 * 1. create_poll - 创建投票
 * 2. vote - 投票
 * 3. get_poll_results - 获取投票结果（可选）
 * 
 * @param {Object} socket - Socket.IO socket 对象（代表一个客户端连接）
 * @param {Object} socketState - Socket 连接状态对象（包含当前所在的房间、昵称等信息）
 * @param {Object} deps - 依赖对象
 *   - io: Socket.IO 服务器实例（用于广播消息）
 *   - messageService: 消息服务（处理消息保存）
 *   - db: 数据库实例（用于保存投票数据）
 */
const { ErrorCodes, createErrorResponse, createSuccessResponse } = require("../../utils/errors");

function pollHandler(socket, socketState, { io, messageService, db }) {
  /**
   * 创建投票事件
   * 接收参数：
   * {
   *   text: "投票标题",
   *   options: ["选项1", "选项2", "选项3"],
   *   expiresAt: 1234567890  // 可选：截止时间戳
   * }
   */
  socket.on("create_poll", async (payload, ack) => {
    try {
      // 检查用户是否已加入房间
      if (!socketState.joinedRoomId || !socketState.nickname) {
        return ack(createErrorResponse(ErrorCodes.UNAUTHORIZED, "请先加入房间"));
      }

      const { text, options, expiresAt } = payload || {};

      // 验证参数
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return ack(createErrorResponse(ErrorCodes.INVALID_PARAMS, "投票标题不能为空"));
      }

      if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
        return ack(createErrorResponse(ErrorCodes.INVALID_PARAMS, "投票选项数量必须在2-10个之间"));
      }

      // 验证选项文本
      const validOptions = [];
      for (let i = 0; i < options.length; i++) {
        const optionText = String(options[i] || "").trim();
        if (optionText.length === 0) {
          return ack(createErrorResponse(ErrorCodes.INVALID_PARAMS, `选项${i + 1}不能为空`));
        }
        if (optionText.length > 100) {
          return ack(createErrorResponse(ErrorCodes.INVALID_PARAMS, `选项${i + 1}文本长度不能超过100字符`));
        }
        // 检查选项是否重复
        if (validOptions.includes(optionText)) {
          return ack(createErrorResponse(ErrorCodes.INVALID_PARAMS, "投票选项不能重复"));
        }
        validOptions.push(optionText);
      }

      // 验证截止时间（如果提供）
      let expiresAtTimestamp = null;
      if (expiresAt) {
        expiresAtTimestamp = Number(expiresAt);
        if (isNaN(expiresAtTimestamp) || expiresAtTimestamp <= Date.now()) {
          return ack(createErrorResponse(ErrorCodes.INVALID_PARAMS, "截止时间必须是将来的时间"));
        }
      }

      // 创建消息（投票消息）
      const now = Date.now();
      const message = await messageService.saveMessage({
        db,
        roomId: socketState.joinedRoomId,
        nickname: socketState.nickname,
        text: text.trim(),
        createdAt: now,
        parentMessageId: null,
        isHighlighted: false
      });

      // 创建投票
      const poll = await db.createPoll({
        messageId: message.id,
        options: validOptions,
        expiresAt: expiresAtTimestamp
      });

      // 获取完整的投票信息（包含选项和初始结果）
      const pollData = await db.getPollByMessageId(message.id);

      // 构建要广播的消息对象
      const out = {
        ...message,
        roomId: socketState.joinedRoomId,
        poll: pollData
      };

      // 向房间内所有用户广播投票消息
      io.to(socketState.joinedRoomId).emit("poll_message", out);

      // 向发送者返回成功响应
      ack(createSuccessResponse({
        message,
        poll: pollData
      }));
    } catch (e) {
      console.error("[投票] 创建投票失败:", e);
      ack(createErrorResponse(ErrorCodes.CREATE_POLL_ERROR, String(e)));
    }
  });

  /**
   * 投票事件
   * 接收参数：
   * {
   *   pollId: 123,
   *   optionId: 456
   * }
   */
  socket.on("vote", async (payload, ack) => {
    try {
      // 检查用户是否已加入房间
      if (!socketState.joinedRoomId || !socketState.nickname) {
        return ack(createErrorResponse(ErrorCodes.UNAUTHORIZED, "请先加入房间"));
      }

      const { pollId, optionId } = payload || {};

      // 验证参数
      if (!pollId || !optionId) {
        return ack(createErrorResponse(ErrorCodes.INVALID_PARAMS, "投票ID和选项ID不能为空"));
      }

      // 检查投票是否过期
      const isExpired = await db.isPollExpired(pollId);
      if (isExpired) {
        return ack(createErrorResponse(ErrorCodes.POLL_EXPIRED, "投票已过期"));
      }

      // 获取投票信息（验证选项是否属于该投票）
      const poll = await db.getPollResults(pollId);
      if (!poll || !poll.options || poll.options.length === 0) {
        return ack(createErrorResponse(ErrorCodes.POLL_NOT_FOUND, "投票不存在"));
      }

      // 验证选项ID是否有效
      const optionExists = poll.options.some(opt => opt.id === optionId);
      if (!optionExists) {
        return ack(createErrorResponse(ErrorCodes.INVALID_PARAMS, "无效的选项ID"));
      }

      // 投票
      const voteResult = await db.castVote({
        optionId,
        sessionId: socket.id
      });

      if (!voteResult.success) {
        return ack(createErrorResponse(ErrorCodes.VOTE_ERROR, voteResult.error || "投票失败"));
      }

      // 获取最新投票结果
      const updatedResults = await db.getPollResults(pollId);
      
      // 获取消息ID（用于前端定位）
      const messageId = await db.getMessageIdByPollId(pollId);

      // 获取用户已投的选项（投票后应该是当前选项）
      const userVote = optionId;

      // 构建要广播的结果对象
      const resultsData = {
        pollId,
        messageId,
        results: updatedResults,
        sessionId: socket.id,
        userVote: userVote
      };

      // 向房间内所有用户广播更新后的投票结果
      io.to(socketState.joinedRoomId).emit("poll_results", resultsData);

      // 向发送者返回成功响应
      ack(createSuccessResponse({
        pollId,
        optionId,
        results: updatedResults,
        isChanged: voteResult.isChanged
      }));
    } catch (e) {
      console.error("[投票] 投票失败:", e);
      ack(createErrorResponse(ErrorCodes.VOTE_ERROR, String(e)));
    }
  });

  /**
   * 获取投票结果事件（可选，用于刷新）
   * 接收参数：
   * {
   *   pollId: 123
   * }
   */
  socket.on("get_poll_results", async (payload, ack) => {
    try {
      const { pollId } = payload || {};

      if (!pollId) {
        return ack(createErrorResponse(ErrorCodes.INVALID_PARAMS, "投票ID不能为空"));
      }

      // 获取投票结果
      const results = await db.getPollResults(pollId);
      
      if (!results) {
        return ack(createErrorResponse(ErrorCodes.POLL_NOT_FOUND, "投票不存在"));
      }

      // 获取用户已投的选项（如果有）
      const userVote = await db.getUserVote({
        pollId,
        sessionId: socket.id
      });

      ack(createSuccessResponse({
        pollId,
        results,
        userVote
      }));
    } catch (e) {
      console.error("[投票] 获取投票结果失败:", e);
      ack(createErrorResponse(ErrorCodes.GET_POLL_RESULTS_ERROR, String(e)));
    }
  });
}

module.exports = pollHandler;

