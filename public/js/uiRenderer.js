/**
 * UI渲染模块
 */

import { formatAbsoluteTime, formatRelativeTime } from './utils.js';

/**
 * 显示初始引导信息
 * @param {HTMLElement} messagesEl - 消息容器元素
 */
export function showInitialGuidance(messagesEl) {
  messagesEl.innerHTML = `<li class="guidance">欢迎来到 Link Space Chat！<br>请从左侧菜单输入昵称，然后加入或创建一个房间开始聊天。<br><br>由 Do It Dui Team 开发</li>`;
}

/**
 * 添加消息到界面
 * @param {HTMLElement} messagesEl - 消息容器元素
 * @param {Map} messageMap - 消息Map
 * @param {Function} startReply - 开始回复的回调函数
 * @param {object} message - 消息对象
 */
export function appendMessage(messagesEl, messageMap, startReply, { nickname, text, createdAt, contentType = 'text', id, status = 'sent', clientId, parentMessageId = null, isHighlighted = false }) {
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
    const parentMsg = messageMap.get(parentMessageId);
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
    messageMap.set(id, { id, nickname, text, createdAt, parentMessageId, isHighlighted });
  }
  
  // PC端点击回复，移动端长按回复
  if (status === 'sent') {
    let clickTimer = null;
    li.addEventListener('click', (e) => {
      // PC端：单击触发回复
      if (window.innerWidth > 768) {
        e.stopPropagation();
        startReply({ id, nickname, text });
      }
    });
    
    li.addEventListener('touchstart', (e) => {
      clickTimer = setTimeout(() => {
        // 移动端：长按触发回复
        e.preventDefault();
        startReply({ id, nickname, text });
      }, 500); // 500ms长按
    });
    
    li.addEventListener('touchend', () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
    });
    
    li.addEventListener('touchmove', () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
    });
  }
}

/**
 * 替换消息（用于发送中状态替换为已发送状态）
 * @param {HTMLElement} messagesEl - 消息容器元素
 * @param {string} clientId - 客户端ID
 */
export function replaceMessage(messagesEl, clientId) {
  const tmp = messagesEl.querySelector(`li[data-client-id="${clientId}"]`);
  if (tmp) {
    tmp.remove();
  }
}

/**
 * 更新房间信息显示
 * 注意：必须使用 room.isCreator，而不是 stateStore.isCreator
 * @param {object} elements - DOM元素对象
 * @param {object} room - 房间对象
 */
export function updateRoomInfo(elements, room) {
  const { roomName, roomDescription, roomPasswordStatus, editRoomBtn, infoRoomName, infoRoomDescription, infoRoomPassword } = elements;
  
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
  // 关键：直接从 room 对象读取 isCreator，不要使用 stateStore.isCreator
  const isCreator = room.isCreator === true;
  // 调试信息
  console.log('updateRoomInfo:', { roomId: room.id, isCreator, roomIsCreator: room.isCreator });
  editRoomBtn.style.display = isCreator ? "block" : "none";

  // 顶栏房间信息面板数据
  infoRoomName.textContent = room.name || room.id || "";
  infoRoomDescription.textContent = room.description || "";
  infoRoomPassword.value = room.password || "";
}

/**
 * 更新用户列表
 * @param {HTMLElement} userListEl - 用户列表元素
 * @param {string[]} users - 用户昵称数组
 */
export function updateUserList(userListEl, users) {
  userListEl.innerHTML = "";
  for (const name of users) {
    const li = document.createElement("li");
    li.textContent = name;
    userListEl.appendChild(li);
  }
}

/**
 * 渲染用户列表
 * @param {HTMLElement} userListEl - 用户列表元素
 * @param {string[]} users - 用户昵称数组
 */
export function renderUsers(userListEl, users) {
  updateUserList(userListEl, users);
}

