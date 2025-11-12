// --- middlewares/slowRequestTracker.js ---
// 慢请求监控中间件：追踪超过阈值的慢请求，供健康检查使用

const config = require("../config");

// 慢请求记录数组（最多保留100条）
const slowRequests = [];

/**
 * 慢请求追踪中间件
 * 记录超过阈值的请求，供健康检查端点使用
 */
function slowRequestTracker() {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalEnd = res.end;
    
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      if (duration > config.monitor.slowRequestThreshold) {
        slowRequests.push({
          method: req.method,
          path: req.path,
          duration: duration,
          timestamp: Date.now()
        });
        // 只保留最近100条慢请求记录
        if (slowRequests.length > 100) {
          slowRequests.shift();
        }
      }
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

/**
 * 获取慢请求记录（供健康检查使用）
 * @returns {Array} 最近10条慢请求记录
 */
function getSlowRequests() {
  return slowRequests.slice(-10);
}

/**
 * 获取所有慢请求记录（用于调试）
 * @returns {Array} 所有慢请求记录（最多100条）
 */
function getAllSlowRequests() {
  return slowRequests.slice();
}

module.exports = {
  slowRequestTracker,
  getSlowRequests,
  getAllSlowRequests
};

