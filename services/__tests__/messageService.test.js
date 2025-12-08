// 消息服务测试
const messageService = require('../messageService');

describe('消息服务测试', () => {
  describe('detectHighlight函数', () => {
    test('测试用例12: 高亮消息检测（#开头）', () => {
      expect(messageService.detectHighlight('# 标题消息')).toBe(true);
    });

    test('测试用例12变体: 检测普通消息（非#开头）', () => {
      expect(messageService.detectHighlight('普通消息')).toBe(false);
    });

    test('测试用例12变体: 检测高亮消息（前有空格）', () => {
      expect(messageService.detectHighlight(' # 标题')).toBe(true);
    });

    test('测试用例12变体: 检测无效消息（#后无空格）', () => {
      expect(messageService.detectHighlight('#标题')).toBe(false);
    });

    test('测试用例12变体: 处理null或undefined', () => {
      expect(messageService.detectHighlight(null)).toBe(false);
      expect(messageService.detectHighlight(undefined)).toBe(false);
    });

    test('测试用例12变体: 处理空字符串', () => {
      expect(messageService.detectHighlight('')).toBe(false);
      expect(messageService.detectHighlight('   ')).toBe(false);
    });

    test('测试用例12变体: 处理非字符串类型', () => {
      expect(messageService.detectHighlight(123)).toBe(false);
      expect(messageService.detectHighlight({})).toBe(false);
      expect(messageService.detectHighlight([])).toBe(false);
    });

    test('测试用例12变体: 边界情况 - 只有#和空格', () => {
      expect(messageService.detectHighlight('# ')).toBe(false); // 没有后续字符
      expect(messageService.detectHighlight('#  ')).toBe(false);
    });
  });

  describe('saveMessage函数', () => {
    // Mock数据库
    const mockDb = {
      saveMessage: jest.fn()
    };

    beforeEach(() => {
      mockDb.saveMessage.mockClear();
    });

    test('测试用例22: 普通消息保存', async () => {
      const mockMessage = {
        id: 1,
        roomId: 'room1',
        nickname: 'test',
        text: 'Hello World',
        createdAt: Date.now(),
        isHighlighted: false
      };
      mockDb.saveMessage.mockResolvedValue(mockMessage);

      const result = await messageService.saveMessage({
        db: mockDb,
        roomId: 'room1',
        nickname: 'test',
        text: 'Hello World',
        createdAt: Date.now(),
        isHighlighted: false
      });

      expect(mockDb.saveMessage).toHaveBeenCalled();
      expect(result.isHighlighted).toBe(false);
    });

    test('测试用例23: 高亮消息保存', async () => {
      const mockMessage = {
        id: 2,
        roomId: 'room1',
        nickname: 'test',
        text: '# 标题',
        createdAt: Date.now(),
        isHighlighted: true
      };
      mockDb.saveMessage.mockResolvedValue(mockMessage);

      const result = await messageService.saveMessage({
        db: mockDb,
        roomId: 'room1',
        nickname: 'test',
        text: '# 标题',
        createdAt: Date.now(),
        isHighlighted: true
      });

      expect(mockDb.saveMessage).toHaveBeenCalled();
      expect(result.isHighlighted).toBe(true);
    });

    test('测试用例24: 回复消息保存（带parentMessageId）', async () => {
      const mockMessage = {
        id: 3,
        roomId: 'room1',
        nickname: 'test',
        text: '回复消息',
        createdAt: Date.now(),
        parentMessageId: 123,
        isHighlighted: false
      };
      mockDb.saveMessage.mockResolvedValue(mockMessage);

      const result = await messageService.saveMessage({
        db: mockDb,
        roomId: 'room1',
        nickname: 'test',
        text: '回复消息',
        createdAt: Date.now(),
        parentMessageId: 123,
        isHighlighted: false
      });

      expect(mockDb.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          parentMessageId: 123
        })
      );
      expect(result.parentMessageId).toBe(123);
    });

    test('测试用例25: 消息高亮自动检测', async () => {
      const mockMessage = {
        id: 4,
        roomId: 'room1',
        nickname: 'test',
        text: '# 标题',
        createdAt: Date.now(),
        isHighlighted: true
      };
      mockDb.saveMessage.mockResolvedValue(mockMessage);

      // 不指定isHighlighted，应该自动检测
      const result = await messageService.saveMessage({
        db: mockDb,
        roomId: 'room1',
        nickname: 'test',
        text: '# 标题',
        createdAt: Date.now()
      });

      expect(mockDb.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          isHighlighted: true // 应该自动检测为true
        })
      );
    });

    test('测试用例25变体: 普通消息自动检测为不高亮', async () => {
      const mockMessage = {
        id: 5,
        roomId: 'room1',
        nickname: 'test',
        text: '普通消息',
        createdAt: Date.now(),
        isHighlighted: false
      };
      mockDb.saveMessage.mockResolvedValue(mockMessage);

      const result = await messageService.saveMessage({
        db: mockDb,
        roomId: 'room1',
        nickname: 'test',
        text: '普通消息',
        createdAt: Date.now()
      });

      expect(mockDb.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          isHighlighted: false // 应该自动检测为false
        })
      );
    });
  });
});

