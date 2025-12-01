/**
 * SearchController - 处理前端本地搜索逻辑
 */

export function createSearchController({
  elements,
  messageMap,
  state,
  helpers,
  cyberTheme
}) {
  const {
    searchInput,
    searchBtn,
    searchResults,
    searchToggleBtn,
    mobileSearchToggleBtn,
    closeSearchBtn
  } = elements;

  function openPanel() {
    if (cyberTheme?.openSearchPanel) {
      cyberTheme.openSearchPanel();
    } else if (searchResults) {
      searchResults.style.display = 'flex';
    }
  }

  function closePanel() {
    if (cyberTheme?.closeSearchPanel) {
      cyberTheme.closeSearchPanel();
    } else if (searchResults) {
      searchResults.style.display = 'none';
    }
  }

  function performSearch() {
    if (!searchInput || !searchResults) return;
    const query = searchInput.value.trim();
    if (!query || !state.joined) {
      searchResults.style.display = 'none';
      return;
    }

    openPanel();

    const results = [];
    messageMap.forEach((msg) => {
      if (msg.text && msg.text.toLowerCase().includes(query.toLowerCase())) {
        results.push(msg);
      }
    });

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="cyber-search-result-empty">NO MATCHES FOUND</div>';
      searchResults.style.display = 'flex';
      return;
    }

    const displayResults = results.slice(0, 10);
    searchResults.innerHTML = displayResults.map(msg => {
      const preview = msg.text.length > 80 ? msg.text.substring(0, 80) + '…' : msg.text;
      const author = msg.nickname || 'Unknown';
      const timeStr = helpers.formatAbsoluteTime?.(msg.createdAt || Date.now()) || '';
      return `<button type="button" class="cyber-search-result-item" data-message-id="${msg.id}">
                <div class="cyber-search-result-header">
                  <span class="cyber-search-result-author">${author}</span>
                  <span>${timeStr}</span>
                </div>
                <div class="cyber-search-result-preview">${preview || '(no content)'}</div>
              </button>`;
    }).join('');
    searchResults.style.display = 'flex';

    searchResults.querySelectorAll(".cyber-search-result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const messageId = Number(item.dataset.messageId);
        if (messageId) {
          helpers.scrollToMessage?.(messageId);
        }
        closePanel();
      });
    });
  }

  function init() {
    if (searchBtn) {
      searchBtn.addEventListener("click", performSearch);
    }

    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          performSearch();
        }
      });
    }

    if (searchToggleBtn) {
      searchToggleBtn.addEventListener("click", openPanel);
    }

    if (mobileSearchToggleBtn) {
      mobileSearchToggleBtn.addEventListener("click", () => {
        openPanel();
        if (cyberTheme?.closeMobileSidebar) {
          cyberTheme.closeMobileSidebar();
        }
      });
    }

    if (closeSearchBtn) {
      closeSearchBtn.addEventListener("click", closePanel);
    }
  }

  return {
    init,
    performSearch
  };
}











