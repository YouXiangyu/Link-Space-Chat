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
  const leaveBtn = el("leaveBtn"); // New leave button

  function getRoomIdFromPath() {
    const m = location.pathname.match(/^\/r\/([^\/?#]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  let joined = false;
  let currentRoomId = getRoomIdFromPath();
  roomIdLabel.textContent = currentRoomId ? `房间：${currentRoomId}` : "未进入房间";
  leaveBtn.style.display = "none"; // Hide leave button initially

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

  joinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nickname = nicknameInput.value.trim();
    let roomId = roomIdInput.value.trim() || getRoomIdFromPath();
    if (!nickname || !roomId) {
      alert("请输入昵称并指定房间ID（或通过URL路径进入 /r/<roomId>）");
      return;
    }
    socket.emit("join_room", { roomId, nickname }, (resp) => {
      if (!resp?.ok) return alert(resp?.error || "加入失败");
      joined = true;
      currentRoomId = roomId;
      roomIdLabel.textContent = `房间：${currentRoomId}`;
      messages.innerHTML = "";
      fetchHistory(currentRoomId);
      leaveBtn.style.display = "block"; // Show leave button after joining
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

  // --- NEW: Leave button logic ---
  leaveBtn.addEventListener("click", () => {
    if (!joined) return;
    socket.emit("leave_room");
    joined = false;
    roomIdLabel.textContent = "未进入房间";
    messages.innerHTML = "";
    userList.innerHTML = "";
    leaveBtn.style.display = "none";
    appendMessage({ text: "您已离开房间。" });
  });

  // --- NEW: Ping-Pong logic ---
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
})();