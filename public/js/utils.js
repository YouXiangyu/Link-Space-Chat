// --- public/js/utils.js ---
// 工具函数模块

/**
 * 获取DOM元素
 * @param {string} id - 元素ID
 * @returns {HTMLElement|null}
 */
export function el(id) {
  return document.getElementById(id);
}

/**
 * 从URL路径获取房间ID
 * @returns {string} 房间ID
 */
export function getRoomIdFromPath() {
  const m = location.pathname.match(/^\/r\/([^\/?#]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/**
 * 格式化绝对时间
 * @param {number} ts - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
export function formatAbsoluteTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const sameMonth = sameYear && d.getMonth() === now.getMonth();
  const sameDay = sameMonth && d.getDate() === now.getDate();
  const pad = (n) => String(n).padStart(2, "0");
  if (sameDay) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  if (sameMonth) {
    return `${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  if (sameYear) {
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 格式化相对时间
 * @param {number} ts - 时间戳
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "刚刚";
  if (diff < 60) return `${diff}秒前`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  return `${d}天前`;
}

/**
 * 获取URL查询参数
 * @returns {Object} 包含nickname, password, description的对象
 */
export function getSearchParams() {
  const params = new URLSearchParams(location.search);
  return {
    nickname: params.get("nickname") || "",
    password: params.get("password") || "",
    description: params.get("desc") || params.get("description") || "",
  };
}

