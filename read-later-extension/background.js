// background.js - Service Worker
// 处理扩展安装、消息传递和数据管理

const LIST_KEY = 'read_later_list';
const TRASH_KEY = 'read_later_trash';
const TRASH_TTL_DAYS = 30;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Read Later extension installed');
  cleanupExpiredTrash();
});

// 定期清理过期回收站（每5分钟检查一次）
setInterval(cleanupExpiredTrash, 5 * 60 * 1000);

// 处理来自 popup 和 sidepanel 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'ADD_PAGE':
      handleAddPage(message.data, sendResponse);
      break;
    case 'GET_LIST':
      handleGetList(sendResponse);
      break;
    case 'UPDATE_ITEM':
      handleUpdateItem(message.data, sendResponse);
      break;
    case 'DELETE_ITEM':
      handleDeleteItem(message.data.id, sendResponse);
      break;
    case 'DELETE_ALL':
      handleDeleteAll(sendResponse);
      break;
    case 'RESTORE_ITEM':
      handleRestoreItem(message.data.id, sendResponse);
      break;
    case 'GET_TRASH':
      handleGetTrash(sendResponse);
      break;
    case 'PERMANENT_DELETE_ITEM':
      handlePermanentDeleteItem(message.data.id, sendResponse);
      break;
    case 'PERMANENT_DELETE_ALL':
      handlePermanentDeleteAll(sendResponse);
      break;
    case 'GET_CURRENT_TAB':
      handleGetCurrentTab(sendResponse);
      break;
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  return true;
});

async function handleAddPage(data, sendResponse) {
  try {
    const list = await getList();
    const now = Date.now();
    const newItem = {
      id: 'item_' + now,
      title: data.title || '无标题',
      url: data.url || '',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now
    };
    list.unshift(newItem);
    await saveList(list);
    sendResponse({ success: true, item: newItem });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetList(sendResponse) {
  try {
    const list = await getList();
    sendResponse({ success: true, list });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateItem(data, sendResponse) {
  try {
    const list = await getList();
    const index = list.findIndex(item => item.id === data.id);
    if (index === -1) {
      sendResponse({ success: false, error: 'Item not found' });
      return;
    }
    list[index] = { ...list[index], ...data, updatedAt: Date.now() };
    await saveList(list);
    sendResponse({ success: true, item: list[index] });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteItem(id, sendResponse) {
  try {
    const list = await getList();
    const index = list.findIndex(item => item.id === id);
    if (index === -1) {
      sendResponse({ success: false, error: 'Item not found' });
      return;
    }
    const deletedItem = list[index];
    deletedItem.deletedAt = Date.now();
    list.splice(index, 1);
    await saveList(list);

    // 移入回收站
    const trash = await getTrash();
    trash.unshift(deletedItem);
    await saveTrash(trash);

    sendResponse({ success: true, item: deletedItem });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteAll(sendResponse) {
  try {
    const list = await getList();
    const trash = await getTrash();
    const now = Date.now();
    list.forEach(item => { item.deletedAt = now; });
    trash.unshift(...list);
    await saveTrash(trash);
    await saveList([]);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRestoreItem(id, sendResponse) {
  try {
    const trash = await getTrash();
    const index = trash.findIndex(item => item.id === id);
    if (index === -1) {
      sendResponse({ success: false, error: 'Item not found in trash' });
      return;
    }
    const item = trash[index];
    delete item.deletedAt;
    trash.splice(index, 1);
    await saveTrash(trash);

    const list = await getList();
    list.unshift(item);
    await saveList(list);

    sendResponse({ success: true, item });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetTrash(sendResponse) {
  try {
    const trash = await getTrash();
    sendResponse({ success: true, list: trash });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePermanentDeleteItem(id, sendResponse) {
  try {
    const trash = await getTrash();
    const newTrash = trash.filter(item => item.id !== id);
    await saveTrash(newTrash);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePermanentDeleteAll(sendResponse) {
  try {
    await saveTrash([]);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetCurrentTab(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    sendResponse({ success: true, tab });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function cleanupExpiredTrash() {
  try {
    const trash = await getTrash();
    const cutoff = Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000;
    const filtered = trash.filter(item => (item.deletedAt || 0) > cutoff);
    if (filtered.length !== trash.length) {
      await saveTrash(filtered);
    }
  } catch (e) {
    // 静默处理
  }
}

function getList() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([LIST_KEY], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[LIST_KEY] || []);
      }
    });
  });
}

function saveList(list) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [LIST_KEY]: list }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

function getTrash() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([TRASH_KEY], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[TRASH_KEY] || []);
      }
    });
  });
}

function saveTrash(trash) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [TRASH_KEY]: trash }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
