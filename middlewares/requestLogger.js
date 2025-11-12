// --- middlewares/requestLogger.js ---
// 请求日志中间件：记录所有请求的详细信息（可选，通过配置控制）

const config = require("../config");

/**
 * 请求日志中间件
 * 仅在 ENABLE_REQUEST_LOG 环境变量为 'true' 时启用
 * 记录请求方法、路径、响应时间和状态码
 */
function requestLogger() {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalEnd = res.end;
    
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      const logLevel = duration > config.monitor.slowRequestThreshold ? 'SLOW' : 'INFO';
      console.log(`[${logLevel}] ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

module.exports = requestLogger;

