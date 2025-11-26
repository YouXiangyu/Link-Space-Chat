// --- services/messageService.js ---
// 消息服务：负责消息保存、历史查询、回复与高亮处理

/**
 * 检测消息是否应该高亮（以 # 开头的标题格式）
 * @param {string} text - 消息文本
 * @returns {boolean} 是否高亮
 */
function detectHighlight(text) {
  if (!text || typeof text !== 'string') return false;
  // 检测是否以 # 开头，后跟空格和至少一个字符
  const trimmed = text.trim();
  return /^#\s+.+/.test(trimmed);
}

/**
 * 处理并保存消息
 * @param {Object} params - 参数对象
 * @param {Object} params.db - 数据库实例
 * @param {string} params.roomId - 房间ID
 * @param {string} params.nickname - 用户昵称
 * @param {string} params.text - 消息文本
 * @param {number} params.createdAt - 创建时间戳
 * @param {number|null} params.parentMessageId - 父消息ID（可选）
 * @param {boolean} params.isHighlighted - 是否高亮（可选，如果未指定则自动检测）
 * @returns {Promise<Object>} 保存的消息对象
 */
async function saveMessage({ db, roomId, nickname, text, createdAt, parentMessageId = null, isHighlighted = false }) {
  // 检测高亮（如果前端未指定，则自动检测）
  const shouldHighlight = isHighlighted || detectHighlight(text);
  
  // 保存消息到数据库
  const message = await db.saveMessage({
    roomId,
    nickname,
    text,
    createdAt,
    parentMessageId,
    isHighlighted: shouldHighlight
  });
  
  return message;
}

/**
 * 获取房间的历史消息
 * @param {Object} db - 数据库实例
 * @param {string} roomId - 房间ID
 * @param {number} limit - 消息数量限制
 * @returns {Promise<Array>} 消息数组
 */
async function getRecentMessages(db, roomId, limit = 20) {
  return await db.getRecentMessages(roomId, limit);
}

module.exports = {
  detectHighlight,
  saveMessage,
  getRecentMessages
};

