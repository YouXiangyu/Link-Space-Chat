/**
 * 主入口模块
 */

import { el, getRoomIdFromPath, formatRelativeTime, getSearchParams } from './utils.js';
import { StateStore } from './stateStore.js';
import { SocketClient } from './socketClient.js';
import { showInitialGuidance, appendMessage, replaceMessage, updateRoomInfo, updateUserList } from './uiRenderer.js';
import { performSearch, scrollToMessage } from './search.js';

// 初始化状态存储
const stateStore = new StateStore();
stateStore.currentRoomId = getRoomIdFromPath();

// DOM元素
const page = document.querySelector(".page");
const container = document.querySelector(".container");
const elements = {
  userList: el("userList"),
  messages: el("messages"),
  joinForm: el("joinForm"),
  nicknameInput: el("nickname"),
  roomIdInput: el("roomIdInput"),
  roomPasswordInput: el("roomPasswordInput"),
  messageForm: el("messageForm"),
  messageInput: el("messageInput"),
  roomIdLabel: el("roomIdLabel"),
  sidebarToggleBtn: el("sidebarToggleBtn"),
  sidebarCloseBtn: el("sidebarCloseBtn"),
  leaveBtn: el("leaveBtn"),
  shareBtn: el("shareBtn"),
  brandRoomInfoBtn: el("brandRoomInfoBtn"),
  roomInfo: el("roomInfo"),
  roomName: el("roomName"),
  roomDescription: el("roomDescription"),
  roomPasswordStatus: el("roomPasswordStatus"),
  editRoomBtn: el("editRoomBtn"),
  shareModal: el("shareModal"),
  closeModalBtn: el("closeModalBtn"),
  qrCodeContainer: el("qrCode"),
  shareLinkInput: el("shareLinkInput"),
  copyLinkBtn: el("copyLinkBtn"),
  rateLimitToast: el("rateLimitToast"),
  replyBox: el("replyBox"),
  replyPreviewText: el("replyPreviewText"),
  cancelReplyBtn: el("cancelReplyBtn"),
  searchInput: el("searchInput"),
  searchBtn: el("searchBtn"),
  searchResults: el("searchResults"),
  sidebarMain: el("sidebarMain"),
  sidebarFeature: el("sidebarFeature"),
  featureBackBtn: el("featureBackBtn"),
  featureTitle: el("featureTitle"),
  featureSearchSection: el("featureSearch"),
  featureProjectSection: el("featureProject"),
  editRoomModal: el("editRoomModal"),
  closeEditModalBtn: el("closeEditModalBtn"),
  editRoomForm: el("editRoomForm"),
  editRoomName: el("editRoomName"),
  editRoomDescription: el("editRoomDescription"),
  editRoomPassword: el("editRoomPassword"),
  editPasswordConfirmGroup: el("editPasswordConfirmGroup"),
  editPasswordConfirm: el("editPasswordConfirm"),
  cancelEditBtn: el("cancelEditBtn"),
  passwordModal: el("passwordModal"),
  passwordForm: el("passwordForm"),
  passwordInput: el("passwordInput"),
  cancelPasswordBtn: el("cancelPasswordBtn"),
  roomInfoModal: el("roomInfoModal"),
  closeRoomInfoModalBtn: el("closeRoomInfoModalBtn"),
  infoRoomName: el("infoRoomName"),
  infoRoomDescription: el("infoRoomDescription"),
  infoRoomPassword: el("infoRoomPassword"),
  togglePasswordVisibleBtn: el("togglePasswordVisibleBtn"),
  prefillJoinModal: el("prefillJoinModal"),
  prefillNickname: el("prefillNickname"),
  prefillRoomId: el("prefillRoomId"),
  prefillPassword: el("prefillPassword"),
  prefillDescription: el("prefillDescription"),
  prefillCancelBtn: el("prefillCancelBtn"),
  prefillConfirmBtn: el("prefillConfirmBtn")
};

// 初始化Socket客户端
const socketClient = new SocketClient();

// 功能切换
const featureSections = {
  search: elements.featureSearchSection,
  project: elements.featureProjectSection
};

const featureTitles = {
  search: "消息搜索",
  project: "项目信息"
};

function openFeature(featureKey) {
  if (!elements.sidebarMain || !elements.sidebarFeature) return;
  const section = featureSections[featureKey];
  if (!section) return;
  stateStore.currentFeature = featureKey;
  elements.sidebarMain.style.display = "none";
  elements.sidebarFeature.style.display = "flex";
  Object.entries(featureSections).forEach(([key, elem]) => {
    if (elem) {
      elem.style.display = key === featureKey ? "block" : "none";
    }
  });
  if (elements.featureTitle) {
    elements.featureTitle.textContent = featureTitles[featureKey] || "";
  }
  if (featureKey === "search" && elements.searchInput) {
    elements.searchInput.focus();
  }
}

function closeFeature() {
  stateStore.currentFeature = null;
  if (elements.sidebarMain) elements.sidebarMain.style.display = "";
  if (elements.sidebarFeature) elements.sidebarFeature.style.display = "none";
  if (elements.searchResults) elements.searchResults.style.display = "none";
}

// 初始化UI
elements.roomIdLabel.textContent = stateStore.currentRoomId ? `房间：${stateStore.currentRoomId}` : "未进入房间";
elements.leaveBtn.style.display = "none";
elements.shareBtn.style.display = "block";

// 回复功能
function startReply(msg) {
  stateStore.replyingTo = msg;
  elements.replyPreviewText.textContent = `${msg.nickname}: ${msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text}`;
  elements.replyBox.style.display = 'block';
  elements.messageInput.focus();
}

function cancelReply() {
  stateStore.replyingTo = null;
  elements.replyBox.style.display = 'none';
}

// 频率限制提示
function showRateLimitToast() {
  elements.rateLimitToast.classList.add("show");
  setTimeout(() => {
    elements.rateLimitToast.classList.remove("show");
  }, 3000);
}

// 获取历史消息
async function fetchHistory(roomId) {
  try {
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages?limit=20`);
    if (!res.ok) return;
    const data = await res.json();
    stateStore.clearMessages();
    // 关键：过滤历史消息，只显示当前房间的消息（双重保险）
    const currentRoomMessages = data.messages.filter(m => !m.roomId || m.roomId === roomId);
    for (const m of currentRoomMessages) {
      appendMessage(elements.messages, stateStore.messageMap, startReply, m);
      stateStore.addMessage(m);
    }
  } catch {}
}

// 离开房间
function leaveCurrentRoom() {
  if (!stateStore.joined) return;
  socketClient.leaveRoom();
  stateStore.joined = false;
  stateStore.setRoom("", null);
  elements.roomIdLabel.textContent = "未进入房间";
  elements.userList.innerHTML = "";
  elements.leaveBtn.style.display = "none";
  updateRoomInfo(elements, null);
  showInitialGuidance(elements.messages);
  stateStore.clearMessages();
  cancelReply();
  if (elements.searchInput) elements.searchInput.value = "";
  if (elements.searchResults) elements.searchResults.style.display = 'none';
  closeFeature();
}

// 加入房间
function joinRoom(roomId, nickname, password = null) {
  socketClient.joinRoom(roomId, nickname, password, (resp) => {
    if (!resp?.ok) {
      if (resp?.error === "PASSWORD_REQUIRED") {
        stateStore.pendingJoin = { roomId, nickname };
        elements.passwordModal.classList.add("visible");
        elements.passwordInput.focus();
        return;
      }
      if (!stateStore.joined) showInitialGuidance(elements.messages);
      alert(resp?.message || resp?.error || "加入失败");
      return;
    }
    
    stateStore.joined = true;
    stateStore.currentRoomId = roomId;
    // 注意：resp.room 可能不存在，房间信息会通过 room_info 事件发送
    // 所以这里不设置 stateStore.currentRoom，等待 room_info 事件
    elements.roomIdLabel.textContent = `房间：${stateStore.currentRoomId}`;
    elements.messages.innerHTML = "";
    stateStore.pendingJoin = null;
    
    const roomUrl = `/r/${encodeURIComponent(stateStore.currentRoomId)}`;
    if (location.pathname !== roomUrl) {
      history.pushState({}, "", roomUrl);
    }
    
    fetchHistory(stateStore.currentRoomId);
    elements.leaveBtn.style.display = "block";
    elements.shareBtn.style.display = "block";
    elements.passwordModal.classList.remove("visible");
    elements.roomPasswordInput.style.display = "none";
    
    if (window.innerWidth <= 768) {
      page.classList.remove("sidebar-open");
    }
  });
}

// 设置Socket回调
socketClient.setCallbacks({
  onHistory: (list) => {
    stateStore.clearMessages();
    // 关键：过滤历史消息，只显示当前房间的消息
    const currentRoomMessages = list.filter(m => !m.roomId || m.roomId === stateStore.currentRoomId);
    for (const m of currentRoomMessages) {
      appendMessage(elements.messages, stateStore.messageMap, startReply, m);
      stateStore.addMessage(m);
    }
  },
  onChatMessage: (m) => {
    // 关键：只显示当前房间的消息，防止跨房间消息泄露
    if (m?.roomId && m.roomId !== stateStore.currentRoomId) {
      console.warn('收到其他房间的消息，已忽略:', { messageRoomId: m.roomId, currentRoomId: stateStore.currentRoomId });
      return;
    }
    if (m?.clientId) {
      replaceMessage(elements.messages, m.clientId);
    }
    appendMessage(elements.messages, stateStore.messageMap, startReply, m);
    stateStore.addMessage(m);
  },
  onRoomUsers: (users) => {
    updateUserList(elements.userList, users);
  },
  onRoomInfo: (room) => {
    // 关键：直接传递 room 对象给 updateRoomInfo
    // updateRoomInfo 会从 room.isCreator 读取，而不是 stateStore.isCreator
    if (room) {
      stateStore.setRoom(stateStore.currentRoomId, room);
      updateRoomInfo(elements, room);
      // 调试信息
      console.log('收到 room_info 事件:', { roomId: room.id, isCreator: room.isCreator });
    }
  },
  onRoomRefresh: (data) => {
    if (data.message) {
      elements.messages.innerHTML = `<li class="guidance">${data.message}</li>`;
    }
    if (stateStore.joined) {
      stateStore.clearMessages();
      fetchHistory(stateStore.currentRoomId);
    }
  }
});

// 事件监听器设置
closeFeature();

if (elements.featureBackBtn) {
  elements.featureBackBtn.addEventListener("click", () => {
    closeFeature();
  });
}

const moreMenuButtons = document.querySelectorAll(".more-menu-item");
moreMenuButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const featureKey = btn.dataset.feature;
    if (featureKey) {
      openFeature(featureKey);
    }
  });
});

// 定时刷新悬浮相对时间（每60秒）
setInterval(() => {
  const nodes = document.querySelectorAll(".message-time");
  nodes.forEach((n) => {
    const ts = Number(n.dataset.ts || 0);
    if (ts) n.title = formatRelativeTime(ts);
  });
}, 60000);

// 加入表单
elements.joinForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (stateStore.joined) {
    socketClient.leaveRoom();
    stateStore.joined = false;
  }

  const nickname = elements.nicknameInput.value.trim();
  if (!nickname) {
    alert("请输入一个昵称");
    return;
  }

  let roomId = elements.roomIdInput.value.trim() || getRoomIdFromPath();
  if (!roomId) {
    roomId = "1";
  }

  const password = elements.roomPasswordInput.value.trim() || null;
  joinRoom(roomId, nickname, password);
});

// 密码表单
elements.passwordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!stateStore.pendingJoin) return;
  const password = elements.passwordInput.value.trim();
  if (!password) {
    alert("请输入密码");
    return;
  }
  joinRoom(stateStore.pendingJoin.roomId, stateStore.pendingJoin.nickname, password);
  elements.passwordInput.value = "";
});

elements.cancelPasswordBtn.addEventListener("click", () => {
  elements.passwordModal.classList.remove("visible");
  stateStore.pendingJoin = null;
  elements.passwordInput.value = "";
});

// 消息表单
elements.messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    elements.messageForm.dispatchEvent(new Event("submit"));
  }
});

elements.messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!stateStore.joined) return alert("请先加入房间");
  const text = elements.messageInput.value.trim();
  if (!text) return;
  
  const isHighlighted = /^#\s+.+/.test(text.trim());
  const tempId = Date.now();
  const clientId = `${tempId}-${Math.random().toString(36).slice(2, 8)}`;
  appendMessage(elements.messages, stateStore.messageMap, startReply, {
    nickname: "",
    text: text,
    createdAt: Date.now(),
    contentType: 'text',
    id: tempId,
    status: 'sending',
    clientId,
    parentMessageId: stateStore.replyingTo ? stateStore.replyingTo.id : null,
    isHighlighted: isHighlighted
  });
  
  socketClient.sendMessage({ 
    text, 
    clientId,
    parentMessageId: stateStore.replyingTo ? stateStore.replyingTo.id : null,
    isHighlighted: isHighlighted
  }, (resp) => {
    if (!resp?.ok) {
      const msgEl = elements.messages.querySelector(`[data-message-id="${tempId}"]`);
      if (msgEl) msgEl.remove();
      
      if (resp?.error === "rate_limit") {
        showRateLimitToast();
      } else {
        console.error(resp?.error || resp?.message);
        alert(resp?.message || "发送失败");
      }
    } else {
      cancelReply();
    }
  });
  elements.messageInput.value = "";
});

elements.cancelReplyBtn.addEventListener("click", cancelReply);
elements.leaveBtn.addEventListener("click", leaveCurrentRoom);

// 分享模态框
elements.shareBtn.addEventListener("click", () => {
  elements.qrCodeContainer.innerHTML = "";
  QRCode.toCanvas(window.location.href, { width: 200, margin: 1 }, (err, canvas) => {
    if (err) return console.error(err);
    elements.qrCodeContainer.appendChild(canvas);
  });
  elements.shareLinkInput.value = window.location.href;
  elements.shareModal.classList.add("visible");
});

elements.closeModalBtn.addEventListener("click", () => {
  elements.shareModal.classList.remove("visible");
});

elements.shareModal.addEventListener("click", (e) => {
  if (e.target === elements.shareModal) {
    elements.shareModal.classList.remove("visible");
  }
});

elements.copyLinkBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(elements.shareLinkInput.value).then(() => {
    elements.copyLinkBtn.textContent = "已复制!";
    setTimeout(() => {
      elements.copyLinkBtn.textContent = "复制";
    }, 2000);
  }).catch(err => {
    console.error("无法复制链接: ", err);
    alert("复制失败");
  });
});

// 编辑房间模态框
elements.editRoomBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  console.log('编辑按钮被点击，currentRoom:', stateStore.currentRoom);
  if (!stateStore.currentRoom) {
    console.warn('currentRoom 为空，无法打开编辑模态框');
    return;
  }
  elements.editRoomName.value = stateStore.currentRoom.name || "";
  elements.editRoomDescription.value = stateStore.currentRoom.description || "";
  elements.editRoomPassword.value = "";
  if (stateStore.currentRoom.password) {
    elements.editPasswordConfirmGroup.style.display = "block";
    elements.editPasswordConfirm.checked = false;
  } else {
    elements.editPasswordConfirmGroup.style.display = "none";
    elements.editPasswordConfirm.checked = false;
  }
  elements.editRoomModal.classList.add("visible");
});

elements.closeEditModalBtn.addEventListener("click", () => {
  elements.editRoomModal.classList.remove("visible");
});

elements.cancelEditBtn.addEventListener("click", () => {
  elements.editRoomModal.classList.remove("visible");
});

elements.editRoomModal.addEventListener("click", (e) => {
  if (e.target === elements.editRoomModal) {
    elements.editRoomModal.classList.remove("visible");
  }
});

elements.editRoomForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!stateStore.joined) return;
  
  const newName = elements.editRoomName.value.trim() || null;
  const newDesc = elements.editRoomDescription.value.trim() || null;
  const newPwdRaw = elements.editRoomPassword.value.trim();

  const updates = {};
  updates.name = newName;
  updates.description = newDesc;

  const hadPassword = !!(stateStore.currentRoom && stateStore.currentRoom.password);
  const wantsPwdChange = newPwdRaw.length > 0 || (hadPassword && newPwdRaw.length === 0);
  if (hadPassword) {
    if (wantsPwdChange && !elements.editPasswordConfirm.checked) {
      alert("请勾选「修改密码并清空聊天记录」以确认修改密码。");
      return;
    }
    if (elements.editPasswordConfirm.checked && wantsPwdChange) {
      updates.password = newPwdRaw || null;
    }
  } else {
    if (wantsPwdChange) {
      updates.password = newPwdRaw || null;
    }
  }

  socketClient.updateRoom(updates, (resp) => {
    if (!resp?.ok) {
      alert(resp?.message || resp?.error || "更新失败");
      return;
    }
    elements.editRoomModal.classList.remove("visible");
    stateStore.setRoom(stateStore.currentRoomId, resp.room);
    updateRoomInfo(elements, resp.room);
  });
});

// 搜索功能
elements.searchBtn.addEventListener("click", () => {
  performSearch(
    elements.searchInput,
    elements.searchResults,
    stateStore.messageMap,
    stateStore.joined,
    stateStore.currentFeature,
    openFeature,
    (messageId) => scrollToMessage(elements.messages, messageId)
  );
});

elements.searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    performSearch(
      elements.searchInput,
      elements.searchResults,
      stateStore.messageMap,
      stateStore.joined,
      stateStore.currentFeature,
      openFeature,
      (messageId) => scrollToMessage(elements.messages, messageId)
    );
  }
});

// 侧栏切换
elements.sidebarToggleBtn.addEventListener("click", () => {
  page.classList.toggle("sidebar-open");
});

elements.sidebarCloseBtn.addEventListener("click", () => {
  page.classList.remove("sidebar-open");
});

container.addEventListener("click", (e) => {
  if (e.target === container) {
    page.classList.remove("sidebar-open");
  }
});

window.addEventListener("beforeunload", (e) => {
  if (stateStore.joined) {
    e.preventDefault();
    e.returnValue = "您确定要离开聊天室吗？您的连接将会断开。";
  }
});

// 顶栏房间信息入口
elements.brandRoomInfoBtn.addEventListener("click", () => {
  if (!stateStore.currentRoom) return;
  elements.roomInfoModal.classList.add("visible");
  elements.infoRoomPassword.type = "password";
});

elements.closeRoomInfoModalBtn.addEventListener("click", () => {
  elements.roomInfoModal.classList.remove("visible");
});

elements.roomInfoModal.addEventListener("click", (e) => {
  if (e.target === elements.roomInfoModal) elements.roomInfoModal.classList.remove("visible");
});

elements.togglePasswordVisibleBtn.addEventListener("click", () => {
  if (elements.infoRoomPassword.type === "password") {
    elements.infoRoomPassword.type = "text";
  } else {
    elements.infoRoomPassword.type = "password";
  }
});

elements.roomInfo.addEventListener("click", () => {
  if (!stateStore.currentRoom) return;
  elements.roomInfoModal.classList.add("visible");
  elements.infoRoomPassword.type = "password";
});

// 预填加入窗口
const { nickname: qsNickname, password: qsPassword, description: qsDesc } = getSearchParams();
const shouldOpenPrefill =
  Boolean(stateStore.currentRoomId) || Boolean(qsNickname) || Boolean(qsPassword) || Boolean(qsDesc);

function openPrefillModalIfNeeded() {
  if (!elements.prefillJoinModal || !shouldOpenPrefill) return;
  if (elements.prefillNickname) elements.prefillNickname.value = qsNickname || elements.nicknameInput.value || "";
  if (elements.prefillRoomId) elements.prefillRoomId.value = stateStore.currentRoomId || elements.roomIdInput.value || "";
  if (elements.prefillPassword) elements.prefillPassword.value = qsPassword || "";
  if (elements.prefillDescription) elements.prefillDescription.value = qsDesc || "";
  elements.prefillJoinModal.classList.add("visible");
}

if (elements.prefillCancelBtn && elements.prefillJoinModal) {
  elements.prefillCancelBtn.addEventListener("click", () => {
    elements.prefillJoinModal.classList.remove("visible");
  });
}

if (elements.prefillJoinModal) {
  elements.prefillJoinModal.addEventListener("click", (e) => {
    if (e.target === elements.prefillJoinModal) {
      elements.prefillJoinModal.classList.remove("visible");
    }
  });
}

if (elements.prefillConfirmBtn) {
  elements.prefillConfirmBtn.addEventListener("click", () => {
    if (elements.prefillNickname && elements.nicknameInput) elements.nicknameInput.value = elements.prefillNickname.value.trim();
    if (elements.prefillRoomId && elements.roomIdInput) elements.roomIdInput.value = elements.prefillRoomId.value.trim();
    if (elements.prefillPassword && elements.roomPasswordInput) elements.roomPasswordInput.value = elements.prefillPassword.value.trim();

    const nickname = elements.nicknameInput.value.trim();
    if (!nickname) {
      alert("请输入一个昵称");
      return;
    }
    elements.joinForm.dispatchEvent(new Event("submit"));
    elements.prefillJoinModal.classList.remove("visible");
  });
}

// 初始设置
if (!stateStore.currentRoomId) {
  showInitialGuidance(elements.messages);
}

if (stateStore.currentRoomId && elements.roomIdInput) {
  elements.roomIdInput.value = stateStore.currentRoomId;
}

openPrefillModalIfNeeded();

