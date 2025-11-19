/**
 * 主题切换功能模块
 * 更新时间: 2025-01-12
 */

const THEME_STORAGE_KEY = 'link-space-chat-theme';
const DEFAULT_THEME = 'dark';

/**
 * 获取当前主题
 * @returns {string} 当前主题名称
 */
export function getCurrentTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
}

/**
 * 设置主题
 * @param {string} themeName - 主题名称
 */
export function setTheme(themeName) {
  if (!themeName) return;
  
  const html = document.documentElement;
  html.setAttribute('data-theme', themeName);
  localStorage.setItem(THEME_STORAGE_KEY, themeName);
  
  // 触发自定义事件，通知其他模块主题已更改
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: themeName } }));
}

/**
 * 初始化主题（从localStorage读取或使用默认主题）
 */
export function initTheme() {
  const savedTheme = getCurrentTheme();
  setTheme(savedTheme);
}

/**
 * 更新主题选择UI
 * @param {HTMLElement} container - 主题选项容器
 * @param {string} currentTheme - 当前主题
 */
export function updateThemeUI(container, currentTheme) {
  if (!container) return;
  
  const options = container.querySelectorAll('.theme-option');
  options.forEach(option => {
    const themeValue = option.dataset.themeValue;
    if (themeValue === currentTheme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

/**
 * 创建主题选择UI
 * @param {HTMLElement} container - 容器元素
 * @param {Function} onThemeChange - 主题切换回调
 */
export function createThemeUI(container, onThemeChange) {
  if (!container) return;
  
  const themes = [
    { value: 'dark', name: '深色主题', description: '默认深色风格' },
    { value: 'light', name: '浅色主题', description: '明亮清爽风格' },
    { value: 'blue', name: '蓝色主题', description: '海洋蓝色风格' },
    { value: 'green', name: '绿色主题', description: '自然绿色风格' },
    { value: 'purple', name: '紫色主题', description: '神秘紫色风格' }
  ];
  
  const currentTheme = getCurrentTheme();
  
  container.innerHTML = themes.map(theme => `
    <button type="button" class="theme-option ${theme.value === currentTheme ? 'active' : ''}" 
            data-theme-value="${theme.value}">
      <div>
        <div style="font-weight: 500; margin-bottom: 2px;">${theme.name}</div>
        <div style="font-size: 12px; color: var(--text-secondary);">${theme.description}</div>
      </div>
      <div class="theme-preview">
        <div class="theme-preview-color"></div>
        <span class="theme-check">✓</span>
      </div>
    </button>
  `).join('');
  
  // 绑定点击事件
  container.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', () => {
      const themeValue = option.dataset.themeValue;
      if (themeValue) {
        setTheme(themeValue);
        updateThemeUI(container, themeValue);
        if (onThemeChange) {
          onThemeChange(themeValue);
        }
      }
    });
  });
}

