/**
 * App State - 应用状态管理
 * 集中管理应用状态，避免分散在各模块中
 */

class AppState {
  constructor() {
    this._joined = false;
    this._currentRoomId = null;
    this._currentRoom = null;
    this._isCreator = false;
    this._pendingJoin = null;
    this._myNickname = null;
    this._myClientId = null;
    this._historyProcessing = false;
    this._fetchingHistory = false;
    this._replyingTo = null;
  }

  get joined() { return this._joined; }
  set joined(value) { 
    this._joined = value;
    this.notifyChange('joined', value);
  }

  get currentRoomId() { return this._currentRoomId; }
  set currentRoomId(value) { 
    this._currentRoomId = value;
    this.notifyChange('currentRoomId', value);
  }

  get currentRoom() { return this._currentRoom; }
  set currentRoom(value) { 
    this._currentRoom = value;
    this.notifyChange('currentRoom', value);
  }

  get isCreator() { return this._isCreator; }
  set isCreator(value) { 
    this._isCreator = value;
    this.notifyChange('isCreator', value);
  }

  get pendingJoin() { return this._pendingJoin; }
  set pendingJoin(value) { 
    this._pendingJoin = value;
    this.notifyChange('pendingJoin', value);
  }

  get myNickname() { return this._myNickname; }
  set myNickname(value) { 
    this._myNickname = value;
    this.notifyChange('myNickname', value);
  }

  get myClientId() { return this._myClientId; }
  set myClientId(value) { 
    this._myClientId = value;
    this.notifyChange('myClientId', value);
  }

  get historyProcessing() { return this._historyProcessing; }
  set historyProcessing(value) { 
    this._historyProcessing = value;
    this.notifyChange('historyProcessing', value);
  }

  get fetchingHistory() { return this._fetchingHistory; }
  set fetchingHistory(value) { 
    this._fetchingHistory = value;
    this.notifyChange('fetchingHistory', value);
  }

  get replyingTo() { return this._replyingTo; }
  set replyingTo(value) { 
    this._replyingTo = value;
    this.notifyChange('replyingTo', value);
  }

  notifyChange(key, value) {
    // 可以通过事件总线通知状态变化
    if (typeof window !== 'undefined' && window.eventBus) {
      window.eventBus.emit('state:change', { key, value });
    }
  }

  /**
   * 重置状态（离开房间时使用）
   */
  reset() {
    this._joined = false;
    this._currentRoom = null;
    this._isCreator = false;
    this._myNickname = null;
    this._myClientId = null;
    this._replyingTo = null;
  }
}

// 导出单例
export const appState = new AppState();

