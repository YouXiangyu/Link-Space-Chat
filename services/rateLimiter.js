/**
 * 消息频率限制服务
 * 
 * 这个模块用于防止用户刷屏（短时间内发送大量消息）。
 * 
 * 工作原理：
 * 1. 记录每个用户最近发送消息的时间戳
 * 2. 当用户发送新消息时，检查在时间窗口内（默认3秒）是否已发送超过限制（默认5条）
 * 3. 如果超过限制，拒绝发送并返回错误提示
 * 
 * 为什么需要频率限制？
 * - 防止恶意用户刷屏，影响其他用户体验
 * - 减少服务器处理压力
 * - 保护数据库不被大量写入请求压垮
 * 
 * 数据结构：
 * - socketMessageTimes: Map<Socket连接ID, 时间戳数组>
 *   例如：{ "socket123" => [1704067200000, 1704067201000, ...] }
 */

const config = require("../config");

// 消息时间记录：Map<Socket连接ID, 时间戳数组>
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
 * 检查用户是否超过消息频率限制
 * 
 * 检查逻辑：
 * 1. 获取该用户最近发送消息的时间戳列表
 * 2. 过滤出在时间窗口内（默认3秒）的时间戳
 * 3. 如果时间窗口内的消息数 >= 最大限制（默认5条），则拒绝发送
 * 4. 如果未超过限制，记录本次消息时间戳，允许发送
 * 
 * @param {string} socketId - Socket 连接 ID（用于标识是哪个用户）
 * @returns {Object} 检查结果
 *   - allowed: boolean - 是否允许发送
 *   - message?: string - 如果拒绝，返回错误提示信息
 */
function checkRateLimit(socketId) {
  const now = Date.now();
  const messageTimes = socketMessageTimes.get(socketId) || [];
  
  // 清理超过时间窗口的旧记录（只保留最近3秒内的记录）
  const recentTimes = messageTimes.filter(time => now - time < config.rateLimit.window);
  
  // 检查是否超过频率限制（默认：3秒内最多5条）
  if (recentTimes.length >= config.rateLimit.max) {
    return {
      allowed: false,
      message: "消息发送过于频繁，请稍后再试"
    };
  }
  
  // 记录本次消息时间戳
  recentTimes.push(now);
  socketMessageTimes.set(socketId, recentTimes);
  
  return { allowed: true };
}

module.exports = {
  initSocket,
  cleanupSocket,
  checkRateLimit
};

