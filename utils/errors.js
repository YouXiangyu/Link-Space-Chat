// --- utils/errors.js ---
// 统一错误处理：定义错误码和错误响应格式

/**
 * 错误码枚举
 */
const ErrorCodes = {
  // 通用错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  
  // 房间相关错误
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',
  NICKNAME_TAKEN: 'NICKNAME_TAKEN',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  NOT_CREATOR: 'NOT_CREATOR',
  DEFAULT_ROOM_NO_PASSWORD: 'DEFAULT_ROOM_NO_PASSWORD',
  
  // 消息相关错误
  RATE_LIMIT: 'RATE_LIMIT',
  SEND_MESSAGE_ERROR: 'SEND_MESSAGE_ERROR',
  
  // 数据库相关错误
  HEALTH_CHECK_ERROR: 'HEALTH_CHECK_ERROR',
  
  // Socket事件错误
  JOIN_ROOM_ERROR: 'JOIN_ROOM_ERROR',
  GET_ROOM_INFO_ERROR: 'GET_ROOM_INFO_ERROR',
  UPDATE_ROOM_ERROR: 'UPDATE_ROOM_ERROR'
};

/**
 * 创建错误响应对象（用于Socket事件）
 * @param {string} errorCode - 错误码
 * @param {string} message - 错误消息
 * @returns {Object} 错误响应对象
 */
function createErrorResponse(errorCode, message) {
  return {
    ok: false,
    error: errorCode,
    message: message
  };
}

/**
 * 创建成功响应对象（用于Socket事件）
 * @param {Object} data - 响应数据（可选）
 * @returns {Object} 成功响应对象
 */
function createSuccessResponse(data = {}) {
  return {
    ok: true,
    ...data
  };
}

/**
 * 发送HTTP错误响应
 * @param {Object} res - Express响应对象
 * @param {number} statusCode - HTTP状态码
 * @param {string} errorCode - 错误码
 * @param {string} message - 错误消息
 */
function sendError(res, statusCode, errorCode, message) {
  res.status(statusCode).json({
    ok: false,
    error: errorCode,
    message: message
  });
}

module.exports = {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
  sendError
};

