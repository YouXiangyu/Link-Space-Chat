// --- public/js/stateStore.js ---
// 状态管理模块：集中管理应用状态

/**
 * 应用状态存储
 */
class StateStore {
  constructor() {
    this.joined = false;
    this.currentRoomId = "";
    this.currentRoom = null;
    this.isCreator = false;
    this.pendingJoin = null; // 存储待加入的房间信息（用于密码验证）
    this.messageMap = new Map(); // id -> message object
    this.replyingTo = null; // 当前回复的消息对象 { id, nickname, text }
    this.currentFeature = null; // 当前侧边栏功能页面
  }

  /**
   * 重置状态（离开房间时调用）
   */
  reset() {
    this.joined = false;
    this.currentRoomId = "";
    this.currentRoom = null;
    this.isCreator = false;
    this.pendingJoin = null;
    this.replyingTo = null;
  }

  /**
   * 设置房间信息
   * @param {string} roomId - 房间ID
   * @param {Object} room - 房间对象
   * @param {boolean} isCreator - 是否为创建者
   */
  setRoom(roomId, room, isCreator) {
    this.currentRoomId = roomId;
    this.currentRoom = room;
    this.isCreator = isCreator;
    this.joined = true;
  }

  /**
   * 添加消息到消息Map
   * @param {Object} message - 消息对象
   */
  addMessage(message) {
    if (message.id) {
      this.messageMap.set(message.id, message);
    }
  }

  /**
   * 清空消息Map
   */
  clearMessages() {
    this.messageMap.clear();
  }
}

// 导出单例
export const stateStore = new StateStore();

