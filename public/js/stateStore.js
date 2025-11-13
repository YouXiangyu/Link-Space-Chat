/**
 * 状态管理模块
 */

export class StateStore {
  constructor() {
    this.joined = false;
    this.currentRoomId = "";
    this.currentRoom = null;
    this.isCreator = false;
    this.pendingJoin = null; // 存储待加入的房间信息（用于密码验证）
    this.messageMap = new Map(); // id -> message object
    this.replyingTo = null; // 当前回复的消息对象 { id, nickname, text }
    this.currentFeature = null;
  }

  /**
   * 重置状态
   */
  reset() {
    this.joined = false;
    this.currentRoomId = "";
    this.currentRoom = null;
    this.isCreator = false;
    this.pendingJoin = null;
    this.messageMap.clear();
    this.replyingTo = null;
    this.currentFeature = null;
  }

  /**
   * 设置房间信息
   * @param {string} roomId - 房间ID
   * @param {object} room - 房间对象
   */
  setRoom(roomId, room) {
    this.currentRoomId = roomId;
    this.currentRoom = room;
    // 注意：isCreator 应该从 room 对象中读取，而不是单独设置
    if (room) {
      this.isCreator = room.isCreator === true;
    } else {
      this.isCreator = false;
    }
  }

  /**
   * 添加消息到Map
   * @param {object} message - 消息对象
   */
  addMessage(message) {
    if (message.id && message.status === 'sent') {
      this.messageMap.set(message.id, {
        id: message.id,
        nickname: message.nickname,
        text: message.text,
        createdAt: message.createdAt,
        parentMessageId: message.parentMessageId,
        isHighlighted: message.isHighlighted
      });
    }
  }

  /**
   * 清空消息Map
   */
  clearMessages() {
    this.messageMap.clear();
  }
}

