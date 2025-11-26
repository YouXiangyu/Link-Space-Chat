/**
 * Main Application Logic - Cyber Theme Integration
 * 创建时间: 2025-01-12
 * 集成新的Cyber主题UI系统
 */

import { renderMessage, renderUsers, showRateLimitToast, showInitialGuidance, hideInitialGuidance, scrollToMessage } from './uiAdapter.js';
import { cyberTheme } from './cyberTheme.js';
import { getRoomIdFromPath, formatAbsoluteTime } from './js/utils/index.js';
import { SocketManager } from './js/modules/socketManager.js';
import { RoomController } from './js/modules/roomController.js';
import { createMessageController } from './js/modules/messageController.js';
import { createSearchController } from './js/modules/searchController.js';

(() => {
  const socketManager = new SocketManager();
  const socket = socketManager.raw;

  const el = (id) => document.getElementById(id);

  let joined = false;
  let currentRoomId = getRoomIdFromPath();
  let currentRoom = null;
  let isCreator = false;
  let pendingJoin = null;
  let myNickname = null;
  let myClientId = null;
  
  const messageMap = new Map();
  let replyingTo = null;

  // 防止重复处理历史消息的标志
  let historyProcessing = false;
  let fetchingHistory = false;

  const appState = {
    get joined() { return joined; },
    set joined(value) { joined = value; },
    get currentRoomId() { return currentRoomId; },
    set currentRoomId(value) { currentRoomId = value; },
    get currentRoom() { return currentRoom; },
    set currentRoom(value) { currentRoom = value; },
    get isCreator() { return isCreator; },
    set isCreator(value) { isCreator = value; },
    get pendingJoin() { return pendingJoin; },
    set pendingJoin(value) { pendingJoin = value; },
    get myNickname() { return myNickname; },
    set myNickname(value) { myNickname = value; },
    get myClientId() { return myClientId; },
    set myClientId(value) { myClientId = value; },
    get historyProcessing() { return historyProcessing; },
    set historyProcessing(value) { historyProcessing = value; },
    get fetchingHistory() { return fetchingHistory; },
    set fetchingHistory(value) { fetchingHistory = value; },
    get replyingTo() { return replyingTo; },
    set replyingTo(value) { replyingTo = value; }
  };

  // 检查socket连接状态
  let socketConnected = socketManager.isConnected();

  console.log('[App.js] Initializing socket connection...');
  console.log('[App.js] Socket object:', socket);
  console.log('[App.js] Socket connected:', socketConnected);

  socketManager.initLifecycleHandlers({
    onConnect: (id) => {
      socketConnected = true;
      console.log('[Socket] ✅ Connected! ID:', id);
    },
    onDisconnect: (reason) => {
      socketConnected = false;
      console.warn('[Socket] ❌ Disconnected. Reason:', reason);
      if (appState.joined) {
        alert('连接已断开，请刷新页面重试');
      }
    },
    onError: (error) => {
      socketConnected = false;
      console.error('[Socket] ❌ Connection error:', error);
      alert('无法连接到服务器，请检查网络连接。错误: ' + (error?.message || '未知错误'));
    }
  });
  
  if (!socketConnected) {
    console.log('[Socket] Not connected yet, waiting for connection...');
  } else {
    console.log('[Socket] Already connected on init');
  }

  // 获取DOM元素（兼容新旧UI）
  // 注意：这些元素可能在模块加载时还不存在，所以延迟获取
  let messages, messageForm, messageInput, nicknameInput, roomIdInput, roomPasswordInput;
  
  // 延迟获取DOM元素的函数
  function getElements() {
    messages = el("messages");
    messageForm = el("messageForm");
    messageInput = el("messageInput");
    nicknameInput = el("nickname");
    roomIdInput = el("roomIdInput");
    roomPasswordInput = el("roomPasswordInput");
  }
  
  // 立即尝试获取
  getElements();
  
  // Modal elements
  const shareModal = el("shareModal");
  const closeModalBtn = el("closeModalBtn");
  const qrCodeContainer = el("qrCode");
  const shareLinkInput = el("shareLinkInput");
  const copyLinkBtn = el("copyLinkBtn");
  const rateLimitToast = el("rateLimitToast");
  
  // Reply elements
  const replyBar = el("reply-bar");
  const replyPreviewText = el("replyPreviewText");
  const cancelReplyBtn = el("cancelReplyBtn");
  
  // Search elements
  const searchInput = el("searchInput");
  const searchBtn = el("searchBtn");
  const searchResults = el("searchResults");
  const searchPanel = el("searchPanel");
  const closeSearchBtn = el("closeSearchBtn");
  const searchToggleBtn = el("searchToggleBtn");
  const mobileSearchToggleBtn = el("mobile-searchToggleBtn");
  
  // Room elements
  const editRoomModal = el("editRoomModal");
  const closeEditModalBtn = el("closeEditModalBtn");
  const editRoomForm = el("editRoomForm");
  const editRoomName = el("editRoomName");
  const editRoomDescription = el("editRoomDescription");
  const editRoomPassword = el("editRoomPassword");
  const editPasswordConfirmGroup = el("editPasswordConfirmGroup");
  const editPasswordConfirm = el("editPasswordConfirm");
  const cancelEditBtn = el("cancelEditBtn");
  const editRoomBtn = el("editRoomBtn");
  const mobileEditRoomBtn = el("mobile-editRoomBtn");
  
  // Password modal
  const passwordModal = el("passwordModal");
  const passwordForm = el("passwordForm");
  const passwordInput = el("passwordInput");
  const cancelPasswordBtn = el("cancelPasswordBtn");
  
  // Share and leave buttons
  const shareBtn = el("shareBtn");
  const mobileShareBtn = el("mobile-shareBtn");
  const leaveBtn = el("leaveBtn");
  const mobileLeaveBtn = el("mobile-leaveBtn");
  
  // Prefill modal
  const prefillJoinModal = el("prefillJoinModal");
  const prefillNickname = el("prefillNickname");
  const prefillRoomId = el("prefillRoomId");
  const prefillPassword = el("prefillPassword");
  const prefillCancelBtn = el("prefillCancelBtn");
  const prefillConfirmBtn = el("prefillConfirmBtn");

  // 显示初始引导
  function showGuidance() {
    if (messages) {
      showInitialGuidance(messages);
    }
  }

  // 更新房间信息
  function updateRoomInfo(room) {
    currentRoom = room;
    
    if (cyberTheme && cyberTheme.updateRoomInfo) {
      cyberTheme.updateRoomInfo(room);
    }
    
    if (!room) {
      isCreator = false;
      return;
    }
    
    isCreator = room.isCreator === true;
  }

  const messageController = createMessageController({
    socketManager,
    state: appState,
    messageMap,
    elements: {
      messages,
      messageForm,
      messageInput,
      rateLimitToast,
      replyBar,
      replyPreviewText,
      cancelReplyBtn,
      sendButton: el("sendButton")
    },
    helpers: {
      renderMessage,
      showRateLimitToast,
      cyberTheme
    }
  });
  messageController.init();
  window.startReply = messageController.startReply;
  window.cancelReply = messageController.cancelReply;

  const roomController = new RoomController({
    socketManager,
    state: appState,
    messageMap,
    elements: {
      messages,
      passwordModal,
      passwordInput,
      roomPasswordInput,
      searchInput,
      searchResults
    },
    helpers: {
      hideInitialGuidance,
      showInitialGuidance,
      renderMessage,
      updateRoomInfo,
      cyberTheme,
      cancelReply: messageController.cancelReply
    }
  });

  const searchController = createSearchController({
    elements: {
      searchInput,
      searchBtn,
      searchResults,
      searchToggleBtn,
      mobileSearchToggleBtn,
      closeSearchBtn
    },
    messageMap,
    state: appState,
    helpers: {
      scrollToMessage: (messageId) => scrollToMessage(messages, messageId),
      formatAbsoluteTime
    },
    cyberTheme
  });
  searchController.init();


  // 加入按钮事件（新UI）- 作为备用方案
  function setupJoinButton() {
    // 重新获取元素，确保它们存在
    getElements();
    const joinBtnEl = el("joinBtn");
    const nicknameEl = el("nickname");
    const roomIdEl = el("roomIdInput");
    const roomPasswordEl = el("roomPasswordInput");
    
    if (joinBtnEl) {
      // 检查是否已经有监听器（避免重复绑定）
      if (joinBtnEl.dataset.listenerAttached === 'true') {
        console.log("Join button listener already attached");
        return;
      }
      
      joinBtnEl.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[App.js] Join button clicked");
        
        if (joined) {
          roomController.leaveCurrentRoom();
        }

        const nickname = nicknameEl ? nicknameEl.value.trim() : "";
        if (!nickname) {
          alert("请输入一个昵称");
          return;
        }

        let roomId = (roomIdEl ? roomIdEl.value.trim() : "") || getRoomIdFromPath();
        if (!roomId) {
          roomId = "1";
        }

        const password = (roomPasswordEl && roomPasswordEl.style.display !== 'none') 
          ? (roomPasswordEl.value.trim() || null) 
          : null;
        
        console.log("[App.js] Joining room:", { roomId, nickname, hasPassword: !!password });
        roomController.joinRoom(roomId, nickname, password);
      });
      
      joinBtnEl.dataset.listenerAttached = 'true';
      console.log("[App.js] Join button event listener attached");
    } else {
      console.error("[App.js] Join button not found! Retrying...");
      // 如果按钮还没加载，延迟重试
      setTimeout(() => {
        setupJoinButton();
      }, 200);
    }
  }
  
  // 确保DOM加载完成后再绑定事件
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        setupJoinButton();
      }, 100);
    });
  } else {
    // DOM已经加载完成
    setTimeout(() => {
      setupJoinButton();
    }, 100);
  }

  // 密码表单提交
  if (passwordForm) {
    passwordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!pendingJoin) return;
      const password = passwordInput ? passwordInput.value.trim() : "";
      // 隐藏之前的错误消息
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
      roomController.joinRoom(pendingJoin.roomId, pendingJoin.nickname, password);
    });
  }

  if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener("click", () => {
      if (passwordModal) {
        passwordModal.classList.add("hidden");
        // 清除错误消息
        const errorElement = document.getElementById("passwordErrorMsg");
        if (errorElement) {
          errorElement.classList.add("hidden");
          errorElement.textContent = "";
        }
      }
      pendingJoin = null;
      if (passwordInput) passwordInput.value = "";
    });
  }
  
  // 当用户开始输入密码时，隐藏错误消息
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const errorElement = document.getElementById("passwordErrorMsg");
      if (errorElement && !errorElement.classList.contains("hidden")) {
        errorElement.classList.add("hidden");
      }
    });
  }


  // 离开房间按钮
  if (leaveBtn) {
    leaveBtn.addEventListener("click", () => roomController.leaveCurrentRoom());
  }
  if (mobileLeaveBtn) {
    mobileLeaveBtn.addEventListener("click", () => roomController.leaveCurrentRoom());
  }

  // 分享房间
  function openShareModal() {
    if (!shareModal || !qrCodeContainer || !shareLinkInput) return;
    
    qrCodeContainer.innerHTML = "";
    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(window.location.href, { width: 200, margin: 1 }, (err, canvas) => {
        if (err) return console.error(err);
        qrCodeContainer.appendChild(canvas);
      });
    }
    shareLinkInput.value = window.location.href;
    shareModal.classList.remove("hidden");
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", openShareModal);
  }
  if (mobileShareBtn) {
    mobileShareBtn.addEventListener("click", openShareModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      if (shareModal) shareModal.classList.add("hidden");
    });
  }

  if (shareModal) {
    shareModal.addEventListener("click", (e) => {
      if (e.target === shareModal) {
        shareModal.classList.add("hidden");
      }
    });
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", () => {
      if (!shareLinkInput) return;
      navigator.clipboard.writeText(shareLinkInput.value).then(() => {
        copyLinkBtn.textContent = "COPIED!";
        setTimeout(() => {
          copyLinkBtn.textContent = "COPY";
        }, 2000);
      }).catch(err => {
        console.error("无法复制链接: ", err);
        alert("复制失败");
      });
    });
  }

  // 编辑房间
  if (editRoomBtn) {
    editRoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!currentRoom) return;
      if (editRoomName) editRoomName.value = currentRoom.name || "";
      if (editRoomDescription) editRoomDescription.value = currentRoom.description || "";
      if (editRoomPassword) editRoomPassword.value = "";
      if (currentRoom.password) {
        if (editPasswordConfirmGroup) editPasswordConfirmGroup.style.display = "block";
        if (editPasswordConfirm) editPasswordConfirm.checked = false;
      } else {
        if (editPasswordConfirmGroup) editPasswordConfirmGroup.style.display = "none";
        if (editPasswordConfirm) editPasswordConfirm.checked = false;
      }
      if (editRoomModal) editRoomModal.classList.remove("hidden");
    });
  }

  if (mobileEditRoomBtn) {
    mobileEditRoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!currentRoom) return;
      if (editRoomName) editRoomName.value = currentRoom.name || "";
      if (editRoomDescription) editRoomDescription.value = currentRoom.description || "";
      if (editRoomPassword) editRoomPassword.value = "";
      if (currentRoom.password) {
        if (editPasswordConfirmGroup) editPasswordConfirmGroup.style.display = "block";
        if (editPasswordConfirm) editPasswordConfirm.checked = false;
      } else {
        if (editPasswordConfirmGroup) editPasswordConfirmGroup.style.display = "none";
        if (editPasswordConfirm) editPasswordConfirm.checked = false;
      }
      if (editRoomModal) editRoomModal.classList.remove("hidden");
      if (cyberTheme && cyberTheme.closeMobileSidebar) {
        cyberTheme.closeMobileSidebar();
      }
    });
  }

  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener("click", () => {
      if (editRoomModal) editRoomModal.classList.add("hidden");
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
      if (editRoomModal) editRoomModal.classList.add("hidden");
    });
  }

  if (editRoomModal) {
    editRoomModal.addEventListener("click", (e) => {
      if (e.target === editRoomModal) {
        editRoomModal.classList.add("hidden");
      }
    });
  }

  if (editRoomForm) {
    editRoomForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!joined) return;
      
      const newName = editRoomName ? editRoomName.value.trim() || null : null;
      const newDesc = editRoomDescription ? editRoomDescription.value.trim() || null : null;
      const newPwdRaw = editRoomPassword ? editRoomPassword.value.trim() : "";

      const updates = {};
      updates.name = newName;
      updates.description = newDesc;

      const hadPassword = !!(currentRoom && currentRoom.password);
      const wantsPwdChange = newPwdRaw.length > 0 || (hadPassword && newPwdRaw.length === 0);
      if (hadPassword) {
        if (wantsPwdChange && (!editPasswordConfirm || !editPasswordConfirm.checked)) {
          alert("请勾选\"修改密码并清空聊天记录\"以确认修改密码。");
          return;
        }
        if (editPasswordConfirm && editPasswordConfirm.checked && wantsPwdChange) {
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
        if (editRoomModal) editRoomModal.classList.add("hidden");
        updateRoomInfo(resp.room);
      });
    });
  }


  // 项目信息按钮
  const projectInfoBtn = el("projectInfoBtn");
  const mobileProjectInfoBtn = el("mobile-projectInfoBtn");
  const projectInfoModal = el("projectInfoModal");
  const closeProjectInfoBtn = el("closeProjectInfoBtn");

  function openProjectInfo() {
    if (projectInfoModal) {
      projectInfoModal.classList.remove("hidden");
    }
    if (cyberTheme && cyberTheme.closeMobileSidebar) {
      cyberTheme.closeMobileSidebar();
    }
  }

  if (projectInfoBtn) {
    projectInfoBtn.addEventListener("click", openProjectInfo);
  }

  if (mobileProjectInfoBtn) {
    mobileProjectInfoBtn.addEventListener("click", openProjectInfo);
  }

  if (closeProjectInfoBtn) {
    closeProjectInfoBtn.addEventListener("click", () => {
      if (projectInfoModal) projectInfoModal.classList.add("hidden");
    });
  }

  if (projectInfoModal) {
    projectInfoModal.addEventListener("click", (e) => {
      if (e.target === projectInfoModal) {
        projectInfoModal.classList.add("hidden");
      }
    });
  }

  // Socket Listeners
  socketManager.registerCallbacks({
    onServerPing: () => {},
    onHistory: (list) => {
      if (!messages || appState.historyProcessing) return;

      appState.historyProcessing = true;
      messageMap.clear();
      messages.innerHTML = '';
      hideInitialGuidance(messages);

      for (const m of list) {
        const isMyMessage = m.nickname === appState.myNickname || m.clientId === appState.myClientId;
        renderMessage(messages, m, isMyMessage, messageMap);
        if (m.id) {
          messageMap.set(m.id, m);
        }
      }

      setTimeout(() => {
        appState.historyProcessing = false;
      }, 500);
    },
    onChatMessage: (message) => {
      if (!messages) return;

      if (message?.clientId) {
        const tmp = messages.querySelector(`[data-client-id="${message.clientId}"]`);
        if (tmp) {
          tmp.remove();
        }
      }

      const isMyMessage = message.nickname === appState.myNickname || message.clientId === appState.myClientId;
      renderMessage(messages, message, isMyMessage, messageMap);

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
      updateRoomInfo(room);
    },
    onRoomRefresh: (data) => {
      if (!messages) return;

      if (data.message) {
        messages.innerHTML = '';
        const guidance = document.createElement('div');
        guidance.className = 'cyber-message';
        guidance.innerHTML = `<div class="cyber-message-body"><div class="cyber-message-text">${data.message}</div></div>`;
        messages.appendChild(guidance);
      }

      // 房间刷新后，历史消息会通过 Socket 的 history 事件自动加载
      // 如果需要手动刷新，可以重新加入房间或等待服务器推送
    }
  });

  // 预填加入模态框
  function getSearchParams() {
    const params = new URLSearchParams(location.search);
    return {
      nickname: params.get("nickname") || "",
      password: params.get("password") || "",
      description: params.get("desc") || params.get("description") || "",
    };
  }

  const { nickname: qsNickname, password: qsPassword, description: qsDesc } = getSearchParams();
  const shouldOpenPrefill =
    Boolean(currentRoomId) || Boolean(qsNickname) || Boolean(qsPassword) || Boolean(qsDesc);

  function openPrefillModalIfNeeded() {
    if (!prefillJoinModal || !shouldOpenPrefill) return;
    if (prefillNickname) prefillNickname.value = qsNickname || (nicknameInput ? nicknameInput.value : "") || "";
    if (prefillRoomId) prefillRoomId.value = currentRoomId || (roomIdInput ? roomIdInput.value : "") || "";
    if (prefillPassword) prefillPassword.value = qsPassword || "";
    prefillJoinModal.classList.remove("hidden");
  }

  if (prefillCancelBtn && prefillJoinModal) {
    prefillCancelBtn.addEventListener("click", () => {
      prefillJoinModal.classList.add("hidden");
    });
  }

  if (prefillJoinModal) {
    prefillJoinModal.addEventListener("click", (e) => {
      if (e.target === prefillJoinModal) {
        prefillJoinModal.classList.add("hidden");
      }
    });
  }

  if (prefillConfirmBtn) {
    prefillConfirmBtn.addEventListener("click", () => {
      if (prefillNickname && nicknameInput) nicknameInput.value = prefillNickname.value.trim();
      if (prefillRoomId && roomIdInput) roomIdInput.value = prefillRoomId.value.trim();
      if (prefillPassword && roomPasswordInput) {
        roomPasswordInput.value = prefillPassword.value.trim();
        roomPasswordInput.style.display = "block";
      }

      const nickname = nicknameInput ? nicknameInput.value.trim() : "";
      if (!nickname) {
        alert("请输入一个昵称");
        return;
      }
      
      if (joinBtn) {
        joinBtn.dispatchEvent(new Event("click"));
      }
      
      prefillJoinModal.classList.add("hidden");
    });
  }

  // 页面加载完成后初始化
  if (!currentRoomId) {
    showGuidance();
  }

  if (currentRoomId && roomIdInput) {
    roomIdInput.value = currentRoomId;
  }

  // 页面加载完成后，若链接带有房间/密码等信息，则弹出预填窗口
  setTimeout(() => {
    openPrefillModalIfNeeded();
  }, 100);

  // 离开页面警告
  window.addEventListener("beforeunload", (e) => {
    if (joined) {
      e.preventDefault();
      e.returnValue = "您确定要离开聊天室吗？您的连接将会断开。";
    }
  });
})();
