// --- services/rateLimiter.js ---
// 消息频率限制服务：封装消息时间窗口、存储与检查逻辑

const config = require("../config");

// 消息时间记录：Map<socketId, Array<timestamp>>
const socketMessageTimes = new Map();

/**
 * 初始化socket的消息时间记录
 * @param {string} socketId - Socket ID
 */
function initSocket(socketId) {
  socketMessageTimes.set(socketId, []);
}

/**
 * 清理socket的消息时间记录
 * @param {string} socketId - Socket ID
 */
function cleanupSocket(socketId) {
  socketMessageTimes.delete(socketId);
}

/**
 * 检查是否超过频率限制
 * @param {string} socketId - Socket ID
 * @returns {Object} { allowed: boolean, message?: string }
 */
function checkRateLimit(socketId) {
  const now = Date.now();
  const messageTimes = socketMessageTimes.get(socketId) || [];
  
  // 清理超过时间窗口的旧记录
  const recentTimes = messageTimes.filter(time => now - time < config.rateLimit.window);
  
  // 检查是否超过频率限制
  if (recentTimes.length >= config.rateLimit.max) {
    return {
      allowed: false,
      message: "消息发送过于频繁，请稍后再试"
    };
  }
  
  // 记录本次消息时间
  recentTimes.push(now);
  socketMessageTimes.set(socketId, recentTimes);
  
  return { allowed: true };
}

module.exports = {
  initSocket,
  cleanupSocket,
  checkRateLimit
};

