// --- services/healthReporter.js ---
// 健康检查快照生成服务：封装获取系统健康状态信息的逻辑

const os = require("os");

/**
 * 构建健康检查快照
 * @param {Object} params - 参数对象
 * @param {Object} params.io - Socket.IO 实例
 * @param {Object} params.db - 数据库实例
 * @param {Function} params.getSlowRequests - 获取慢请求的函数
 * @param {Map} params.roomState - 房间状态 Map（roomIdToUsers）
 * @returns {Promise<Object>} 健康检查快照对象
 */
async function buildHealthSnapshot({ io, db, getSlowRequests, roomState }) {
  // 获取内存使用情况
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = usedMem / totalMem;
  
  // 获取数据库统计信息
  const dbStats = await db.getDatabaseStats();
  
  // 获取连接数
  const connectionCount = io.sockets.sockets.size;
  
  // 检查数据库连接
  const dbConnected = await db.checkConnection();
  
  // 获取慢请求记录
  const slowRequests = getSlowRequests();
  
  return {
    ok: true,
    timestamp: Date.now(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      systemTotal: Math.round(totalMem / 1024 / 1024), // MB
      systemUsed: Math.round(usedMem / 1024 / 1024), // MB
      systemFree: Math.round(freeMem / 1024 / 1024), // MB
      usagePercent: Math.round(memUsagePercent * 100) / 100
    },
    connections: {
      active: connectionCount,
      rooms: roomState ? roomState.size : 0
    },
    database: {
      connected: dbConnected,
      size: dbStats.dbSize,
      messageCount: dbStats.messageCount,
      roomCount: dbStats.roomCount,
      oldestMessageTime: dbStats.oldestMessageTime
    },
    uptime: process.uptime(),
    slowRequests: slowRequests
  };
}

module.exports = {
  buildHealthSnapshot
};

