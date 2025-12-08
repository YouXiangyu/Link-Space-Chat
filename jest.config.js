module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // 需要收集覆盖率的文件
  collectCoverageFrom: [
    'config/**/*.js',
    'services/**/*.js',
    'socket/handlers/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**'
  ],
  
  // 覆盖率阈值（可选）
  // 注意：只对测试覆盖的文件设置阈值
  coverageThreshold: {
    './config/index.js': {
      branches: 40,
      functions: 100,
      lines: 60,
      statements: 60
    },
    './services/messageService.js': {
      branches: 80,
      functions: 60,
      lines: 80,
      statements: 80
    },
    './services/rateLimiter.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './socket/handlers/chatMessage.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // 测试前执行的脚本
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 测试超时时间（毫秒）
  testTimeout: 10000
};

