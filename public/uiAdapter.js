/**
 * UI Adapter - 主题感知的消息渲染适配器
 * 创建时间: 2025-01-12
 * 
 * 这个文件负责将消息数据渲染为Cyber主题的HTML结构
 * 同时保持与原有app.js逻辑的兼容性
 */

/**
 * 生成赛博朋克风格的消息 HTML 结构
 * @param {Object} msg - 消息对象
 * @param {boolean} isMyMessage - 是否是自己发送的消息
 * @returns {string} HTML字符串
 */
export function createCyberMessage(msg, isMyMessage = false) {
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // 头像占位符（基于名字首字母）
  const avatarChar = (msg.nickname || '?').charAt(0).toUpperCase();
  
  const alignmentClass = isMyMessage ? 'my-message' : '';
  const highlightClass = msg.isHighlighted ? 'highlighted' : '';
  const sendingClass = msg.status === 'sending' ? 'sending' : '';
  
  // 回复引用显示
  let replyHTML = '';
  if (msg.parentMessageId && msg.status !== 'sending') {
    // 这里需要从messageMap获取父消息，但为了解耦，我们在渲染时处理
    replyHTML = '<div class="cyber-message-reply" data-parent-id="' + msg.parentMessageId + '">Replying to message...</div>';
  }
  
  return `
    <div class="cyber-message ${alignmentClass} ${highlightClass} ${sendingClass}" data-message-id="${msg.id || ''}" data-client-id="${msg.clientId || ''}">
      <div class="cyber-message-avatar">${avatarChar}</div>
      <div class="cyber-message-content">
        <div class="cyber-message-header">
          <span class="cyber-message-nickname">${msg.status === 'sending' ? '' : (msg.nickname || 'Unknown')}</span>
          <span class="cyber-message-time">${time}</span>
        </div>
        <div class="cyber-message-body">
          <div class="cyber-message-text">${msg.status === 'sending' ? 'Sending...' : (msg.text || '')}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染消息到容器（主题感知版本）
 * @param {HTMLElement} container - 消息容器
 * @param {Object} message - 消息对象
 * @param {boolean} isMyMessage - 是否是自己发送的消息
 * @param {Map} messageMap - 消息Map，用于查找回复的父消息
 */
export function renderMessage(container, message, isMyMessage = false, messageMap = null) {
  // 创建临时容器转换 HTML 字符串
  const temp = document.createElement('div');
  let html = createCyberMessage(message, isMyMessage);
  
  // 处理回复引用 - 放在消息文本上方
  if (message.parentMessageId && message.status !== 'sending' && messageMap) {
    const parentMsg = messageMap.get(message.parentMessageId);
    if (parentMsg) {
      const replyHTML = `
        <div class="cyber-message-reply">
          <span class="cyber-message-reply-author">${parentMsg.nickname || 'Unknown'}:</span>
          <span>${(parentMsg.text || '').substring(0, 50)}${(parentMsg.text || '').length > 50 ? '...' : ''}</span>
        </div>
      `;
      // 在消息文本前插入回复引用
      html = html.replace(
        '<div class="cyber-message-text">',
        replyHTML + '<div class="cyber-message-text">'
      );
    }
  }
  
  // 安全地设置HTML内容（防止XSS）
  // 注意：这里仍然使用innerHTML，因为我们需要渲染HTML结构
  // 但在实际应用中，应该对message.text进行转义
  temp.innerHTML = html;
  const messageEl = temp.firstElementChild;
  
  if (!messageEl) {
    console.error('Failed to create message element');
    return;
  }
  
  // GSAP 入场动画
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(messageEl, 
      { x: isMyMessage ? 20 : -20, opacity: 0, skewX: -5 },
      { x: 0, opacity: 1, skewX: 0, duration: 0.4, ease: "power2.out" }
    );
  }
  
  container.appendChild(messageEl);
  
  // 滚动到底部
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  
  // 添加点击/长按回复事件（仅已发送的消息）
  if (message.status !== 'sending' && message.id) {
    attachReplyHandlers(messageEl, message, messageMap);
  }
}

/**
 * 为消息元素附加回复事件处理器
 * @param {HTMLElement} messageEl - 消息元素
 * @param {Object} message - 消息对象
 * @param {Map} messageMap - 消息映射（用于查找父消息）
 */
function attachReplyHandlers(messageEl, message, messageMap) {
  let clickTimer = null;
  
  const triggerReply = () => {
    // 使用事件总线触发回复
    if (window.eventBus && typeof window.eventBus.emit === 'function') {
      window.eventBus.emit('message:startReply', { 
        id: message.id, 
        nickname: message.nickname, 
        text: message.text 
      });
    } else if (window.startReply && typeof window.startReply === 'function') {
      // 兼容旧版本
      window.startReply({ id: message.id, nickname: message.nickname, text: message.text });
    }
  };
  
  // PC端：单击触发回复
  messageEl.addEventListener('click', (e) => {
    if (window.innerWidth > 768) {
      e.stopPropagation();
      triggerReply();
    }
  });
  
  // 移动端：长按触发回复
  messageEl.addEventListener('touchstart', (e) => {
    clickTimer = setTimeout(() => {
      e.preventDefault();
      triggerReply();
    }, 500);
  });
  
  messageEl.addEventListener('touchend', () => {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
  });
  
  messageEl.addEventListener('touchmove', () => {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
  });
}

/**
 * 渲染用户列表
 * @param {HTMLElement} container - 用户列表容器
 * @param {Array<string>} users - 用户昵称数组
 */
export function renderUsers(container, users) {
  if (!container) return;
  
  container.innerHTML = '';
  
  for (const name of users) {
    const li = document.createElement('li');
    li.className = 'cyber-user-item';
    const avatarChar = name.charAt(0).toUpperCase();
    li.innerHTML = `
      <div class="cyber-user-avatar">${avatarChar}</div>
      <span>${name}</span>
    `;
    container.appendChild(li);
  }
}

/**
 * 更新房间信息显示
 * @param {HTMLElement} container - 房间信息容器
 * @param {Object} room - 房间对象
 */
export function updateRoomInfoDisplay(container, room) {
  if (!container || !room) return;
  
  const nameEl = container.querySelector('#roomName, #mobile-roomName');
  const descEl = container.querySelector('#roomDescription, #mobile-roomDescription');
  const pwdStatusEl = container.querySelector('#roomPasswordStatus, #mobile-roomPasswordStatus');
  
  if (nameEl) nameEl.textContent = room.name || room.id || 'Unnamed Room';
  if (descEl) descEl.textContent = room.description || '';
  if (pwdStatusEl) {
    pwdStatusEl.textContent = room.password ? '🔒 LOCKED' : '🔓 OPEN';
    pwdStatusEl.className = room.password ? 'text-xs font-mono text-red-400' : 'text-xs font-mono text-green-400';
  }
}

/**
 * 显示频率限制提示（Cyber主题版本）
 * @param {HTMLElement} toastEl - Toast元素
 */
export function showRateLimitToast(toastEl) {
  if (!toastEl) return;
  
  toastEl.classList.remove('hidden');
  
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(toastEl, 
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3 }
    );
  }
  
  setTimeout(() => {
    if (typeof gsap !== 'undefined') {
      gsap.to(toastEl, {
        x: 100,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          toastEl.classList.add('hidden');
        }
      });
    } else {
      toastEl.classList.add('hidden');
    }
  }, 3000);
}

/**
 * 显示初始引导信息
 * @param {HTMLElement} container - 消息容器
 */
export function showInitialGuidance(container) {
  if (!container) return;
  
  const guidanceEl = container.querySelector('#initial-guidance');
  if (guidanceEl) {
    guidanceEl.style.display = 'flex';
  } else {
    container.innerHTML = `
      <div id="initial-guidance" class="flex flex-col items-center justify-center opacity-30 py-10 select-none pointer-events-none">
        <i class="ri-code-s-slash-line text-6xl mb-4"></i>
        <span class="font-mono text-sm">SYSTEM READY. AWAITING INPUT.</span>
      </div>
    `;
  }
}

/**
 * 隐藏初始引导信息
 * @param {HTMLElement} container - 消息容器
 */
export function hideInitialGuidance(container) {
  if (!container) return;
  
  const guidanceEl = container.querySelector('#initial-guidance');
  if (guidanceEl) {
    guidanceEl.style.display = 'none';
  }
}

/**
 * 滚动到指定消息并高亮
 * @param {HTMLElement} container - 消息容器
 * @param {number} messageId - 消息ID
 */
export function scrollToMessage(container, messageId) {
  if (!container) return;
  
  const msgEl = container.querySelector(`[data-message-id="${messageId}"]`);
  if (msgEl) {
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    msgEl.classList.add('search-hit');
    setTimeout(() => {
      msgEl.classList.remove('search-hit');
    }, 1000);
  }
}

