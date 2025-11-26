/**
 * Main Application Entry - Refactored Version
 * 重构后的主应用入口，使用事件总线和状态管理
 * 创建时间: 2025-01-12
 */

import { renderMessage, renderUsers, showRateLimitToast, showInitialGuidance, hideInitialGuidance, scrollToMessage } from '../uiAdapter.js';
import { cyberTheme } from '../cyberTheme.js';
import { getRoomIdFromPath, formatAbsoluteTime } from './utils/index.js';
import { SocketManager } from './modules/socketManager.js';
import { RoomController } from './modules/roomController.js';
import { createMessageController } from './modules/messageController.js';
import { createSearchController } from './modules/searchController.js';
import { ModalManager } from './modules/modalManager.js';
import { ShareManager } from './modules/shareManager.js';
import { eventBus } from './core/eventBus.js';
import { appState } from './core/appState.js';

(() => {
  // 初始化事件总线到全局（供其他模块使用）
  window.eventBus = eventBus;

  const socketManager = new SocketManager();
  const el = (id) => document.getElementById(id);

  // 消息映射
  const messageMap = new Map();

  // 初始化状态
  appState.currentRoomId = getRoomIdFromPath();

  // 获取DOM元素
  const elements = {
    messages: el("messages"),
    messageForm: el("messageForm"),
    messageInput: el("messageInput"),
    nicknameInput: el("nickname"),
    roomIdInput: el("roomIdInput"),
    roomPasswordInput: el("roomPasswordInput"),
    rateLimitToast: el("rateLimitToast"),
    replyBar: el("reply-bar"),
    replyPreviewText: el("replyPreviewText"),
    cancelReplyBtn: el("cancelReplyBtn"),
    sendButton: el("sendButton"),
    passwordModal: el("passwordModal"),
    passwordInput: el("passwordInput"),
    searchInput: el("searchInput"),
    searchResults: el("searchResults"),
    shareModal: el("shareModal"),
    qrCodeContainer: el("qrCode"),
    shareLinkInput: el("shareLinkInput"),
    copyLinkBtn: el("copyLinkBtn"),
    editRoomModal: el("editRoomModal"),
    closeEditModalBtn: el("closeEditModalBtn"),
    editRoomForm: el("editRoomForm"),
    editRoomName: el("editRoomName"),
    editRoomDescription: el("editRoomDescription"),
    editRoomPassword: el("editRoomPassword"),
    editPasswordConfirmGroup: el("editPasswordConfirmGroup"),
    editPasswordConfirm: el("editPasswordConfirm"),
    cancelEditBtn: el("cancelEditBtn"),
    editRoomBtn: el("editRoomBtn"),
    mobileEditRoomBtn: el("mobile-editRoomBtn"),
    cancelPasswordBtn: el("cancelPasswordBtn"),
    shareBtn: el("shareBtn"),
    mobileShareBtn: el("mobile-shareBtn"),
    leaveBtn: el("leaveBtn"),
    mobileLeaveBtn: el("mobile-leaveBtn"),
    prefillJoinModal: el("prefillJoinModal"),
    prefillNickname: el("prefillNickname"),
    prefillRoomId: el("prefillRoomId"),
    prefillPassword: el("prefillPassword"),
    prefillCancelBtn: el("prefillCancelBtn"),
    prefillConfirmBtn: el("prefillConfirmBtn"),
    projectInfoModal: el("projectInfoModal"),
    closeProjectInfoBtn: el("closeProjectInfoBtn"),
    projectInfoBtn: el("projectInfoBtn"),
    mobileProjectInfoBtn: el("mobile-projectInfoBtn"),
    joinBtn: el("joinBtn")
  };

  // 初始化 Socket 生命周期处理器
  socketManager.initLifecycleHandlers({
    onConnect: (id) => {
      console.log('[Socket] ✅ Connected! ID:', id);
    },
    onDisconnect: (reason) => {
      console.warn('[Socket] ❌ Disconnected. Reason:', reason);
      if (appState.joined) {
        alert('连接已断开，请刷新页面重试');
      }
    },
    onError: (error) => {
      console.error('[Socket] ❌ Connection error:', error);
      alert('无法连接到服务器，请检查网络连接。错误: ' + (error?.message || '未知错误'));
    }
  });

  // 初始化消息控制器
  const messageController = createMessageController({
    socketManager,
    state: appState,
    messageMap,
    elements: {
      messages: elements.messages,
      messageForm: elements.messageForm,
      messageInput: elements.messageInput,
      rateLimitToast: elements.rateLimitToast,
      replyBar: elements.replyBar,
      replyPreviewText: elements.replyPreviewText,
      cancelReplyBtn: elements.cancelReplyBtn,
      sendButton: elements.sendButton
    },
    helpers: {
      renderMessage,
      showRateLimitToast,
      cyberTheme
    }
  });
  messageController.init();

  // 通过事件总线暴露回复功能
  eventBus.on('message:startReply', (msg) => {
    messageController.startReply(msg);
  });
  eventBus.on('message:cancelReply', () => {
    messageController.cancelReply();
  });

  // 初始化房间控制器
  const roomController = new RoomController({
    socketManager,
    state: appState,
    messageMap,
    elements: {
      messages: elements.messages,
      passwordModal: elements.passwordModal,
      passwordInput: elements.passwordInput,
      roomPasswordInput: elements.roomPasswordInput,
      searchInput: elements.searchInput,
      searchResults: elements.searchResults
    },
    helpers: {
      hideInitialGuidance,
      showInitialGuidance,
      renderMessage,
      updateRoomInfo: (room) => {
        appState.currentRoom = room;
        appState.isCreator = room?.isCreator === true;
        if (cyberTheme && cyberTheme.updateRoomInfo) {
          cyberTheme.updateRoomInfo(room);
        }
      },
      cyberTheme,
      cancelReply: messageController.cancelReply
    }
  });

  // 初始化搜索控制器
  const searchController = createSearchController({
    elements: {
      searchInput: elements.searchInput,
      searchBtn: el("searchBtn"),
      searchResults: elements.searchResults,
      searchToggleBtn: el("searchToggleBtn"),
      mobileSearchToggleBtn: el("mobile-searchToggleBtn"),
      closeSearchBtn: el("closeSearchBtn")
    },
    messageMap,
    state: appState,
    helpers: {
      scrollToMessage: (messageId) => scrollToMessage(elements.messages, messageId),
      formatAbsoluteTime
    },
    cyberTheme
  });
  searchController.init();

  // 初始化模态框管理器
  const modalManager = new ModalManager({
    shareModal: elements.shareModal,
    editRoomModal: elements.editRoomModal,
    passwordModal: elements.passwordModal,
    prefillJoinModal: elements.prefillJoinModal,
    projectInfoModal: elements.projectInfoModal,
    closeModalBtn: el("closeModalBtn"),
    closeEditModalBtn: elements.closeEditModalBtn,
    cancelPasswordBtn: elements.cancelPasswordBtn,
    prefillCancelBtn: elements.prefillCancelBtn,
    closeProjectInfoBtn: elements.closeProjectInfoBtn
  });

  // 初始化分享管理器
  const shareManager = new ShareManager({
    shareModal: elements.shareModal,
    qrCodeContainer: elements.qrCodeContainer,
    shareLinkInput: elements.shareLinkInput,
    copyLinkBtn: elements.copyLinkBtn
  });

  // Socket 事件监听
  socketManager.registerCallbacks({
    onServerPing: () => {},
    onHistory: (list) => {
      if (!elements.messages || appState.historyProcessing) return;

      appState.historyProcessing = true;
      messageMap.clear();
      elements.messages.innerHTML = '';
      hideInitialGuidance(elements.messages);

      for (const m of list) {
        const isMyMessage = m.nickname === appState.myNickname || m.clientId === appState.myClientId;
        renderMessage(elements.messages, m, isMyMessage, messageMap);
        if (m.id) {
          messageMap.set(m.id, m);
        }
      }

      setTimeout(() => {
        appState.historyProcessing = false;
      }, 500);
    },
    onChatMessage: (message) => {
      if (!elements.messages) return;

      if (message?.clientId) {
        const tmp = elements.messages.querySelector(`[data-client-id="${message.clientId}"]`);
        if (tmp) {
          tmp.remove();
        }
      }

      const isMyMessage = message.nickname === appState.myNickname || message.clientId === appState.myClientId;
      renderMessage(elements.messages, message, isMyMessage, messageMap);

      if (message.id) {
        messageMap.set(message.id, message);
      }
    },
    onRoomUsers: (users) => {
      const userList = el("userList");
      const mobileUserList = el("mobile-userList");

      if (userList) {
        renderUsers(userList, users);
      }
      if (mobileUserList) {
        renderUsers(mobileUserList, users);
      }
    },
    onRoomInfo: (room) => {
      appState.currentRoom = room;
      appState.isCreator = room?.isCreator === true;
      if (cyberTheme && cyberTheme.updateRoomInfo) {
        cyberTheme.updateRoomInfo(room);
      }
    },
    onRoomRefresh: (data) => {
      if (!elements.messages) return;

      if (data.message) {
        elements.messages.innerHTML = '';
        const guidance = document.createElement('div');
        guidance.className = 'cyber-message';
        guidance.innerHTML = `<div class="cyber-message-body"><div class="cyber-message-text">${data.message}</div></div>`;
        elements.messages.appendChild(guidance);
      }

      // 房间刷新后，历史消息会通过 Socket 的 history 事件自动加载
    },
  });

  // 设置加入按钮事件
  function setupJoinButton() {
    if (!elements.joinBtn) {
      setTimeout(setupJoinButton, 200);
      return;
    }

    if (elements.joinBtn.dataset.listenerAttached === 'true') {
      return;
    }

    elements.joinBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (appState.joined) {
        roomController.leaveCurrentRoom();
      }

      const nickname = elements.nicknameInput ? elements.nicknameInput.value.trim() : "";
      if (!nickname) {
        alert("请输入一个昵称");
        return;
      }

      let roomId = (elements.roomIdInput ? elements.roomIdInput.value.trim() : "") || getRoomIdFromPath();
      if (!roomId) {
        roomId = "1";
      }

      const password = (elements.roomPasswordInput && elements.roomPasswordInput.style.display !== 'none')
        ? (elements.roomPasswordInput.value.trim() || null)
        : null;

      roomController.joinRoom(roomId, nickname, password);
    });

    elements.joinBtn.dataset.listenerAttached = 'true';
  }

  // 设置密码表单事件
  if (elements.passwordInput) {
    const passwordForm = el("passwordForm");
    if (passwordForm) {
      passwordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!appState.pendingJoin) return;
        const password = elements.passwordInput.value.trim();
        const errorElement = document.getElementById("passwordErrorMsg");
        if (errorElement) {
          errorElement.classList.add("hidden");
        }
        if (!password) {
          if (errorElement) {
            errorElement.textContent = "当前房间需要密码，请重试密码";
            errorElement.classList.remove("hidden");
          }
          return;
        }
        roomController.joinRoom(appState.pendingJoin.roomId, appState.pendingJoin.nickname, password);
      });
    }

    elements.passwordInput.addEventListener("input", () => {
      const errorElement = document.getElementById("passwordErrorMsg");
      if (errorElement && !errorElement.classList.contains("hidden")) {
        errorElement.classList.add("hidden");
      }
    });
  }

  // 设置离开房间按钮
  if (elements.leaveBtn) {
    elements.leaveBtn.addEventListener("click", () => roomController.leaveCurrentRoom());
  }
  if (elements.mobileLeaveBtn) {
    elements.mobileLeaveBtn.addEventListener("click", () => roomController.leaveCurrentRoom());
  }

  // 设置分享按钮
  if (elements.shareBtn) {
    elements.shareBtn.addEventListener("click", () => shareManager.openShareModal());
  }
  if (elements.mobileShareBtn) {
    elements.mobileShareBtn.addEventListener("click", () => shareManager.openShareModal());
  }

  // 设置编辑房间按钮
  if (elements.editRoomBtn) {
    elements.editRoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!appState.currentRoom) return;
      if (elements.editRoomName) elements.editRoomName.value = appState.currentRoom.name || "";
      if (elements.editRoomDescription) elements.editRoomDescription.value = appState.currentRoom.description || "";
      if (elements.editRoomPassword) elements.editRoomPassword.value = "";
      if (appState.currentRoom.password) {
        if (elements.editPasswordConfirmGroup) elements.editPasswordConfirmGroup.style.display = "block";
        if (elements.editPasswordConfirm) elements.editPasswordConfirm.checked = false;
      } else {
        if (elements.editPasswordConfirmGroup) elements.editPasswordConfirmGroup.style.display = "none";
        if (elements.editPasswordConfirm) elements.editPasswordConfirm.checked = false;
      }
      modalManager.openEditRoomModal();
    });
  }

  if (elements.mobileEditRoomBtn) {
    elements.mobileEditRoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!appState.currentRoom) return;
      if (elements.editRoomName) elements.editRoomName.value = appState.currentRoom.name || "";
      if (elements.editRoomDescription) elements.editRoomDescription.value = appState.currentRoom.description || "";
      if (elements.editRoomPassword) elements.editRoomPassword.value = "";
      if (appState.currentRoom.password) {
        if (elements.editPasswordConfirmGroup) elements.editPasswordConfirmGroup.style.display = "block";
        if (elements.editPasswordConfirm) elements.editPasswordConfirm.checked = false;
      } else {
        if (elements.editPasswordConfirmGroup) elements.editPasswordConfirmGroup.style.display = "none";
        if (elements.editPasswordConfirm) elements.editPasswordConfirm.checked = false;
      }
      modalManager.openEditRoomModal();
      if (cyberTheme && cyberTheme.closeMobileSidebar) {
        cyberTheme.closeMobileSidebar();
      }
    });
  }

  // 设置编辑房间表单
  if (elements.editRoomForm) {
    elements.editRoomForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!appState.joined) return;

      const newName = elements.editRoomName ? elements.editRoomName.value.trim() || null : null;
      const newDesc = elements.editRoomDescription ? elements.editRoomDescription.value.trim() || null : null;
      const newPwdRaw = elements.editRoomPassword ? elements.editRoomPassword.value.trim() : "";

      const updates = {};
      updates.name = newName;
      updates.description = newDesc;

      const hadPassword = !!(appState.currentRoom && appState.currentRoom.password);
      const wantsPwdChange = newPwdRaw.length > 0 || (hadPassword && newPwdRaw.length === 0);
      if (hadPassword) {
        if (wantsPwdChange && (!elements.editPasswordConfirm || !elements.editPasswordConfirm.checked)) {
          alert("请勾选\"修改密码并清空聊天记录\"以确认修改密码。");
          return;
        }
        if (elements.editPasswordConfirm && elements.editPasswordConfirm.checked && wantsPwdChange) {
          updates.password = newPwdRaw || null;
        }
      } else {
        if (wantsPwdChange) {
          updates.password = newPwdRaw || null;
        }
      }

      socketManager.updateRoom(updates, (resp) => {
        if (!resp?.ok) {
          alert(resp?.message || resp?.error || "更新失败");
          return;
        }
        modalManager.closeEditRoomModal();
        appState.currentRoom = resp.room;
        appState.isCreator = resp.room?.isCreator === true;
        if (cyberTheme && cyberTheme.updateRoomInfo) {
          cyberTheme.updateRoomInfo(resp.room);
        }
      });
    });
  }

  // 设置项目信息按钮
  if (elements.projectInfoBtn) {
    elements.projectInfoBtn.addEventListener("click", () => {
      modalManager.openProjectInfoModal();
      if (cyberTheme && cyberTheme.closeMobileSidebar) {
        cyberTheme.closeMobileSidebar();
      }
    });
  }

  if (elements.mobileProjectInfoBtn) {
    elements.mobileProjectInfoBtn.addEventListener("click", () => {
      modalManager.openProjectInfoModal();
      if (cyberTheme && cyberTheme.closeMobileSidebar) {
        cyberTheme.closeMobileSidebar();
      }
    });
  }

  // 预填加入模态框处理
  function getSearchParams() {
    const params = new URLSearchParams(location.search);
    return {
      nickname: params.get("nickname") || "",
      password: params.get("password") || "",
      description: params.get("desc") || params.get("description") || "",
    };
  }

  const { nickname: qsNickname, password: qsPassword } = getSearchParams();
  const shouldOpenPrefill = Boolean(appState.currentRoomId) || Boolean(qsNickname) || Boolean(qsPassword);

  function openPrefillModalIfNeeded() {
    if (!elements.prefillJoinModal || !shouldOpenPrefill) return;
    if (elements.prefillNickname) elements.prefillNickname.value = qsNickname || (elements.nicknameInput ? elements.nicknameInput.value : "") || "";
    if (elements.prefillRoomId) elements.prefillRoomId.value = appState.currentRoomId || (elements.roomIdInput ? elements.roomIdInput.value : "") || "";
    if (elements.prefillPassword) elements.prefillPassword.value = qsPassword || "";
    modalManager.openPrefillModal();
  }

  if (elements.prefillConfirmBtn) {
    elements.prefillConfirmBtn.addEventListener("click", () => {
      if (elements.prefillNickname && elements.nicknameInput) elements.nicknameInput.value = elements.prefillNickname.value.trim();
      if (elements.prefillRoomId && elements.roomIdInput) elements.roomIdInput.value = elements.prefillRoomId.value.trim();
      if (elements.prefillPassword && elements.roomPasswordInput) {
        elements.roomPasswordInput.value = elements.prefillPassword.value.trim();
        elements.roomPasswordInput.style.display = "block";
      }

      const nickname = elements.nicknameInput ? elements.nicknameInput.value.trim() : "";
      if (!nickname) {
        alert("请输入一个昵称");
        return;
      }

      if (elements.joinBtn) {
        elements.joinBtn.dispatchEvent(new Event("click"));
      }

      modalManager.closePrefillModal();
    });
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        setupJoinButton();
        if (!appState.currentRoomId) {
          showInitialGuidance(elements.messages);
        }
        if (appState.currentRoomId && elements.roomIdInput) {
          elements.roomIdInput.value = appState.currentRoomId;
        }
        setTimeout(() => {
          openPrefillModalIfNeeded();
        }, 100);
      }, 100);
    });
  } else {
    setTimeout(() => {
      setupJoinButton();
      if (!appState.currentRoomId) {
        showInitialGuidance(elements.messages);
      }
      if (appState.currentRoomId && elements.roomIdInput) {
        elements.roomIdInput.value = appState.currentRoomId;
      }
      setTimeout(() => {
        openPrefillModalIfNeeded();
      }, 100);
    }, 100);
  }

  // 离开页面警告
  window.addEventListener("beforeunload", (e) => {
    if (appState.joined) {
      e.preventDefault();
      e.returnValue = "您确定要离开聊天室吗？您的连接将会断开。";
    }
  });
})();

