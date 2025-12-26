/**
 * SocketManager - 封装 Socket.IO 连接、生命周期与事件注册
 */

export class SocketManager {
  constructor() {
    this.socket = io();
    this.connected = this.socket.connected;
  }

  /**
   * 注册连接生命周期回调
   * @param {Object} handlers
   * @param {Function} handlers.onConnect
   * @param {Function} handlers.onDisconnect
   * @param {Function} handlers.onError
   */
  initLifecycleHandlers({ onConnect, onDisconnect, onError }) {
    this.socket.on('connect', () => {
      this.connected = true;
      onConnect?.(this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error) => {
      this.connected = false;
      onError?.(error);
    });

    // 初始状态同步
    if (this.socket.connected) {
      this.connected = true;
      onConnect?.(this.socket.id);
    }
  }

  /**
   * 注册业务事件回调
   * @param {Object} callbacks
   */
  registerCallbacks(callbacks = {}) {
    const {
      onServerPing,
      onHistory,
      onChatMessage,
      onRoomUsers,
      onRoomInfo,
      onRoomRefresh,
      onPollMessage,
      onPollResults
    } = callbacks;

    this.socket.on("server-ping", (callback) => {
      onServerPing?.();
      callback("ok");
    });

    this.socket.on("history", (list) => {
      onHistory?.(list);
    });

    this.socket.on("chat_message", (message) => {
      onChatMessage?.(message);
    });

    this.socket.on("room_users", (users) => {
      onRoomUsers?.(users);
    });

    this.socket.on("room_info", (room) => {
      onRoomInfo?.(room);
    });

    this.socket.on("room_refresh", (payload) => {
      onRoomRefresh?.(payload);
    });

    this.socket.on("poll_message", (data) => {
      onPollMessage?.(data);
    });

    this.socket.on("poll_results", (data) => {
      onPollResults?.(data);
    });
  }

  joinRoom(roomId, nickname, password = null, callback) {
    this.socket.emit("join_room", { roomId, nickname, password }, callback);
  }

  leaveRoom() {
    this.socket.emit("leave_room");
  }

  sendMessage(data, callback) {
    this.socket.emit("chat_message", data, callback);
  }

  requestRoomInfo(callback) {
    this.socket.emit("get_room_info", callback);
  }

  updateRoom(updates, callback) {
    this.socket.emit("update_room", updates, callback);
  }

  createPoll(data, callback) {
    this.socket.emit("create_poll", data, callback);
  }

  vote(data, callback) {
    this.socket.emit("vote", data, callback);
  }

  getPollResults(pollId, callback) {
    this.socket.emit("get_poll_results", { pollId }, callback);
  }

  isConnected() {
    return this.connected;
  }

  get raw() {
    return this.socket;
  }
}









