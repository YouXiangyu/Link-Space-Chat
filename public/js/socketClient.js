// --- public/js/socketClient.js ---
// Socket.IO客户端封装模块

import { stateStore } from './stateStore.js';
import { appendMessage, updateRoomInfo, updateUserList, replaceMessage } from './uiRenderer.js';
import { getRoomIdFromPath } from './utils.js';

/**
 * Socket客户端类
 */
class SocketClient {
  constructor(socket, elements, callbacks) {
    this.socket = socket;
    this.elements = elements;
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  /**
   * 设置Socket事件监听
   */
  setupEventListeners() {
    // 接收历史消息
    this.socket.on("history", (msgs) => {
      const { messages } = this.elements;
      if (!messages) return;
      messages.innerHTML = "";
      stateStore.clearMessages();
      msgs.forEach(msg => {
        appendMessage(messages, msg, this.callbacks.onReplyClick);
      });
    });

    // 接收新消息
    this.socket.on("chat_message", (msg) => {
      const { messages } = this.elements;
      if (!messages) return;
      
      // 如果有clientId，尝试替换发送中的消息
      if (msg.clientId) {
        replaceMessage(messages, msg.clientId, msg, this.callbacks.onReplyClick);
      } else {
        appendMessage(messages, msg, this.callbacks.onReplyClick);
      }
    });

    // 接收房间用户列表
    this.socket.on("room_users", (users) => {
      updateUserList(this.elements.userList, users);
    });

    // 接收房间信息
    this.socket.on("room_info", (room) => {
      stateStore.currentRoom = room;
      stateStore.isCreator = room.isCreator || false;
      if (this.callbacks.onRoomInfoUpdate) {
        this.callbacks.onRoomInfoUpdate(room);
      }
    });

    // 接收房间刷新通知
    this.socket.on("room_refresh", (data) => {
      const { messages } = this.elements;
      if (messages) {
        messages.innerHTML = "";
        stateStore.clearMessages();
      }
      if (this.callbacks.onRoomRefresh) {
        this.callbacks.onRoomRefresh(data);
      }
    });
  }

  /**
   * 加入房间
   * @param {string} roomId - 房间ID
   * @param {string} nickname - 昵称
   * @param {string|null} password - 房间密码
   * @returns {Promise<{success: boolean, needsPassword?: boolean, error?: string, room?: Object}>} 加入结果
   */
  joinRoom(roomId, nickname, password = null) {
    return new Promise((resolve) => {
      this.socket.emit("join_room", { roomId, nickname, password }, (resp) => {
        if (resp?.ok) {
          // 注意：room_info事件会在join_room成功后自动触发，这里先设置基本信息
          stateStore.setRoom(roomId, null, false); // room信息会通过room_info事件更新
          resolve({ success: true });
        } else if (resp?.error === "PASSWORD_REQUIRED") {
          resolve({ success: false, needsPassword: true });
        } else {
          resolve({ success: false, error: resp?.message || resp?.error || "加入失败" });
        }
      });
    });
  }

  /**
   * 离开房间
   */
  leaveRoom() {
    this.socket.emit("leave_room");
    stateStore.reset();
  }

  /**
   * 发送消息
   * @param {string} text - 消息文本
   * @param {number|null} parentMessageId - 父消息ID
   * @param {boolean} isHighlighted - 是否高亮
   * @param {string} clientId - 客户端ID
   * @returns {Promise<boolean>} 是否发送成功
   */
  sendMessage(text, parentMessageId = null, isHighlighted = false, clientId = null) {
    return new Promise((resolve) => {
      this.socket.emit("chat_message", {
        text,
        parentMessageId,
        isHighlighted,
        clientId
      }, (resp) => {
        resolve(resp?.ok || false);
      });
    });
  }

  /**
   * 获取房间信息
   */
  getRoomInfo() {
    return new Promise((resolve) => {
      this.socket.emit("get_room_info", {}, (resp) => {
        if (resp?.ok && resp.room) {
          resolve(resp.room);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * 更新房间信息
   * @param {Object} updates - 更新内容
   * @returns {Promise<boolean>} 是否更新成功
   */
  updateRoom(updates) {
    return new Promise((resolve) => {
      this.socket.emit("update_room", updates, (resp) => {
        resolve(resp?.ok || false);
      });
    });
  }
}

export default SocketClient;

