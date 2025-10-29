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
  const messageForm = el("messageForm");
  const messageInput = el("messageInput");
  const roomIdLabel = el("roomIdLabel");
  const sidebarToggleBtn = el("sidebarToggleBtn");
  const sidebarCloseBtn = el("sidebarCloseBtn");
  const leaveBtn = el("leaveBtn");
  const shareBtn = el("shareBtn");

  // Share Modal Elements
  const shareModal = el("shareModal");
  const closeModalBtn = el("closeModalBtn");
  const qrCodeContainer = el("qrCode");
  const shareLinkInput = el("shareLinkInput");
  const copyLinkBtn = el("copyLinkBtn");

  function getRoomIdFromPath() {
    const m = location.pathname.match(/^\/r\/([^\/?#]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  let joined = false;
  let currentRoomId = getRoomIdFromPath();
  roomIdLabel.textContent = currentRoomId ? `房间：${currentRoomId}` : "未进入房间";
  leaveBtn.style.display = "none";
  shareBtn.style.display = "block"; // Share button is always visible

  function showInitialGuidance() {
    messages.innerHTML = `<li class="guidance">欢迎来到 Link Space Chat！<br>请从左侧菜单输入昵称，然后加入或创建一个房间开始聊天。<br><br>由 Do It Dui Team 开发</li>`;
  }

  function appendMessage({ nickname, text, createdAt }) {
    const li = document.createElement("li");
    const time = createdAt ? new Date(createdAt).toLocaleTimeString() : "";
    li.textContent = nickname ? `[${time}] ${nickname}: ${text}` : text;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
  }

  function renderUsers(users) {
    userList.innerHTML = "";
    for (const name of users) {
      const li = document.createElement("li");
      li.textContent = name;
      userList.appendChild(li);
    }
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
    roomIdLabel.textContent = "未进入房间";
    userList.innerHTML = "";
    leaveBtn.style.display = "none";
    // shareBtn remains visible
    showInitialGuidance(); // Show guidance after leaving
  }

  joinForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // If already in a room, leave it first.
    if (joined) {
      // We don't show the "You have left" message here, so just reset state
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
      roomId = "1"; // Default to room '1'
    }

    socket.emit("join_room", { roomId, nickname }, (resp) => {
      if (!resp?.ok) {
        // If joining fails, show guidance again if the user is not in any room
        if (!joined) showInitialGuidance();
        return alert(resp?.error || "加入失败");
      }
      joined = true;
      currentRoomId = roomId;
      roomIdLabel.textContent = `房间：${currentRoomId}`;
      messages.innerHTML = "";
      // Update URL if not already set
      const roomUrl = `/r/${encodeURIComponent(currentRoomId)}`;
      if (location.pathname !== roomUrl) {
        history.pushState({}, "", roomUrl);
      }
      fetchHistory(currentRoomId);
      leaveBtn.style.display = "block";
      shareBtn.style.display = "block";
      if (window.innerWidth <= 768) {
        page.classList.remove("sidebar-open");
      }
    });
  });

  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!joined) return alert("请先加入房间");
    const text = messageInput.value.trim();
    if (!text) return;
    socket.emit("chat_message", text, (resp) => {
      if (!resp?.ok) console.error(resp?.error);
    });
    messageInput.value = "";
  });

  leaveBtn.addEventListener("click", leaveCurrentRoom);

  // --- Share Modal Logic ---
  shareBtn.addEventListener("click", () => {
    qrCodeContainer.innerHTML = ""; // Clear previous QR code
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

  // --- Socket Listeners ---
  socket.on("server-ping", (callback) => {
    callback("ok"); // Respond immediately
  });

  socket.on("history", (list) => {
    for (const m of list) appendMessage(m);
  });
  socket.on("chat_message", (m) => appendMessage(m));
  socket.on("room_users", (users) => renderUsers(users));

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

  // --- NEW: Beforeunload logic ---
  window.addEventListener("beforeunload", (e) => {
    if (joined) {
      // This will trigger the browser's native confirmation dialog.
      e.preventDefault();
      e.returnValue = "您确定要离开聊天室吗？您的连接将会断开。";
      // Note: We can't force a socket.emit() here reliably, 
      // but the browser closing will trigger the server's 'disconnect' event anyway.
    }
  });
  
  // Initial setup
  if (!currentRoomId) {
    showInitialGuidance();
  }
})();