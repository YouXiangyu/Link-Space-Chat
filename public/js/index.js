// --- public/js/index.js ---
// 主入口模块：初始化应用并协调各个模块

import { el, getRoomIdFromPath, getSearchParams, formatRelativeTime } from './utils.js';
import { stateStore } from './stateStore.js';
import { showInitialGuidance, appendMessage, updateRoomInfo, updateUserList, replaceMessage } from './uiRenderer.js';
import SocketClient from './socketClient.js';
import { performSearch, scrollToMessage } from './search.js';

// 初始化Socket.IO
const socket = io();

// DOM元素集合
const elements = {
  page: document.querySelector(".page"),
  container: document.querySelector(".container"),
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
  prefillCancelBtn: el("prefillCancelBtn"),
  prefillNickname: el("prefillNickname"),
  prefillRoomId: el("prefillRoomId"),
  prefillPassword: el("prefillPassword"),
  prefillDescription: el("prefillDescription"),
  prefillConfirmBtn: el("prefillConfirmBtn")
};

// 初始化状态
stateStore.currentRoomId = getRoomIdFromPath();
elements.roomIdLabel.textContent = stateStore.currentRoomId ? `房间：${stateStore.currentRoomId}` : "未进入房间";
elements.leaveBtn.style.display = "none";
elements.shareBtn.style.display = "block";

// 功能页面管理
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

// Socket客户端回调
const socketCallbacks = {
  onReplyClick: startReply,
  onRoomRefresh: (data) => {
    if (data?.message) {
      alert(data.message);
    }
  },
  onRoomInfoUpdate: (room) => {
    updateRoomInfo(elements, room, stateStore.isCreator);
    // 更新房间信息模态框
    if (elements.infoRoomName) {
      elements.infoRoomName.textContent = room.name || room.id || "";
    }
    if (elements.infoRoomDescription) {
      elements.infoRoomDescription.textContent = room.description || "";
    }
    if (elements.infoRoomPassword) {
      elements.infoRoomPassword.value = room.password || "";
    }
  }
};

// 初始化Socket客户端
const socketClient = new SocketClient(socket, elements, socketCallbacks);

// 显示初始引导
if (!stateStore.joined) {
  showInitialGuidance(elements.messages);
}

// 加入房间函数
async function joinRoom(roomId, nickname, password = null) {
  const result = await socketClient.joinRoom(roomId, nickname, password);
  if (!result.success) {
    if (result.needsPassword) {
      // 需要密码，显示密码输入框
      stateStore.pendingJoin = { roomId, nickname };
      elements.passwordModal.classList.add("visible");
      elements.passwordInput.focus();
      return;
    }
    // 其他错误
    if (!stateStore.joined) {
      showInitialGuidance(elements.messages);
    }
    alert(result.error || "加入失败");
    return;
  }
  
  stateStore.joined = true;
  stateStore.currentRoomId = roomId;
  elements.roomIdLabel.textContent = `房间：${stateStore.currentRoomId}`;
  elements.messages.innerHTML = "";
  stateStore.clearMessages();
  stateStore.pendingJoin = null;
  
  const roomUrl = `/r/${encodeURIComponent(stateStore.currentRoomId)}`;
  if (location.pathname !== roomUrl) {
    history.pushState({}, "", roomUrl);
  }
  
  // 获取历史消息（socket的history事件会自动触发，这里作为备用）
  // 注意：join_room成功后，服务器会通过socket发送history事件，所以这里可能不需要
  // 但保留作为备用方案
  try {
    const res = await fetch(`/api/rooms/${encodeURIComponent(stateStore.currentRoomId)}/messages?limit=20`);
    if (res.ok) {
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        // 只有在socket的history事件未触发时才使用
        if (elements.messages.children.length === 0) {
          data.messages.forEach(msg => {
            appendMessage(elements.messages, msg, startReply);
          });
        }
      }
    }
  } catch (err) {
    console.error("获取历史消息失败:", err);
  }
  
  elements.leaveBtn.style.display = "block";
  elements.shareBtn.style.display = "block";
  elements.passwordModal.classList.remove("visible");
  elements.roomPasswordInput.style.display = "none";
  
  if (window.innerWidth <= 768) {
    elements.page.classList.remove("sidebar-open");
  }
}

// 离开房间
function leaveCurrentRoom() {
  if (!stateStore.joined) return;
  socketClient.leaveRoom();
  stateStore.joined = false;
  stateStore.currentRoom = null;
  stateStore.isCreator = false;
  elements.roomIdLabel.textContent = "未进入房间";
  elements.userList.innerHTML = "";
  elements.leaveBtn.style.display = "none";
  updateRoomInfo(elements, null, false);
  showInitialGuidance(elements.messages);
  stateStore.clearMessages();
  cancelReply();
  if (elements.searchInput) elements.searchInput.value = "";
  if (elements.searchResults) elements.searchResults.style.display = 'none';
  closeFeature();
}

// 显示频率限制提示
function showRateLimitToast() {
  elements.rateLimitToast.classList.add("show");
  setTimeout(() => {
    elements.rateLimitToast.classList.remove("show");
  }, 3000);
}

// 事件监听器设置
function setupEventListeners() {
  // 加入房间表单
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

  // 消息发送
  elements.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      elements.messageForm.dispatchEvent(new Event("submit"));
    }
  });

  elements.messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!stateStore.joined) return alert("请先加入房间");
    const text = elements.messageInput.value.trim();
    if (!text) return;
    
    // 检测高亮（# 开头）
    const isHighlighted = /^#\s+.+/.test(text.trim());
    
    // 显示发送中状态
    const tempId = Date.now();
    const clientId = `${tempId}-${Math.random().toString(36).slice(2, 8)}`;
    appendMessage(elements.messages, {
      nickname: "",
      text: text,
      createdAt: Date.now(),
      contentType: 'text',
      id: tempId,
      status: 'sending',
      clientId,
      parentMessageId: stateStore.replyingTo ? stateStore.replyingTo.id : null,
      isHighlighted
    }, startReply);
    
    elements.messageInput.value = "";
    cancelReply();
    
    // 发送消息
    const success = await socketClient.sendMessage(
      text,
      stateStore.replyingTo ? stateStore.replyingTo.id : null,
      isHighlighted,
      clientId
    );
    
    if (!success) {
      // 移除发送中的消息
      const msgEl = elements.messages.querySelector(`[data-client-id="${clientId}"]`);
      if (msgEl) msgEl.remove();
      showRateLimitToast();
    } else {
      // 发送成功后取消回复状态
      cancelReply();
    }
  });

  // 取消回复
  elements.cancelReplyBtn.addEventListener("click", cancelReply);

  // 离开房间
  elements.leaveBtn.addEventListener("click", leaveCurrentRoom);

  // 分享功能
  elements.shareBtn.addEventListener("click", () => {
    const url = window.location.href;
    elements.shareLinkInput.value = url;
    elements.shareModal.classList.add("visible");
    if (window.QRCode && elements.qrCodeContainer) {
      elements.qrCodeContainer.innerHTML = "";
      window.QRCode.toCanvas(url, { width: 200, margin: 1 }, (err, canvas) => {
        if (err) return console.error(err);
        elements.qrCodeContainer.appendChild(canvas);
      });
    }
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
      alert("链接已复制到剪贴板");
    });
  });

  // 编辑房间
  elements.editRoomBtn.addEventListener("click", () => {
    if (!stateStore.currentRoom) return;
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

  elements.editRoomModal.addEventListener("click", (e) => {
    if (e.target === elements.editRoomModal) {
      elements.editRoomModal.classList.remove("visible");
    }
  });

  elements.cancelEditBtn.addEventListener("click", () => {
    elements.editRoomModal.classList.remove("visible");
  });

  elements.editRoomForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!stateStore.joined || !stateStore.isCreator) return;
    
    const newName = elements.editRoomName.value.trim() || null;
    const newDesc = elements.editRoomDescription.value.trim() || null;
    const newPwdRaw = elements.editRoomPassword.value.trim();
    
    const updates = {};
    if (newName !== null) updates.name = newName;
    if (newDesc !== null) updates.description = newDesc;
    
    const hadPassword = !!(stateStore.currentRoom && stateStore.currentRoom.password);
    const wantsPwdChange = newPwdRaw.length > 0 || (hadPassword && newPwdRaw.length === 0);
    
    if (hadPassword) {
      if (wantsPwdChange && !elements.editPasswordConfirm.checked) {
        alert("修改密码需要确认");
        return;
      }
      if (elements.editPasswordConfirm.checked && wantsPwdChange) {
        updates.password = newPwdRaw || null;
      }
    } else {
      updates.password = newPwdRaw || null;
    }
    
    const success = await socketClient.updateRoom(updates);
    if (success) {
      elements.editRoomModal.classList.remove("visible");
    }
  });

  // 房间信息模态框
  elements.brandRoomInfoBtn.addEventListener("click", () => {
    if (!stateStore.currentRoom) return;
    elements.roomInfoModal.classList.add("visible");
    elements.infoRoomPassword.type = "password";
  });

  elements.closeRoomInfoModalBtn.addEventListener("click", () => {
    elements.roomInfoModal.classList.remove("visible");
  });

  elements.roomInfoModal.addEventListener("click", (e) => {
    if (e.target === elements.roomInfoModal) {
      elements.roomInfoModal.classList.remove("visible");
    }
  });

  elements.togglePasswordVisibleBtn.addEventListener("click", () => {
    if (elements.infoRoomPassword.type === "password") {
      elements.infoRoomPassword.type = "text";
    } else {
      elements.infoRoomPassword.type = "password";
    }
  });

  // 搜索功能
  elements.searchBtn.addEventListener("click", () => {
    performSearch(
      elements.searchInput,
      elements.searchResults,
      elements.messages,
      openFeature,
      stateStore.currentFeature,
      stateStore.joined
    );
  });

  elements.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch(
        elements.searchInput,
        elements.searchResults,
        elements.messages,
        openFeature,
        stateStore.currentFeature,
        stateStore.joined
      );
    }
  });

  // 侧边栏控制
  elements.sidebarToggleBtn.addEventListener("click", () => {
    elements.page.classList.toggle("sidebar-open");
  });

  elements.sidebarCloseBtn.addEventListener("click", () => {
    elements.page.classList.remove("sidebar-open");
  });

  elements.container.addEventListener("click", (e) => {
    if (e.target === elements.container) {
      elements.page.classList.remove("sidebar-open");
    }
  });

  // 功能页面
  elements.featureBackBtn.addEventListener("click", closeFeature);

  document.querySelectorAll(".more-menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const featureKey = btn.dataset.feature;
      if (featureKey) {
        openFeature(featureKey);
      }
    });
  });

  // 页面卸载前提示
  window.addEventListener("beforeunload", (e) => {
    if (stateStore.joined) {
      e.preventDefault();
      e.returnValue = "您确定要离开聊天室吗？您的连接将会断开。";
    }
  });

  // 定时刷新相对时间
  setInterval(() => {
    const nodes = document.querySelectorAll(".message-time");
    nodes.forEach((n) => {
      const ts = Number(n.dataset.ts || 0);
      if (ts) {
        n.title = formatRelativeTime(ts);
      }
    });
  }, 60000);
}

// 处理URL参数预填
function handlePrefillModal() {
  const { nickname: qsNickname, password: qsPassword, description: qsDesc } = getSearchParams();
  const shouldShowPrefill = !stateStore.joined && (stateStore.currentRoomId || qsNickname || qsPassword || qsDesc);
  
  if (shouldShowPrefill && elements.prefillJoinModal) {
    if (elements.prefillNickname) elements.prefillNickname.value = qsNickname || elements.nicknameInput.value || "";
    if (elements.prefillRoomId) elements.prefillRoomId.value = stateStore.currentRoomId || "";
    if (elements.prefillPassword) elements.prefillPassword.value = qsPassword || "";
    if (elements.prefillDescription) elements.prefillDescription.value = qsDesc || "";
    elements.prefillJoinModal.classList.add("visible");
  }
}

// 预填模态框事件
if (elements.prefillConfirmBtn) {
  elements.prefillConfirmBtn.addEventListener("click", () => {
    if (elements.prefillNickname && elements.nicknameInput) {
      elements.nicknameInput.value = elements.prefillNickname.value.trim();
    }
    if (elements.prefillRoomId && elements.roomIdInput) {
      elements.roomIdInput.value = elements.prefillRoomId.value.trim();
    }
    if (elements.prefillPassword && elements.roomPasswordInput) {
      elements.roomPasswordInput.value = elements.prefillPassword.value.trim();
    }
    const nickname = elements.nicknameInput.value.trim();
    if (!nickname) {
      alert("请输入昵称");
      return;
    }
    const roomId = elements.roomIdInput.value.trim() || stateStore.currentRoomId || "1";
    const password = elements.roomPasswordInput.value.trim() || null;
    elements.prefillJoinModal.classList.remove("visible");
    joinRoom(roomId, nickname, password);
  });
}

if (elements.prefillCancelBtn) {
  elements.prefillCancelBtn.addEventListener("click", () => {
    elements.prefillJoinModal.classList.remove("visible");
  });
}

// 初始化
setupEventListeners();
handlePrefillModal();

// 导出全局函数（供搜索模块使用）
window.scrollToMessage = (messageId) => {
  scrollToMessage(elements.messages, messageId);
};

