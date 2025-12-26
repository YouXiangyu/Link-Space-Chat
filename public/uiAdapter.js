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
  const nicknameSafe = msg.status === 'sending' ? '' : escapeHtml(msg.nickname || 'Unknown');
  const messageText = msg.status === 'sending' ? 'Sending...' : (msg.text || '');
  const textSafe = escapeHtml(messageText);
  
  // 头像占位符（基于名字首字母）
  const avatarChar = escapeHtml((msg.nickname || '?').charAt(0).toUpperCase());
  
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
          <span class="cyber-message-nickname">${nicknameSafe}</span>
          <span class="cyber-message-time">${time}</span>
        </div>
        <div class="cyber-message-body">
          <div class="cyber-message-text">${textSafe}</div>
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
  // 如果是投票消息，使用专门的渲染函数
  if (message.poll) {
    return renderPollMessage(container, message, isMyMessage, messageMap);
  }
  
  // 创建临时容器转换 HTML 字符串
  const temp = document.createElement('div');
  let html = createCyberMessage(message, isMyMessage);
  
  // 处理回复引用 - 放在消息文本上方
  if (message.parentMessageId && message.status !== 'sending' && messageMap) {
    const parentMsg = messageMap.get(message.parentMessageId);
    if (parentMsg) {
      const parentPreviewRaw = parentMsg.text || '';
      const parentPreview = parentPreviewRaw.length > 50 ? parentPreviewRaw.substring(0, 50) + '...' : parentPreviewRaw;
      const replyHTML = `
        <div class="cyber-message-reply">
          <span class="cyber-message-reply-author">${escapeHtml(parentMsg.nickname || 'Unknown')}:</span>
          <span>${escapeHtml(parentPreview)}</span>
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
  // 移动端：也使用单击触发回复（更符合用户习惯）
  messageEl.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerReply();
  });
  
  // 移动端：保留长按作为备用方式（减少长按时间到300ms）
  messageEl.addEventListener('touchstart', (e) => {
    clickTimer = setTimeout(() => {
      e.preventDefault();
      triggerReply();
    }, 300);
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
    const avatarEl = document.createElement('div');
    avatarEl.className = 'cyber-user-avatar';
    avatarEl.textContent = avatarChar;
    const nameEl = document.createElement('span');
    nameEl.textContent = name;
    li.appendChild(avatarEl);
    li.appendChild(nameEl);
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

/**
 * 渲染投票消息
 * @param {HTMLElement} container - 消息容器
 * @param {Object} message - 消息对象（包含poll属性）
 * @param {boolean} isMyMessage - 是否是自己发送的消息
 * @param {Map} messageMap - 消息Map
 * @param {Function} onVote - 投票回调函数（可选）
 */
export function renderPollMessage(container, message, isMyMessage = false, messageMap = null, onVote = null) {
  if (!container || !message.poll) return;
  
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const avatarChar = (message.nickname || '?').charAt(0).toUpperCase();
  const alignmentClass = isMyMessage ? 'my-message' : '';
  const poll = message.poll;
  const pollId = poll.id;
  const options = poll.options || [];
  const totalVotes = poll.totalVotes || 0;
  
  // 获取用户已投的选项（从消息的poll对象中获取，或从全局状态获取）
  const userVote = poll.userVote || (window.pollUserVotes && window.pollUserVotes[pollId]) || null;
  
  // 检查是否过期
  const isExpired = poll.expiresAt && Date.now() > poll.expiresAt;
  
  // 构建选项HTML
  let optionsHTML = '';
  options.forEach(option => {
    const voteCount = option.voteCount || 0;
    const voteRate = option.voteRate || 0;
    const isVoted = userVote === option.id;
    const votePercent = totalVotes > 0 ? (voteRate * 100).toFixed(1) : 0;
    
    optionsHTML += `
      <div class="poll-option ${isVoted ? 'poll-option-voted' : ''} ${isExpired ? 'poll-option-disabled' : ''}" 
           data-option-id="${option.id}" 
           data-poll-id="${pollId}">
        <div class="poll-option-content">
          <div class="poll-option-text">${escapeHtml(option.optionText)}</div>
          <div class="poll-option-stats">
            <span class="poll-option-count">${voteCount}票</span>
            <span class="poll-option-percent">${votePercent}%</span>
          </div>
        </div>
        <div class="poll-option-bar">
          <div class="poll-option-progress" style="width: ${votePercent}%"></div>
        </div>
      </div>
    `;
  });
  
  // 构建投票消息HTML
  const pollHTML = `
    <div class="cyber-message poll-message ${alignmentClass}" data-message-id="${message.id || ''}" data-poll-id="${pollId}">
      <div class="cyber-message-avatar">${avatarChar}</div>
      <div class="cyber-message-content">
        <div class="cyber-message-header">
          <span class="cyber-message-nickname">${escapeHtml(message.nickname || 'Unknown')}</span>
          <span class="cyber-message-time">${time}</span>
        </div>
        <div class="cyber-message-body">
          <div class="poll-container">
            <div class="poll-title">${escapeHtml(message.text || '投票')}</div>
            <div class="poll-meta">
              <span class="poll-total-votes">已投票: ${totalVotes}人</span>
              ${isExpired ? '<span class="poll-expired">已过期</span>' : ''}
            </div>
            <div class="poll-options">
              ${optionsHTML}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const temp = document.createElement('div');
  temp.innerHTML = pollHTML;
  const messageEl = temp.firstElementChild;
  
  if (!messageEl) {
    console.error('Failed to create poll message element');
    return;
  }
  
  // 绑定投票事件
  if (!isExpired && onVote) {
    messageEl.querySelectorAll('.poll-option').forEach(optionEl => {
      optionEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const optionId = parseInt(optionEl.dataset.optionId);
        const pollId = parseInt(optionEl.dataset.pollId);
        if (optionId && pollId && onVote) {
          onVote(pollId, optionId);
        }
      });
    });
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
  
  // 保存到消息Map
  if (messageMap && message.id) {
    messageMap.set(message.id, message);
  }
}

/**
 * 更新投票结果显示
 * @param {HTMLElement} container - 消息容器
 * @param {number} pollId - 投票ID
 * @param {Object} results - 投票结果对象
 * @param {number|null} userVote - 用户已投的选项ID
 */
export function updatePollResults(container, pollId, results, userVote = null) {
  if (!container || !results) return;
  
  const pollMessageEl = container.querySelector(`[data-poll-id="${pollId}"]`);
  if (!pollMessageEl) return;
  
  const options = results.options || [];
  const totalVotes = results.totalVotes || 0;
  
  // 更新用户投票状态（全局状态）
  if (!window.pollUserVotes) {
    window.pollUserVotes = {};
  }
  if (userVote !== null && userVote !== undefined) {
    window.pollUserVotes[pollId] = userVote;
  }
  
  // 更新总票数
  const metaEl = pollMessageEl.querySelector('.poll-meta .poll-total-votes');
  if (metaEl) {
    metaEl.textContent = `已投票: ${totalVotes}人`;
  }
  
  // 更新每个选项的显示
  options.forEach(option => {
    const optionEl = pollMessageEl.querySelector(`[data-option-id="${option.id}"]`);
    if (!optionEl) return;
    
    const voteCount = option.voteCount || 0;
    const voteRate = option.voteRate || 0;
    const votePercent = totalVotes > 0 ? (voteRate * 100).toFixed(1) : 0;
    const isVoted = userVote === option.id;
    
    // 更新投票数
    const countEl = optionEl.querySelector('.poll-option-count');
    if (countEl) countEl.textContent = `${voteCount}票`;
    
    // 更新百分比
    const percentEl = optionEl.querySelector('.poll-option-percent');
    if (percentEl) percentEl.textContent = `${votePercent}%`;
    
    // 更新进度条
    const progressEl = optionEl.querySelector('.poll-option-progress');
    if (progressEl) {
      progressEl.style.width = `${votePercent}%`;
    }
    
    // 更新投票状态
    if (isVoted) {
      optionEl.classList.add('poll-option-voted');
    } else {
      optionEl.classList.remove('poll-option-voted');
    }
  });
}

/**
 * HTML转义函数（防止XSS）
 * @param {string} text - 要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

