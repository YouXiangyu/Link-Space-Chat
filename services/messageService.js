// --- services/messageService.js ---
// 消息服务：负责消息类型检测、保存、历史查询、回复与高亮处理

/**
 * 检测消息类型（高亮文本/Emoji、URL等）
 * @param {string} text - 消息文本
 * @returns {string} 消息类型：'emoji', 'text'
 */
function detectContentType(text) {
  if (!text || typeof text !== 'string') return 'text';
  
  // 检测是否可视为高亮文本（当前通过纯 Emoji 判断，只包含Emoji和空白字符）
  // Unicode Emoji范围：U+1F300-U+1F9FF, U+2600-U+26FF, U+2700-U+27BF, U+1F600-U+1F64F等
  const emojiRegex = /^[\s\p{Emoji_Presentation}\p{Emoji}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]+$/u;
  
  // 如果消息只包含Emoji和空白字符，且至少有一个Emoji字符，则认为是高亮文本
  if (emojiRegex.test(text) && /[\p{Emoji_Presentation}\p{Emoji}]/u.test(text)) {
    return 'emoji';
  }
  
  return 'text';
}

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
  // 检测消息类型
  const contentType = detectContentType(text);
  
  // 检测高亮（如果前端未指定，则自动检测）
  const shouldHighlight = isHighlighted || detectHighlight(text);
  
  // 保存消息到数据库
  const message = await db.saveMessage({
    roomId,
    nickname,
    text,
    createdAt,
    contentType,
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
  detectContentType,
  detectHighlight,
  saveMessage,
  getRecentMessages
};

