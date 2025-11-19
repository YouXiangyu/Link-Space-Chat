/**
 * Main Application Logic - Cyber Theme Integration
 * 创建时间: 2025-01-12
 * 集成新的Cyber主题UI系统
 */

import { renderMessage, renderUsers, showRateLimitToast, showInitialGuidance, hideInitialGuidance, scrollToMessage } from './uiAdapter.js';
import { cyberTheme } from './cyberTheme.js';

(() => {
  const socket = io();
  
  // 检查socket连接状态
  let socketConnected = false;
  
  console.log('[App.js] Initializing socket connection...');
  console.log('[App.js] Socket object:', socket);
  console.log('[App.js] Socket connected:', socket.connected);
  
  socket.on('connect', () => {
    socketConnected = true;
    console.log('[Socket] ✅ Connected! ID:', socket.id);
  });
  
  socket.on('disconnect', (reason) => {
    socketConnected = false;
    console.warn('[Socket] ❌ Disconnected. Reason:', reason);
    if (joined) {
      alert('连接已断开，请刷新页面重试');
    }
  });
  
  socket.on('connect_error', (error) => {
    socketConnected = false;
    console.error('[Socket] ❌ Connection error:', error);
    alert('无法连接到服务器，请检查网络连接。错误: ' + (error.message || '未知错误'));
  });
  
  // 立即检查连接状态
  if (socket.connected) {
    socketConnected = true;
    console.log('[Socket] Already connected on init');
  } else {
    console.log('[Socket] Not connected yet, waiting for connection...');
  }

  const el = (id) => document.getElementById(id);

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

  function getRoomIdFromPath() {
    const m = location.pathname.match(/^\/r\/([^\/?#]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  let joined = false;
  let currentRoomId = getRoomIdFromPath();
  let currentRoom = null;
  let isCreator = false;
  let pendingJoin = null;
  let myNickname = null;
  let myClientId = null;
  
  // 消息Map和回复状态
  const messageMap = new Map();
  let replyingTo = null;

  // 时间格式化函数
  function formatAbsoluteTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    const sameMonth = sameYear && d.getMonth() === now.getMonth();
    const sameDay = sameMonth && d.getDate() === now.getDate();
    const pad = (n) => String(n).padStart(2, "0");
    if (sameDay) {
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (sameMonth) {
      return `${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (sameYear) {
      return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // 显示初始引导
  function showGuidance() {
    if (messages) {
      showInitialGuidance(messages);
    }
  }

  // 开始回复
  function startReply(msg) {
    replyingTo = msg;
    const previewText = `${msg.nickname}: ${msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text}`;
    
    if (replyPreviewText) {
      replyPreviewText.textContent = `REPLYING TO: ${previewText}`;
    }
    
    if (cyberTheme && cyberTheme.showReplyBar) {
      cyberTheme.showReplyBar(previewText);
    } else if (replyBar) {
      replyBar.classList.remove('hidden');
    }
    
    if (messageInput) messageInput.focus();
  }
  
  // 暴露给全局，供uiAdapter使用
  window.startReply = startReply;

  // 取消回复
  function cancelReply() {
    replyingTo = null;
    
    if (cyberTheme && cyberTheme.hideReplyBar) {
      cyberTheme.hideReplyBar();
    } else if (replyBar) {
      replyBar.classList.add('hidden');
    }
  }
  
  // 暴露给全局
  window.cancelReply = cancelReply;

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

  // 防止重复处理历史消息的标志
  let historyProcessing = false;
  let fetchingHistory = false;
  
  // 获取历史消息
  async function fetchHistory(roomId) {
    if (!messages || fetchingHistory) return;
    
    fetchingHistory = true;
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages?limit=20`);
      if (!res.ok) {
        fetchingHistory = false;
        return;
      }
      const data = await res.json();
      
      // 只有在socket还没有发送history事件时才手动渲染
      // 否则让socket.on("history")处理
      if (!historyProcessing) {
        messageMap.clear();
        messages.innerHTML = '';
        hideInitialGuidance(messages);
        
        for (const m of data.messages) {
          const isMyMessage = m.nickname === myNickname || m.clientId === myClientId;
          renderMessage(messages, m, isMyMessage, messageMap);
          if (m.id) {
            messageMap.set(m.id, m);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      fetchingHistory = false;
    }
  }

  // 离开房间
  function leaveCurrentRoom() {
    if (!joined) return;
    
    socket.emit("leave_room");
    joined = false;
    currentRoom = null;
    isCreator = false;
    myNickname = null;
    myClientId = null;
    
    if (cyberTheme && cyberTheme.leaveInterface) {
      cyberTheme.leaveInterface();
    }
    
    if (messages) {
      messages.innerHTML = '';
      showGuidance();
    }
    
    messageMap.clear();
    cancelReply();
    
    if (searchInput) searchInput.value = "";
    if (searchResults) searchResults.style.display = 'none';
    
    if (cyberTheme && cyberTheme.hideLeaveButton) {
      cyberTheme.hideLeaveButton();
    }
    
    if (cyberTheme && cyberTheme.closeSearchPanel) {
      cyberTheme.closeSearchPanel();
    }
    
    updateRoomInfo(null);
  }

  // 加入房间
  function joinRoom(roomId, nickname, password = null) {
    console.log("joinRoom called with:", { roomId, nickname, hasPassword: !!password });
    
    // 检查socket连接状态
    if (!socketConnected || !socket.connected) {
      alert('未连接到服务器，请稍候再试');
      return;
    }
    
    // 添加超时机制
    const timeout = setTimeout(() => {
      alert('加入房间超时，请重试');
    }, 10000); // 10秒超时
    
    socket.emit("join_room", { roomId, nickname, password }, (resp) => {
      clearTimeout(timeout);
      console.log("join_room response:", resp);
      
      if (!resp?.ok) {
        if (resp?.error === "PASSWORD_REQUIRED") {
          pendingJoin = { roomId, nickname };
          if (passwordModal) {
            passwordModal.classList.remove("hidden");
            if (passwordInput) passwordInput.focus();
          }
          return;
        }
        if (!joined) showGuidance();
        alert(resp?.message || resp?.error || "加入失败");
        return;
      }
      
      joined = true;
      currentRoomId = roomId;
      myNickname = nickname;
      
      console.log("Successfully joined room, entering interface...");
      
      if (messages) {
        messages.innerHTML = "";
        hideInitialGuidance(messages);
      }
      
      pendingJoin = null;
      
      const roomUrl = `/r/${encodeURIComponent(currentRoomId)}`;
      if (location.pathname !== roomUrl) {
        history.pushState({}, "", roomUrl);
      }
      
      // 先更新cyberTheme状态
      if (cyberTheme) {
        cyberTheme.joined = true;
        cyberTheme.myNickname = nickname;
      }
      
      // 延迟获取历史消息，避免与socket.on("history")冲突
      setTimeout(() => {
        fetchHistory(currentRoomId);
      }, 100);
      
      // 确保cyberTheme已初始化后再调用
      if (typeof cyberTheme !== 'undefined' && cyberTheme && cyberTheme.enterInterface) {
        console.log("Calling cyberTheme.enterInterface()");
        cyberTheme.enterInterface();
      } else {
        console.error("cyberTheme not available or enterInterface not found");
        // 手动执行界面切换
        const loginOverlay = el("login-overlay");
        const mainInterface = el("main-interface");
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (mainInterface) {
          mainInterface.style.opacity = '1';
          mainInterface.style.scale = '1';
          mainInterface.style.filter = 'blur(0px)';
          mainInterface.style.pointerEvents = 'all';
        }
      }
      
      if (cyberTheme && cyberTheme.showLeaveButton) {
        cyberTheme.showLeaveButton();
      }
      
      if (passwordModal) passwordModal.classList.add("hidden");
      if (roomPasswordInput) roomPasswordInput.style.display = "none";
      
      if (cyberTheme && cyberTheme.closeMobileSidebar) {
        cyberTheme.closeMobileSidebar();
      }
    });
  }

  // 监听自定义事件（由内联脚本触发）
  // 使用once: false，但添加防抖机制
  let joinRoomRequestHandler = null;
  if (!joinRoomRequestHandler) {
    joinRoomRequestHandler = function(e) {
      console.log('[App.js] ✅ joinRoomRequest event received!', e);
      window.joinRoomHandled = true; // 标记事件已被处理
      
      const { roomId, nickname, password } = e.detail || {};
      console.log('[App.js] Event detail:', { roomId, nickname, hasPassword: !!password });
      
      if (!roomId || !nickname) {
        console.error('[App.js] ❌ Invalid event data:', { roomId, nickname });
        return;
      }
      
      console.log('[App.js] Processing joinRoomRequest:', { roomId, nickname, hasPassword: !!password });
      
      if (joined) {
        console.log('[App.js] Already joined, leaving current room first...');
        socket.emit("leave_room");
        joined = false;
        if (cyberTheme) cyberTheme.joined = false;
      }
      
      joinRoom(roomId, nickname, password);
    };
    window.addEventListener('joinRoomRequest', joinRoomRequestHandler);
    console.log('[App.js] joinRoomRequest event listener registered');
  }
  
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
          socket.emit("leave_room");
          joined = false;
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
        joinRoom(roomId, nickname, password);
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
      if (!password) {
        alert("请输入密码");
        return;
      }
      joinRoom(pendingJoin.roomId, pendingJoin.nickname, password);
      if (passwordInput) passwordInput.value = "";
    });
  }

  if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener("click", () => {
      if (passwordModal) passwordModal.classList.add("hidden");
      pendingJoin = null;
      if (passwordInput) passwordInput.value = "";
    });
  }

  // 消息输入快捷键和send按钮高亮
  if (messageInput) {
    const sendButton = el("sendButton");
    
    // 监听输入变化，更新send按钮样式
    const updateSendButton = () => {
      if (sendButton) {
        const hasText = messageInput.value.trim().length > 0;
        if (hasText) {
          sendButton.classList.add('has-text');
        } else {
          sendButton.classList.remove('has-text');
        }
      }
    };
    
    messageInput.addEventListener("input", updateSendButton);
    messageInput.addEventListener("keyup", updateSendButton);
    
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (messageForm) messageForm.dispatchEvent(new Event("submit"));
      }
    });
    
    // 初始状态
    updateSendButton();
  }

  // 发送消息
  if (messageForm) {
    messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!joined) {
        alert("请先加入房间");
        return;
      }
      
      const text = messageInput ? messageInput.value.trim() : "";
      if (!text) return;
      
      const isHighlighted = /^#\s+.+/.test(text.trim());
      const tempId = Date.now();
      const clientId = `${tempId}-${Math.random().toString(36).slice(2, 8)}`;
      myClientId = clientId;
      
      // 显示发送中状态
      if (messages) {
        renderMessage(messages, {
          nickname: "",
          text: text,
          createdAt: Date.now(),
          contentType: 'text',
          id: tempId,
          status: 'sending',
          clientId,
          parentMessageId: replyingTo ? replyingTo.id : null,
          isHighlighted: isHighlighted
        }, true, messageMap);
      }
      
      socket.emit("chat_message", { 
        text, 
        clientId,
        parentMessageId: replyingTo ? replyingTo.id : null,
        isHighlighted: isHighlighted
      }, (resp) => {
        if (!resp?.ok) {
          // 移除发送中的消息
          if (messages) {
            const msgEl = messages.querySelector(`[data-message-id="${tempId}"], [data-client-id="${clientId}"]`);
            if (msgEl) msgEl.remove();
          }
          
          if (resp?.error === "rate_limit") {
            if (rateLimitToast) {
              showRateLimitToast(rateLimitToast);
            }
          } else {
            console.error(resp?.error || resp?.message);
            alert(resp?.message || "发送失败");
          }
        } else {
          cancelReply();
        }
      });
      
      if (messageInput) messageInput.value = "";
    });
  }

  // 取消回复按钮
  if (cancelReplyBtn) {
    cancelReplyBtn.addEventListener("click", cancelReply);
  }

  // 离开房间按钮
  if (leaveBtn) {
    leaveBtn.addEventListener("click", leaveCurrentRoom);
  }
  if (mobileLeaveBtn) {
    mobileLeaveBtn.addEventListener("click", leaveCurrentRoom);
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

      socket.emit("update_room", updates, (resp) => {
        if (!resp?.ok) {
          alert(resp?.message || resp?.error || "更新失败");
          return;
        }
        if (editRoomModal) editRoomModal.classList.add("hidden");
        updateRoomInfo(resp.room);
      });
    });
  }

  // 搜索功能
  function performSearch() {
    if (!searchInput || !searchResults) return;
    const query = searchInput.value.trim();
    if (!query || !joined) {
      searchResults.style.display = 'none';
      return;
    }
    
    if (cyberTheme && cyberTheme.openSearchPanel) {
      cyberTheme.openSearchPanel();
    }
    
    const results = [];
    messageMap.forEach((msg) => {
      if (msg.text && msg.text.toLowerCase().includes(query.toLowerCase())) {
        results.push(msg);
      }
    });
    
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="cyber-search-result-empty">NO MATCHES FOUND</div>';
      searchResults.style.display = 'flex';
      return;
    }
    
    const displayResults = results.slice(0, 10);
    searchResults.innerHTML = displayResults.map(msg => {
      const preview = msg.text.length > 80 ? msg.text.substring(0, 80) + '…' : msg.text;
      const author = msg.nickname || 'Unknown';
      const timeStr = formatAbsoluteTime(msg.createdAt || Date.now());
      return `<button type="button" class="cyber-search-result-item" data-message-id="${msg.id}">
                <div class="cyber-search-result-header">
                  <span class="cyber-search-result-author">${author}</span>
                  <span>${timeStr}</span>
                </div>
                <div class="cyber-search-result-preview">${preview || '(no content)'}</div>
              </button>`;
    }).join('');
    searchResults.style.display = 'flex';

    searchResults.querySelectorAll(".cyber-search-result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const messageId = Number(item.dataset.messageId);
        if (messageId && messages) {
          scrollToMessage(messages, messageId);
        }
        if (cyberTheme && cyberTheme.closeSearchPanel) {
          cyberTheme.closeSearchPanel();
        }
      });
    });
  }
  
  // 暴露给全局
  window.scrollToMessage = function(messageId) {
    if (messages) {
      scrollToMessage(messages, messageId);
    }
  };

  if (searchBtn) {
    searchBtn.addEventListener("click", performSearch);
  }
  
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
      }
    });
  }

  if (searchToggleBtn) {
    searchToggleBtn.addEventListener("click", () => {
      if (cyberTheme && cyberTheme.openSearchPanel) {
        cyberTheme.openSearchPanel();
      }
    });
  }

  if (mobileSearchToggleBtn) {
    mobileSearchToggleBtn.addEventListener("click", () => {
      if (cyberTheme && cyberTheme.openSearchPanel) {
        cyberTheme.openSearchPanel();
      }
      if (cyberTheme && cyberTheme.closeMobileSidebar) {
        cyberTheme.closeMobileSidebar();
      }
    });
  }

  if (closeSearchBtn) {
    closeSearchBtn.addEventListener("click", () => {
      if (cyberTheme && cyberTheme.closeSearchPanel) {
        cyberTheme.closeSearchPanel();
      }
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
  socket.on("server-ping", (callback) => {
    callback("ok");
  });

  // 防止重复处理历史消息（使用已定义的historyProcessing变量）
  socket.on("history", (list) => {
    if (!messages || historyProcessing) return;
    
    historyProcessing = true;
    messageMap.clear();
    messages.innerHTML = '';
    hideInitialGuidance(messages);
    
    for (const m of list) {
      const isMyMessage = m.nickname === myNickname || m.clientId === myClientId;
      renderMessage(messages, m, isMyMessage, messageMap);
      if (m.id) {
        messageMap.set(m.id, m);
      }
    }
    
    // 重置标志，允许下次处理
    setTimeout(() => {
      historyProcessing = false;
    }, 500);
  });

  socket.on("chat_message", (m) => {
    if (!messages) return;
    
    // 如果是自己发送的临时消息，用clientId平滑替换
    if (m?.clientId) {
      const tmp = messages.querySelector(`[data-client-id="${m.clientId}"]`);
      if (tmp) {
        tmp.remove();
      }
    }
    
    const isMyMessage = m.nickname === myNickname || m.clientId === myClientId;
    renderMessage(messages, m, isMyMessage, messageMap);
    
    if (m.id) {
      messageMap.set(m.id, m);
    }
  });

  socket.on("room_users", (users) => {
    const userList = el("userList");
    const mobileUserList = el("mobile-userList");
    
    if (userList) {
      renderUsers(userList, users);
    }
    if (mobileUserList) {
      renderUsers(mobileUserList, users);
    }
  });

  socket.on("room_info", (room) => {
    updateRoomInfo(room);
  });

  socket.on("room_refresh", (data) => {
    if (!messages) return;
    
    if (data.message) {
      messages.innerHTML = '';
      const guidance = document.createElement('div');
      guidance.className = 'cyber-message';
      guidance.innerHTML = `<div class="cyber-message-body"><div class="cyber-message-text">${data.message}</div></div>`;
      messages.appendChild(guidance);
    }
    
    if (joined) {
      messageMap.clear();
      fetchHistory(currentRoomId);
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
