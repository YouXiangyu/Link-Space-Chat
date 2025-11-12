// --- public/js/uiRenderer.js ---
// UI渲染模块：负责DOM操作和UI更新

import { formatAbsoluteTime, formatRelativeTime } from './utils.js';
import { stateStore } from './stateStore.js';

/**
 * 显示初始引导信息
 * @param {HTMLElement} messagesEl - 消息容器元素
 */
export function showInitialGuidance(messagesEl) {
  messagesEl.innerHTML = `<li class="guidance">欢迎来到 Link Space Chat！<br>请从左侧菜单输入昵称，然后加入或创建一个房间开始聊天。<br><br>由 Do It Dui Team 开发</li>`;
}

/**
 * 增强的消息显示（支持回复、高亮）
 * @param {HTMLElement} messagesEl - 消息容器元素
 * @param {Object} params - 消息参数
 * @param {string} params.nickname - 昵称
 * @param {string} params.text - 消息内容
 * @param {number} params.createdAt - 创建时间戳
 * @param {string} params.contentType - 消息类型
 * @param {number} params.id - 消息ID
 * @param {string} params.status - 消息状态（'sending' | 'sent'）
 * @param {string} params.clientId - 客户端ID
 * @param {number} params.parentMessageId - 父消息ID
 * @param {boolean} params.isHighlighted - 是否高亮
 * @param {Function} onReplyClick - 回复点击回调
 */
export function appendMessage(messagesEl, { nickname, text, createdAt, contentType = 'text', id, status = 'sent', clientId, parentMessageId = null, isHighlighted = false }, onReplyClick) {
  const li = document.createElement("li");
  li.className = `message`;
  if (status === 'sending') {
    li.classList.add('message-sending');
  }
  // 高亮消息
  if (isHighlighted) {
    li.classList.add('message-highlighted');
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
  textEl.textContent = (status === 'sending' ? "发送中…" : text);

  const content = document.createElement("div");
  content.className = "message-content";
  
  // 显示引用关系（最多2层）
  if (parentMessageId && status !== 'sending') {
    const parentMsg = stateStore.messageMap.get(parentMessageId);
    if (parentMsg) {
      const replyEl = document.createElement("div");
      replyEl.className = "message-reply";
      const replyAuthor = document.createElement("span");
      replyAuthor.className = "message-reply-author";
      replyAuthor.textContent = parentMsg.nickname || "未知用户";
      const replyText = document.createElement("span");
      replyText.className = "message-reply-text";
      replyText.textContent = parentMsg.text || "";
      replyEl.appendChild(replyAuthor);
      replyEl.appendChild(replyText);
      content.appendChild(replyEl);
    }
  }
  
  if (nickname && status !== 'sending') {
    content.appendChild(nicknameEl);
    content.appendChild(document.createTextNode(": "));
  }
  content.appendChild(textEl);

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper";
  wrapper.appendChild(timeEl);
  wrapper.appendChild(content);

  li.appendChild(wrapper);
  li.dataset.messageId = id;
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  
  // 保存到消息Map（仅已发送的消息）
  if (status === 'sent' && id) {
    stateStore.addMessage({ id, nickname, text, createdAt, parentMessageId, isHighlighted });
  }
  
  // PC端点击回复，移动端长按回复
  if (status === 'sent' && onReplyClick) {
    let clickTimer = null;
    li.addEventListener('click', (e) => {
      // PC端：单击触发回复
      if (window.innerWidth > 768) {
        e.stopPropagation();
        onReplyClick({ id, nickname, text });
      }
    });
    li.addEventListener('touchstart', (e) => {
      // 移动端：长按触发回复
      clickTimer = setTimeout(() => {
        e.preventDefault();
        onReplyClick({ id, nickname, text });
      }, 500);
    });
    li.addEventListener('touchend', () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
    });
  }
}

/**
 * 更新房间信息显示
 * @param {Object} elements - DOM元素对象
 * @param {Object} room - 房间对象
 * @param {boolean} isCreator - 是否为创建者
 */
export function updateRoomInfo(elements, room, isCreator) {
  const { roomName, roomDescription, roomPasswordStatus, editRoomBtn } = elements;
  
  if (!room) {
    if (roomName) roomName.textContent = "";
    if (roomDescription) roomDescription.textContent = "";
    if (roomPasswordStatus) roomPasswordStatus.textContent = "";
    if (editRoomBtn) editRoomBtn.style.display = "none";
    return;
  }
  
  if (roomName) roomName.textContent = room.name || "";
  if (roomDescription) roomDescription.textContent = room.description || "";
  if (roomPasswordStatus) {
    roomPasswordStatus.textContent = room.password ? "🔒 已设置密码" : "🔓 开放房间";
    roomPasswordStatus.className = room.password ? "room-password-status locked" : "room-password-status unlocked";
  }
  if (editRoomBtn) {
    editRoomBtn.style.display = isCreator ? "block" : "none";
  }
}

/**
 * 更新用户列表
 * @param {HTMLElement} userListEl - 用户列表元素
 * @param {Array<string>} users - 用户昵称数组
 */
export function updateUserList(userListEl, users) {
  if (!userListEl) return;
  userListEl.innerHTML = users.map(u => `<li>${u}</li>`).join("");
}

/**
 * 替换消息（用于发送中状态更新）
 * @param {HTMLElement} messagesEl - 消息容器元素
 * @param {string} clientId - 客户端ID
 * @param {Object} newMessage - 新消息对象
 * @param {Function} onReplyClick - 回复点击回调
 */
export function replaceMessage(messagesEl, clientId, newMessage, onReplyClick) {
  const oldLi = messagesEl.querySelector(`[data-client-id="${clientId}"]`);
  if (oldLi) {
    // 移除旧消息
    oldLi.remove();
    // 添加新消息（使用完整的appendMessage逻辑）
    appendMessage(messagesEl, { ...newMessage, status: 'sent' }, onReplyClick);
  }
}

