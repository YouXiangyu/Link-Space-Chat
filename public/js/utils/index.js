/**
 * 通用工具函数集合
 */

export function getRoomIdFromPath() {
  const match = location.pathname.match(/^\/r\/([^\/?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

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

export function formatRelativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "刚刚";
  if (diff < 60) return `${diff}秒前`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}











