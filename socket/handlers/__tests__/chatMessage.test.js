// 聊天消息处理测试
const chatMessageHandler = require('../chatMessage');
const { ErrorCodes } = require('../../../utils/errors');

describe('聊天消息处理测试', () => {
  let mockSocket;
  let mockSocketState;
  let mockIo;
  let mockRateLimiter;
  let mockMessageService;
  let mockDb;
  let eventHandler;

  beforeEach(() => {
    // 创建Mock Socket
    mockSocket = {
      id: 'socket-123',
      on: jest.fn((event, handler) => {
        if (event === 'chat_message') {
          eventHandler = handler;
        }
      })
    };

    // 创建Mock Socket State
    mockSocketState = {
      joinedRoomId: 'room1',
      nickname: 'testuser'
    };

    // 创建Mock IO
    mockIo = {
      to: jest.fn(() => ({
        emit: jest.fn()
      }))
    };

    // 创建Mock Rate Limiter
    mockRateLimiter = {
      checkRateLimit: jest.fn(() => ({ allowed: true }))
    };

    // 创建Mock Message Service
    mockMessageService = {
      saveMessage: jest.fn()
    };

    // 创建Mock DB
    mockDb = {};

    // 注册处理器
    chatMessageHandler(mockSocket, mockSocketState, {
      io: mockIo,
      rateLimiter: mockRateLimiter,
      messageService: mockMessageService,
      db: mockDb
    });
  });

  test('测试用例16: 未加入房间时拒绝消息', async () => {
    mockSocketState.joinedRoomId = null;
    const ack = jest.fn();

    await eventHandler('Hello', ack);

    expect(ack).not.toHaveBeenCalled();
    expect(mockMessageService.saveMessage).not.toHaveBeenCalled();
  });

  test('测试用例16变体: 未设置nickname时拒绝消息', async () => {
    mockSocketState.nickname = null;
    const ack = jest.fn();

    await eventHandler('Hello', ack);

    expect(ack).not.toHaveBeenCalled();
    expect(mockMessageService.saveMessage).not.toHaveBeenCalled();
  });

  test('测试用例17: 频率限制检查（正常情况）', async () => {
    mockRateLimiter.checkRateLimit.mockReturnValue({ allowed: true });
    mockMessageService.saveMessage.mockResolvedValue({
      id: 1,
      roomId: 'room1',
      nickname: 'testuser',
      text: 'Hello',
      createdAt: Date.now()
    });

    const ack = jest.fn();
    await eventHandler('Hello', ack);

    expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith('socket-123');
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  test('测试用例18: 频率限制检查（超过限制）', async () => {
    mockRateLimiter.checkRateLimit.mockReturnValue({
      allowed: false,
      message: '消息发送过于频繁，请稍后再试'
    });

    const ack = jest.fn();
    await eventHandler('Hello', ack);

    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: ErrorCodes.RATE_LIMIT
      })
    );
    expect(mockMessageService.saveMessage).not.toHaveBeenCalled();
  });

  test('测试用例19: 消息payload解析（字符串格式）', async () => {
    mockMessageService.saveMessage.mockResolvedValue({
      id: 1,
      roomId: 'room1',
      nickname: 'testuser',
      text: 'Hello World',
      createdAt: Date.now()
    });

    const ack = jest.fn();
    await eventHandler('Hello World', ack);

    expect(mockMessageService.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Hello World'
      })
    );
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  test('测试用例20: 消息payload解析（对象格式）', async () => {
    const payload = {
      text: 'Hello',
      clientId: 'client-123',
      parentMessageId: 456,
      isHighlighted: true
    };

    mockMessageService.saveMessage.mockResolvedValue({
      id: 1,
      roomId: 'room1',
      nickname: 'testuser',
      text: 'Hello',
      createdAt: Date.now(),
      parentMessageId: 456,
      isHighlighted: true
    });

    const ack = jest.fn();
    await eventHandler(payload, ack);

    expect(mockMessageService.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Hello',
        parentMessageId: 456,
        isHighlighted: true
      })
    );
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  test('测试用例21: 消息payload解析（混合格式）', async () => {
    const payload = {
      text: 'Hello'
      // 缺少clientId和parentMessageId
    };

    mockMessageService.saveMessage.mockResolvedValue({
      id: 1,
      roomId: 'room1',
      nickname: 'testuser',
      text: 'Hello',
      createdAt: Date.now()
    });

    const ack = jest.fn();
    await eventHandler(payload, ack);

    expect(mockMessageService.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Hello',
        parentMessageId: null,
        isHighlighted: false
      })
    );
  });

  test('测试用例26: 消息广播到房间所有用户', async () => {
    const mockEmit = jest.fn();
    mockIo.to.mockReturnValue({ emit: mockEmit });

    mockMessageService.saveMessage.mockResolvedValue({
      id: 1,
      roomId: 'room1',
      nickname: 'testuser',
      text: 'Hello',
      createdAt: Date.now()
    });

    const ack = jest.fn();
    await eventHandler('Hello', ack);

    expect(mockIo.to).toHaveBeenCalledWith('room1');
    expect(mockEmit).toHaveBeenCalledWith('chat_message', expect.any(Object));
  });

  test('测试用例27: clientId包含在广播消息中', async () => {
    const mockEmit = jest.fn();
    mockIo.to.mockReturnValue({ emit: mockEmit });

    const payload = {
      text: 'Hello',
      clientId: 'client-123'
    };

    mockMessageService.saveMessage.mockResolvedValue({
      id: 1,
      roomId: 'room1',
      nickname: 'testuser',
      text: 'Hello',
      createdAt: Date.now()
    });

    const ack = jest.fn();
    await eventHandler(payload, ack);

    expect(mockEmit).toHaveBeenCalledWith(
      'chat_message',
      expect.objectContaining({
        clientId: 'client-123'
      })
    );
  });

  test('测试用例28: roomId包含在广播消息中', async () => {
    const mockEmit = jest.fn();
    mockIo.to.mockReturnValue({ emit: mockEmit });

    mockMessageService.saveMessage.mockResolvedValue({
      id: 1,
      roomId: 'room1',
      nickname: 'testuser',
      text: 'Hello',
      createdAt: Date.now()
    });

    const ack = jest.fn();
    await eventHandler('Hello', ack);

    expect(mockEmit).toHaveBeenCalledWith(
      'chat_message',
      expect.objectContaining({
        roomId: 'room1'
      })
    );
  });

  test('错误处理测试', async () => {
    mockMessageService.saveMessage.mockRejectedValue(new Error('Database error'));

    const ack = jest.fn();
    await eventHandler('Hello', ack);

    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: ErrorCodes.SEND_MESSAGE_ERROR
      })
    );
  });

  test('空payload处理', async () => {
    const ack = jest.fn();
    await eventHandler(null, ack);

    expect(mockMessageService.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: ''
      })
    );
  });
});

