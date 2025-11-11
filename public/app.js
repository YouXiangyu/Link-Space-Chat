(() => {
  const socket = io();

  const el = (id) => document.getElementById(id);
  const page = document.querySelector(".page");
  const container = document.querySelector(".container");
  const userList = el("userList");
  const messages = el("messages");
  const joinForm = el("joinForm");
  const nicknameInput = el("nickname");
  const roomIdInput = el("roomIdInput");
  const roomPasswordInput = el("roomPasswordInput");
  const messageForm = el("messageForm");
  const messageInput = el("messageInput");
  const roomIdLabel = el("roomIdLabel");
  const sidebarToggleBtn = el("sidebarToggleBtn");
  const sidebarCloseBtn = el("sidebarCloseBtn");
  const leaveBtn = el("leaveBtn");
  const shareBtn = el("shareBtn");
  const brandRoomInfoBtn = el("brandRoomInfoBtn");

  // Phase 2: Room info elements
  const roomInfo = el("roomInfo");
  const roomName = el("roomName");
  const roomDescription = el("roomDescription");
  const roomPasswordStatus = el("roomPasswordStatus");
  const editRoomBtn = el("editRoomBtn");

  // Modal elements
  const shareModal = el("shareModal");
  const closeModalBtn = el("closeModalBtn");
  const qrCodeContainer = el("qrCode");
  const shareLinkInput = el("shareLinkInput");
  const copyLinkBtn = el("copyLinkBtn");
  const rateLimitToast = el("rateLimitToast");
  
  // Phase 2: Edit room modal
  const editRoomModal = el("editRoomModal");
  const closeEditModalBtn = el("closeEditModalBtn");
  const editRoomForm = el("editRoomForm");
  const editRoomName = el("editRoomName");
  const editRoomDescription = el("editRoomDescription");
  const editRoomPassword = el("editRoomPassword");
  const editPasswordConfirmGroup = el("editPasswordConfirmGroup");
  const editPasswordConfirm = el("editPasswordConfirm");
  const cancelEditBtn = el("cancelEditBtn");

  // Phase 2: Password modal
  const passwordModal = el("passwordModal");
  const passwordForm = el("passwordForm");
  const passwordInput = el("passwordInput");
  const cancelPasswordBtn = el("cancelPasswordBtn");

  // Room Info modal (topbar)
  const roomInfoModal = el("roomInfoModal");
  const closeRoomInfoModalBtn = el("closeRoomInfoModalBtn");
  const infoRoomName = el("infoRoomName");
  const infoRoomDescription = el("infoRoomDescription");
  const infoRoomPassword = el("infoRoomPassword");
  const togglePasswordVisibleBtn = el("togglePasswordVisibleBtn");

  function getRoomIdFromPath() {
    const m = location.pathname.match(/^\/r\/([^\/?#]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  let joined = false;
  let currentRoomId = getRoomIdFromPath();
  let currentRoom = null;
  let isCreator = false;
  let pendingJoin = null; // 存储待加入的房间信息（用于密码验证）

  roomIdLabel.textContent = currentRoomId ? `房间：${currentRoomId}` : "未进入房间";
  leaveBtn.style.display = "none";
  shareBtn.style.display = "block";

  // Phase 2: 时间格式（绝对时间 + 悬浮相对时间）
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
  function formatRelativeTime(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 10) return "刚刚";
    if (diff < 60) return `${diff}秒前`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}小时前`;
    const d = Math.floor(h / 24);
    return `${d}天前`;
  }

  function showInitialGuidance() {
    messages.innerHTML = `<li class="guidance">欢迎来到 Link Space Chat！<br>请从左侧菜单输入昵称，然后加入或创建一个房间开始聊天。<br><br>由 Do It Dui Team 开发</li>`;
  }

  // Phase 2: 增强的消息显示（支持消息类型）
  function appendMessage({ nickname, text, createdAt, contentType = 'text', id, status = 'sent', clientId }) {
    const li = document.createElement("li");
    li.className = `message message-${contentType}`;
    if (status === 'sending') {
      li.classList.add('message-sending');
    }
    if (clientId) {
      li.dataset.clientId = clientId;
    }
    const timeStr = formatAbsoluteTime(createdAt);
    const timeEl = document.createElement("span");
    timeEl.className = "message-time";
    timeEl.textContent = timeStr;
    timeEl.dataset.ts = String(createdAt);
    timeEl.title = formatRelativeTime(createdAt);

    const nicknameEl = document.createElement("span");
    nicknameEl.className = "message-nickname";
    nicknameEl.textContent = status === 'sending' ? "" : (nickname || "");

    const textEl = document.createElement("span");
    textEl.className = "message-text";
    
    // Phase 2: 根据消息类型渲染
    if (contentType === 'emoji') {
      textEl.className += " message-emoji";
      textEl.textContent = status === 'sending' ? "发送中…" : text;
    } else {
      // 普通文本，使用 textContent 防止 XSS，换行由样式处理
      textEl.textContent = (status === 'sending' ? "发送中…" : text);
    }

    const content = document.createElement("div");
    content.className = "message-content";
    if (nickname && status !== 'sending') {
      content.appendChild(nicknameEl);
      content.appendChild(document.createTextNode(": "));
    }
    content.appendChild(textEl);

    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper";
    wrapper.appendChild(timeEl);
    wrapper.appendChild(content);

    // 发送中不显示额外状态条，文本中直接显示“发送中…”

    li.appendChild(wrapper);
    li.dataset.messageId = id;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
  }

  // 定时刷新悬浮相对时间（每60秒）
  setInterval(() => {
    const nodes = document.querySelectorAll(".message-time");
    nodes.forEach((n) => {
      const ts = Number(n.dataset.ts || 0);
      if (ts) n.title = formatRelativeTime(ts);
    });
  }, 60000);

  function showRateLimitToast() {
    rateLimitToast.classList.add("show");
    setTimeout(() => {
      rateLimitToast.classList.remove("show");
    }, 3000);
  }

  function renderUsers(users) {
    userList.innerHTML = "";
    for (const name of users) {
      const li = document.createElement("li");
      li.textContent = name;
      userList.appendChild(li);
    }
  }

  // Phase 2: 更新房间信息显示
  function updateRoomInfo(room) {
    currentRoom = room;
    if (!room) {
      roomName.textContent = "";
      roomDescription.textContent = "";
      roomPasswordStatus.textContent = "";
      editRoomBtn.style.display = "none";
      return;
    }

    roomName.textContent = room.name || room.id || "未命名房间";
    roomDescription.textContent = room.description || "";
    roomPasswordStatus.textContent = room.password ? "🔒 已设置密码" : "🔓 开放房间";
    roomPasswordStatus.className = room.password ? "room-password-status locked" : "room-password-status unlocked";
    
    // 显示/隐藏编辑按钮（只有创建者可见）
    isCreator = room.isCreator === true;
    editRoomBtn.style.display = isCreator ? "block" : "none";

    // 顶栏房间信息面板数据
    infoRoomName.textContent = room.name || room.id || "";
    infoRoomDescription.textContent = room.description || "";
    infoRoomPassword.value = room.password || "";
  }

  async function fetchHistory(roomId) {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages?limit=20`);
      if (!res.ok) return;
      const data = await res.json();
      for (const m of data.messages) appendMessage(m);
    } catch {}
  }

  function leaveCurrentRoom() {
    if (!joined) return;
    socket.emit("leave_room");
    joined = false;
    currentRoom = null;
    isCreator = false;
    roomIdLabel.textContent = "未进入房间";
    userList.innerHTML = "";
    leaveBtn.style.display = "none";
    updateRoomInfo(null);
    showInitialGuidance();
  }

  // Phase 2: 加入房间（支持密码）
  function joinRoom(roomId, nickname, password = null) {
    socket.emit("join_room", { roomId, nickname, password }, (resp) => {
      if (!resp?.ok) {
        if (resp?.error === "PASSWORD_REQUIRED") {
          // 需要密码，显示密码输入框
          pendingJoin = { roomId, nickname };
          passwordModal.classList.add("visible");
          passwordInput.focus();
          return;
        }
        if (!joined) showInitialGuidance();
        alert(resp?.message || resp?.error || "加入失败");
        return;
      }
      
      joined = true;
      currentRoomId = roomId;
      roomIdLabel.textContent = `房间：${currentRoomId}`;
      messages.innerHTML = "";
      pendingJoin = null;
      
      const roomUrl = `/r/${encodeURIComponent(currentRoomId)}`;
      if (location.pathname !== roomUrl) {
        history.pushState({}, "", roomUrl);
      }
      
      fetchHistory(currentRoomId);
      leaveBtn.style.display = "block";
      shareBtn.style.display = "block";
      passwordModal.classList.remove("visible");
      roomPasswordInput.style.display = "none";
      
      if (window.innerWidth <= 768) {
        page.classList.remove("sidebar-open");
      }
    });
  }

  joinForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (joined) {
      socket.emit("leave_room");
      joined = false;
    }

    const nickname = nicknameInput.value.trim();
    if (!nickname) {
      alert("请输入一个昵称");
      return;
    }

    let roomId = roomIdInput.value.trim() || getRoomIdFromPath();
    if (!roomId) {
      roomId = "1";
    }

    const password = roomPasswordInput.value.trim() || null;
    joinRoom(roomId, nickname, password);
  });

  // Phase 2: 密码表单提交
  passwordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!pendingJoin) return;
    const password = passwordInput.value.trim();
    if (!password) {
      alert("请输入密码");
      return;
    }
    joinRoom(pendingJoin.roomId, pendingJoin.nickname, password);
    passwordInput.value = "";
  });

  cancelPasswordBtn.addEventListener("click", () => {
    passwordModal.classList.remove("visible");
    pendingJoin = null;
    passwordInput.value = "";
  });

  // Phase 2: 键盘快捷键（Enter发送，Shift+Enter换行）
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      messageForm.dispatchEvent(new Event("submit"));
    }
  });

  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!joined) return alert("请先加入房间");
    const text = messageInput.value.trim();
    if (!text) return;
    
    // Phase 2: 显示发送中状态
    const tempId = Date.now();
    const clientId = `${tempId}-${Math.random().toString(36).slice(2, 8)}`;
    appendMessage({
      nickname: "", // 发送中不显示昵称
      text: text,
      createdAt: Date.now(),
      contentType: 'text',
      id: tempId,
      status: 'sending',
      clientId
    });
    
    socket.emit("chat_message", { text, clientId }, (resp) => {
      if (!resp?.ok) {
        // 移除发送中的消息
        const msgEl = messages.querySelector(`[data-message-id="${tempId}"]`);
        if (msgEl) msgEl.remove();
        
        if (resp?.error === "rate_limit") {
          showRateLimitToast();
        } else {
          console.error(resp?.error || resp?.message);
          alert(resp?.message || "发送失败");
        }
      }
    });
    messageInput.value = "";
  });

  leaveBtn.addEventListener("click", leaveCurrentRoom);

  // Share Modal Logic
  shareBtn.addEventListener("click", () => {
    qrCodeContainer.innerHTML = "";
    QRCode.toCanvas(window.location.href, { width: 200, margin: 1 }, (err, canvas) => {
      if (err) return console.error(err);
      qrCodeContainer.appendChild(canvas);
    });
    shareLinkInput.value = window.location.href;
    shareModal.classList.add("visible");
  });

  closeModalBtn.addEventListener("click", () => {
    shareModal.classList.remove("visible");
  });

  shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) {
      shareModal.classList.remove("visible");
    }
  });

  copyLinkBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(shareLinkInput.value).then(() => {
      copyLinkBtn.textContent = "已复制!";
      setTimeout(() => {
        copyLinkBtn.textContent = "复制";
      }, 2000);
    }).catch(err => {
      console.error("无法复制链接: ", err);
      alert("复制失败");
    });
  });

  // Phase 2: Edit Room Modal Logic
  editRoomBtn.addEventListener("click", (e) => {
    // 避免触发父级 roomInfo 的点击，防止误弹“房间信息”面板
    e.stopPropagation();
    if (!currentRoom) return;
    editRoomName.value = currentRoom.name || "";
    editRoomDescription.value = currentRoom.description || "";
    editRoomPassword.value = ""; // 不显示现有密码
    // 当已设置密码时，展示“修改密码并清空聊天记录”选项
    if (currentRoom.password) {
      editPasswordConfirmGroup.style.display = "block";
      editPasswordConfirm.checked = false;
    } else {
      editPasswordConfirmGroup.style.display = "none";
      editPasswordConfirm.checked = false;
    }
    editRoomModal.classList.add("visible");
  });

  closeEditModalBtn.addEventListener("click", () => {
    editRoomModal.classList.remove("visible");
  });

  cancelEditBtn.addEventListener("click", () => {
    editRoomModal.classList.remove("visible");
  });

  editRoomModal.addEventListener("click", (e) => {
    if (e.target === editRoomModal) {
      editRoomModal.classList.remove("visible");
    }
  });

  editRoomForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!joined) return;
    
    const newName = editRoomName.value.trim() || null;
    const newDesc = editRoomDescription.value.trim() || null;
    const newPwdRaw = editRoomPassword.value.trim();

    const updates = {};
    updates.name = newName;
    updates.description = newDesc;

    // 只有当勾选了“修改密码并清空聊天记录”或房间原本没有密码时，才允许提交密码变更
    const hadPassword = !!(currentRoom && currentRoom.password);
    const wantsPwdChange = newPwdRaw.length > 0 || (hadPassword && newPwdRaw.length === 0); // 输入新密码或清空现有密码
    if (hadPassword) {
      if (wantsPwdChange && !editPasswordConfirm.checked) {
        alert("请勾选“修改密码并清空聊天记录”以确认修改密码。");
        return;
      }
      if (editPasswordConfirm.checked && wantsPwdChange) {
        updates.password = newPwdRaw || null;
      }
    } else {
      // 原本没有密码，允许直接设置或保持为空
      if (wantsPwdChange) {
        updates.password = newPwdRaw || null;
      }
    }

    socket.emit("update_room", updates, (resp) => {
      if (!resp?.ok) {
        alert(resp?.message || resp?.error || "更新失败");
        return;
      }
      editRoomModal.classList.remove("visible");
      updateRoomInfo(resp.room);
      // 不再隐藏编辑入口，允许后续修改密码（需勾选确认）
    });
  });

  // Socket Listeners
  socket.on("server-ping", (callback) => {
    callback("ok");
  });

  socket.on("history", (list) => {
    for (const m of list) appendMessage(m);
  });

  socket.on("chat_message", (m) => {
    // 如果是自己发送的临时消息，用clientId平滑替换
    if (m?.clientId) {
      const tmp = document.querySelector(`li[data-client-id="${m.clientId}"]`);
      if (tmp) {
        tmp.remove();
      }
    }
    appendMessage(m);
  });

  socket.on("room_users", (users) => renderUsers(users));

  // Phase 2: 房间信息事件
  socket.on("room_info", (room) => {
    updateRoomInfo(room);
  });

  socket.on("room_refresh", (data) => {
    if (data.message) {
      messages.innerHTML = `<li class="guidance">${data.message}</li>`;
    }
    if (joined) {
      fetchHistory(currentRoomId);
    }
  });

  sidebarToggleBtn.addEventListener("click", () => {
    page.classList.toggle("sidebar-open");
  });

  sidebarCloseBtn.addEventListener("click", () => {
    page.classList.remove("sidebar-open");
  });

  container.addEventListener("click", (e) => {
    if (e.target === container) {
      page.classList.remove("sidebar-open");
    }
  });

  window.addEventListener("beforeunload", (e) => {
    if (joined) {
      e.preventDefault();
      e.returnValue = "您确定要离开聊天室吗？您的连接将会断开。";
    }
  });

  // 顶栏房间信息入口
  brandRoomInfoBtn.addEventListener("click", () => {
    if (!currentRoom) return;
    roomInfoModal.classList.add("visible");
    // 默认隐藏密码
    infoRoomPassword.type = "password";
  });
  closeRoomInfoModalBtn.addEventListener("click", () => {
    roomInfoModal.classList.remove("visible");
  });
  roomInfoModal.addEventListener("click", (e) => {
    if (e.target === roomInfoModal) roomInfoModal.classList.remove("visible");
  });
  togglePasswordVisibleBtn.addEventListener("click", () => {
    if (infoRoomPassword.type === "password") {
      infoRoomPassword.type = "text";
    } else {
      infoRoomPassword.type = "password";
    }
  });

  // 侧栏“房间信息”卡片也可点击打开
  roomInfo.addEventListener("click", () => {
    if (!currentRoom) return;
    roomInfoModal.classList.add("visible");
    infoRoomPassword.type = "password";
  });
  
  // Initial setup
  if (!currentRoomId) {
    showInitialGuidance();
  }
})();
