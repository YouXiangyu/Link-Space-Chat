/**
 * RoomController - 负责加入/离开房间与历史记录加载
 */

export class RoomController {
  constructor({ socketManager, state, messageMap, elements, helpers }) {
    this.socketManager = socketManager;
    this.state = state;
    this.messageMap = messageMap;
    this.elements = elements;
    this.helpers = helpers;
  }

  /**
   * 请求历史消息（通过 Socket 事件，统一使用 history 事件处理）
   * 注意：历史消息由 Socket 的 history 事件统一处理，此方法仅用于触发请求
   */
  requestHistory(roomId) {
    // 通过 Socket 请求历史消息，后端会在 join_room 时自动发送 history 事件
    // 如果需要手动刷新，可以发送一个 get_room_info 事件来触发
    // 目前 join_room 已经会自动发送 history，所以这个方法可以保留为空或移除
    // 保留此方法是为了兼容 onRoomRefresh 中的调用
  }

  leaveCurrentRoom() {
    const { messages, searchInput, searchResults } = this.elements;
    if (!this.state.joined) return;

    this.socketManager.leaveRoom();
    this.state.joined = false;
    this.state.currentRoom = null;
    this.state.isCreator = false;
    this.state.myNickname = null;
    this.state.myClientId = null;

    if (this.helpers.cyberTheme?.leaveInterface) {
      this.helpers.cyberTheme.leaveInterface();
    }

    if (messages) {
      messages.innerHTML = '';
      this.helpers.showInitialGuidance?.(messages);
    }

    this.messageMap.clear();
    this.helpers.cancelReply?.();

    if (searchInput) searchInput.value = "";
    if (searchResults) searchResults.style.display = 'none';

    if (this.helpers.cyberTheme?.hideLeaveButton) {
      this.helpers.cyberTheme.hideLeaveButton();
    }

    if (this.helpers.cyberTheme?.closeSearchPanel) {
      this.helpers.cyberTheme.closeSearchPanel();
    }

    this.helpers.updateRoomInfo?.(null);
  }

  joinRoom(roomId, nickname, password = null) {
    const { messages, passwordModal, passwordInput, roomPasswordInput } = this.elements;
    const { cyberTheme } = this.helpers;

    console.log("joinRoom called with:", { roomId, nickname, hasPassword: !!password });

    if (!this.socketManager.isConnected() || !this.socketManager.raw?.connected) {
      alert('未连接到服务器，请稍候再试');
      return;
    }

    const timeout = setTimeout(() => {
      alert('加入房间超时，请重试');
    }, 10000);

    this.socketManager.joinRoom(roomId, nickname, password, (resp) => {
      clearTimeout(timeout);
      console.log("join_room response:", resp);

      if (!resp?.ok) {
        if (resp?.error === "PASSWORD_REQUIRED") {
          this.state.pendingJoin = { roomId, nickname };
          if (passwordModal) {
            passwordModal.classList.remove("hidden");
            const errorMsg = resp?.message || "当前房间需要密码，请重试密码";
            const errorElement = document.getElementById("passwordErrorMsg");
            if (errorElement) {
              errorElement.textContent = errorMsg;
              errorElement.classList.remove("hidden");
            }
            if (passwordInput) {
              passwordInput.value = "";
              passwordInput.focus();
            }
          }
          return;
        }
        if (!this.state.joined) {
          this.helpers.showInitialGuidance?.(messages);
        }
        alert(resp?.message || resp?.error || "加入失败");
        return;
      }

      this.state.joined = true;
      this.state.currentRoomId = roomId;
      this.state.myNickname = nickname;

      console.log("Successfully joined room, entering interface...");

      // 清除历史消息修复

      /*if (messages) {
        messages.innerHTML = "";
        this.helpers.hideInitialGuidance?.(messages);
      }*/

      this.state.pendingJoin = null;

      const roomUrl = `/r/${encodeURIComponent(this.state.currentRoomId)}`;
      if (location.pathname !== roomUrl) {
        history.pushState({}, "", roomUrl);
      }

      if (cyberTheme) {
        cyberTheme.joined = true;
        cyberTheme.myNickname = nickname;
      }

      // 历史消息已通过 Socket 的 history 事件自动加载，无需额外请求

      if (cyberTheme?.enterInterface) {
        console.log("Calling cyberTheme.enterInterface()");
        cyberTheme.enterInterface();
      } else {
        console.error("cyberTheme not available or enterInterface not found");
        const loginOverlay = document.getElementById("login-overlay");
        const mainInterface = document.getElementById("main-interface");
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (mainInterface) {
          mainInterface.style.opacity = '1';
          mainInterface.style.scale = '1';
          mainInterface.style.filter = 'blur(0px)';
          mainInterface.style.pointerEvents = 'all';
        }
      }

      if (cyberTheme?.showLeaveButton) {
        cyberTheme.showLeaveButton();
      }

      if (passwordModal) {
        passwordModal.classList.add("hidden");
        const errorElement = document.getElementById("passwordErrorMsg");
        if (errorElement) {
          errorElement.classList.add("hidden");
          errorElement.textContent = "";
        }
      }
      if (roomPasswordInput) roomPasswordInput.style.display = "none";

      if (cyberTheme?.closeMobileSidebar) {
        cyberTheme.closeMobileSidebar();
      }
    });
  }
}



