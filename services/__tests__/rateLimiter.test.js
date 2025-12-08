// 频率限制测试
const rateLimiter = require('../rateLimiter');

describe('频率限制测试', () => {
  const socketId = 'test-socket-123';

  beforeEach(() => {
    // 每个测试前初始化socket
    rateLimiter.initSocket(socketId);
  });

  afterEach(() => {
    // 每个测试后清理
    rateLimiter.cleanupSocket(socketId);
  });

  test('测试用例17: 频率限制检查（正常情况）', () => {
    const result = rateLimiter.checkRateLimit(socketId);
    expect(result.allowed).toBe(true);
  });

  test('测试用例18: 频率限制检查（超过限制）', () => {
    // 快速发送5条消息（达到限制）
    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.checkRateLimit(socketId);
      expect(result.allowed).toBe(true);
    }
    
    // 第6条应该被拒绝
    const result = rateLimiter.checkRateLimit(socketId);
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('过于频繁');
  });

  test('测试用例18变体: 发送5条消息后应该通过', () => {
    // 发送5条消息（正好达到限制）
    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.checkRateLimit(socketId);
      expect(result.allowed).toBe(true);
    }
  });

  test('测试用例18变体: 时间窗口过期后可以继续发送', async () => {
    // 发送5条消息
    for (let i = 0; i < 5; i++) {
      rateLimiter.checkRateLimit(socketId);
    }
    
    // 等待4秒（超过3秒窗口）
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // 应该可以继续发送
    const result = rateLimiter.checkRateLimit(socketId);
    expect(result.allowed).toBe(true);
  });

  test('测试用例18变体: 时间窗口内旧记录被清理', async () => {
    // 发送3条消息
    for (let i = 0; i < 3; i++) {
      rateLimiter.checkRateLimit(socketId);
    }
    
    // 等待4秒（超过3秒窗口）
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // 再发送3条消息（总共6条，但前3条已过期）
    for (let i = 0; i < 3; i++) {
      const result = rateLimiter.checkRateLimit(socketId);
      expect(result.allowed).toBe(true);
    }
    
    // 再发送2条（总共5条在窗口内）
    for (let i = 0; i < 2; i++) {
      const result = rateLimiter.checkRateLimit(socketId);
      expect(result.allowed).toBe(true);
    }
    
    // 第6条应该被拒绝
    const result = rateLimiter.checkRateLimit(socketId);
    expect(result.allowed).toBe(false);
  });

  test('多个socket独立计数', () => {
    const socketId2 = 'test-socket-456';
    rateLimiter.initSocket(socketId2);
    
    try {
      // socket1发送5条
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkRateLimit(socketId);
      }
      
      // socket2应该不受影响，可以发送
      const result = rateLimiter.checkRateLimit(socketId2);
      expect(result.allowed).toBe(true);
    } finally {
      rateLimiter.cleanupSocket(socketId2);
    }
  });

  test('未初始化的socket应该也能工作（自动创建）', () => {
    const newSocketId = 'new-socket-789';
    const result = rateLimiter.checkRateLimit(newSocketId);
    expect(result.allowed).toBe(true);
    
    // 清理
    rateLimiter.cleanupSocket(newSocketId);
  });
});

