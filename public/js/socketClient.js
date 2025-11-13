/**
 * Socket.IO客户端封装模块
 */

export class SocketClient {
  constructor() {
    this.socket = io();
    this.callbacks = {};
  }

  /**
   * 设置回调函数
   * @param {object} callbacks - 回调函数对象
   */
  setCallbacks(callbacks) {
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 服务器ping
    this.socket.on("server-ping", (callback) => {
      callback("ok");
    });

    // 历史消息
    this.socket.on("history", (list) => {
      if (this.callbacks.onHistory) {
        this.callbacks.onHistory(list);
      }
    });

    // 聊天消息
    this.socket.on("chat_message", (m) => {
      if (this.callbacks.onChatMessage) {
        this.callbacks.onChatMessage(m);
      }
    });

    // 房间用户列表
    this.socket.on("room_users", (users) => {
      if (this.callbacks.onRoomUsers) {
        this.callbacks.onRoomUsers(users);
      }
    });

    // 房间信息
    // 注意：直接传递 room 对象，不要修改 stateStore.isCreator
    // 让 updateRoomInfo 函数从 room.isCreator 读取
    this.socket.on("room_info", (room) => {
      if (this.callbacks.onRoomInfo) {
        this.callbacks.onRoomInfo(room);
      }
    });

    // 房间刷新
    this.socket.on("room_refresh", (data) => {
      if (this.callbacks.onRoomRefresh) {
        this.callbacks.onRoomRefresh(data);
      }
    });
  }

  /**
   * 加入房间
   * @param {string} roomId - 房间ID
   * @param {string} nickname - 昵称
   * @param {string|null} password - 密码
   * @param {Function} callback - 回调函数
   */
  joinRoom(roomId, nickname, password = null, callback) {
    this.socket.emit("join_room", { roomId, nickname, password }, callback);
  }

  /**
   * 离开房间
   */
  leaveRoom() {
    this.socket.emit("leave_room");
  }

  /**
   * 发送消息
   * @param {object} data - 消息数据
   * @param {Function} callback - 回调函数
   */
  sendMessage(data, callback) {
    this.socket.emit("chat_message", data, callback);
  }

  /**
   * 获取房间信息
   */
  getRoomInfo() {
    this.socket.emit("get_room_info");
  }

  /**
   * 更新房间
   * @param {object} updates - 更新数据
   * @param {Function} callback - 回调函数
   */
  updateRoom(updates, callback) {
    this.socket.emit("update_room", updates, callback);
  }
}

