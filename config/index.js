// --- config/index.js ---
// 集中管理所有配置项，支持环境变量和默认值

// 解析命令行参数
const args = process.argv.slice(2);

/**
 * 服务器配置
 */
const serverConfig = {
  // 端口配置（优先级：命令行参数 > 环境变量 > 默认值）
  port: (() => {
    let port = Number(process.env.LINK_SPACE_PORT || 3000);
    // 检查命令行参数
    if (args.length > 0) {
      const firstArg = args[0].toLowerCase();
      if (firstArg === "ngrok") {
        // ngrok模式下，端口可以从第二个参数获取
        if (args.length > 1 && !isNaN(Number(args[1]))) {
          port = Number(args[1]);
        }
      } else if (!isNaN(Number(firstArg))) {
        port = Number(firstArg);
      }
    }
    return port;
  })(),
  
  // ngrok 开关（从命令行参数获取）
  enableNgrok: (() => {
    if (args.length > 0 && args[0].toLowerCase() === "ngrok") {
      return true;
    }
    return false;
  })(),
  
  // ngrok authtoken（从环境变量获取）
  ngrokAuthtoken: process.env.NGROK_AUTHTOKEN || null,
};

/**
 * 消息配置
 */
const messageConfig = {
  // 消息保留天数（从环境变量获取，默认1天）
  retentionDays: Number(process.env.MESSAGE_RETENTION_DAYS || 1),
  
  // 消息自动清理间隔（每小时执行一次）
  cleanupInterval: 60 * 60 * 1000, // 1小时
};

/**
 * 清理配置
 */
const cleanupConfig = {
  // 房间和用户列表清理延迟（断开连接后3分钟删除）
  delay: 3 * 60 * 1000, // 3分钟
};

/**
 * 监控配置
 */
const monitorConfig = {
  // 内存告警阈值（80%）
  memoryAlertThreshold: 0.8,
  
  // 健康检查间隔（3分钟）
  healthCheckInterval: 3 * 60 * 1000, // 3分钟
  
  // 慢请求阈值（毫秒）
  slowRequestThreshold: 1000,
};

/**
 * 日志配置
 */
const logConfig = {
  // 请求日志开关（从环境变量获取，默认关闭）
  enableRequestLog: process.env.ENABLE_REQUEST_LOG === 'true',
};

/**
 * 频率限制配置
 */
const rateLimitConfig = {
  // 频率限制时间窗口（3秒）
  window: 3000, // 3秒
  
  // 频率限制最大消息数（每窗口最多5条）
  max: 5,
};

/**
 * Socket.IO 配置
 */
const socketConfig = {
  pingTimeout: 60000,      // 60秒超时
  pingInterval: 25000,     // 25秒心跳间隔
  transports: ['websocket', 'polling'], // 支持 WebSocket 和轮询
  allowEIO3: true          // 兼容旧版本客户端
};

// 导出所有配置
module.exports = {
  server: serverConfig,
  message: messageConfig,
  cleanup: cleanupConfig,
  monitor: monitorConfig,
  log: logConfig,
  rateLimit: rateLimitConfig,
  socket: socketConfig,
};

