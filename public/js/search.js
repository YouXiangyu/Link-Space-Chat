// --- public/js/search.js ---
// 搜索功能模块

import { stateStore } from './stateStore.js';
import { formatAbsoluteTime } from './utils.js';

/**
 * 执行搜索
 * @param {HTMLElement} searchInput - 搜索输入框
 * @param {HTMLElement} searchResults - 搜索结果容器
 * @param {HTMLElement} messagesEl - 消息容器元素
 * @param {Function} openFeature - 打开功能页面函数
 * @param {string} currentFeature - 当前功能页面
 * @param {boolean} joined - 是否已加入房间
 */
export function performSearch(searchInput, searchResults, messagesEl, openFeature, currentFeature, joined) {
  if (!searchInput || !searchResults) return;
  const query = searchInput.value.trim();
  if (!query || !joined) {
    searchResults.style.display = 'none';
    return;
  }
  if (currentFeature !== "search") {
    openFeature("search");
  }
  
  // 搜索当前已加载的消息
  const results = [];
  stateStore.messageMap.forEach((msg) => {
    if (msg.text && msg.text.toLowerCase().includes(query.toLowerCase())) {
      results.push(msg);
    }
  });
  
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-result-empty">未找到匹配的消息</div>';
    searchResults.style.display = 'flex';
    return;
  }
  
  // 显示搜索结果（最多10条）
  const displayResults = results.slice(0, 10);
  searchResults.innerHTML = displayResults.map(msg => {
    const preview = msg.text.length > 80 ? msg.text.substring(0, 80) + '…' : msg.text;
    const author = msg.nickname || '未知';
    const timeStr = formatAbsoluteTime(msg.createdAt || Date.now());
    return `<button type="button" class="search-result-item" data-message-id="${msg.id}">
              <div class="search-result-header">
                <span class="search-result-author">${author}</span>
                <span>${timeStr}</span>
              </div>
              <div class="search-result-preview">${preview || '(无内容)'}</div>
            </button>`;
  }).join('');
  searchResults.style.display = 'flex';

  // 绑定点击事件
  searchResults.querySelectorAll(".search-result-item").forEach((item) => {
    item.addEventListener("click", () => {
      const messageId = Number(item.dataset.messageId);
      if (messageId) {
        scrollToMessage(messagesEl, messageId);
      }
    });
  });
}

/**
 * 滚动到指定消息并高亮
 * @param {HTMLElement} messagesEl - 消息容器元素
 * @param {number} messageId - 消息ID
 */
export function scrollToMessage(messagesEl, messageId) {
  const msgEl = messagesEl.querySelector(`[data-message-id="${messageId}"]`);
  if (msgEl) {
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    msgEl.classList.add('message-search-hit');
    setTimeout(() => {
      msgEl.classList.remove('message-search-hit');
    }, 1000);
  }
}

