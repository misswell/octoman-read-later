// shared.js - 共享工具函数

export function sendMessage(type, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export function getCurrentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(tabs[0] || null);
      }
    });
  });
}

export function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // 1分钟内
  if (diff < 60000) return '刚刚';
  // 1小时内
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return '今天 ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
  // 更早
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

export function truncateUrl(url, maxLen = 50) {
  if (!url) return '';
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen) + '...';
}
