// sidepanel.js - 侧面板逻辑

import { sendMessage, getCurrentTab, formatDate, truncateUrl } from './shared.js';

let undoTimeout = null;
let undoItem = null;
let showingTrash = false;

document.addEventListener('DOMContentLoaded', async () => {
  const addBtn = document.getElementById('addCurrentPage');
  const listContainer = document.getElementById('listContainer');
  const trashContainer = document.getElementById('trashContainer');
  const emptyState = document.getElementById('emptyState');
  const emptyText = document.getElementById('emptyText');
  const emptyHint = document.getElementById('emptyHint');
  const loadingState = document.getElementById('loadingState');
  const listSection = document.getElementById('listSection');
  const trashSection = document.getElementById('trashSection');
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const emptyTrashBtn = document.getElementById('emptyTrashBtn');
  const toggleTrashBtn = document.getElementById('toggleTrashBtn');
  const panelTitle = document.getElementById('panelTitle');
  const listTitle = document.getElementById('listTitle');
  const undoBar = document.getElementById('undoBar');
  const undoBtn = document.getElementById('undoBtn');

  await loadList();

  addBtn.addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      if (!tab) {
        showToast('无法获取当前标签页');
        return;
      }
      const result = await sendMessage('ADD_PAGE', {
        title: tab.title,
        url: tab.url
      });
      if (result.success) {
        showToast('✅ 已添加到待办');
        if (showingTrash) toggleView();
        await loadList();
      } else {
        showToast('❌ 添加失败: ' + result.error);
      }
    } catch (error) {
      showToast('❌ 添加失败: ' + error.message);
    }
  });

  toggleTrashBtn.addEventListener('click', () => {
    toggleView();
  });

  deleteAllBtn.addEventListener('click', async () => {
    if (!confirm('确定要清空所有待办吗？')) return;
    const result = await sendMessage('DELETE_ALL');
    if (result.success) {
      showToast('已清空');
      await loadList();
    }
  });

  emptyTrashBtn.addEventListener('click', async () => {
    if (!confirm('确定要永久清空回收站吗？此操作不可恢复。')) return;
    const result = await sendMessage('PERMANENT_DELETE_ALL');
    if (result.success) {
      showToast('回收站已清空');
      await loadTrash();
    }
  });

  undoBtn.addEventListener('click', async () => {
    if (!undoItem) return;
    clearUndo();
    const result = await sendMessage('RESTORE_ITEM', { id: undoItem.id });
    if (result.success) {
      showToast('✅ 已恢复');
      if (showingTrash) await loadTrash();
      else await loadList();
    } else {
      showToast('❌ 恢复失败');
    }
    undoItem = null;
  });

  async function toggleView() {
    showingTrash = !showingTrash;
    if (showingTrash) {
      panelTitle.textContent = '🗑️ 回收站';
      listSection.style.display = 'none';
      toggleTrashBtn.textContent = '📋';
      toggleTrashBtn.title = '返回列表';
      await loadTrash();
    } else {
      panelTitle.textContent = '📖 Read Later';
      trashSection.style.display = 'none';
      toggleTrashBtn.textContent = '🗑️';
      toggleTrashBtn.title = '回收站';
      await loadList();
    }
  }

  async function loadList() {
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    listSection.style.display = 'none';
    trashSection.style.display = 'none';

    const result = await sendMessage('GET_LIST');
    loadingState.style.display = 'none';

    if (!result.success) {
      showToast('加载失败: ' + result.error);
      return;
    }

    const list = result.list;

    if (list.length === 0) {
      emptyText.textContent = '暂无待办页面';
      emptyHint.textContent = '点击上方 ➕ 添加当前页面';
      emptyState.style.display = 'block';
      listSection.style.display = 'none';
      return;
    }

    listSection.style.display = 'block';
    listTitle.textContent = '待办列表';
    renderList(list, listContainer, false);
  }

  async function loadTrash() {
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    listSection.style.display = 'none';
    trashSection.style.display = 'none';

    const result = await sendMessage('GET_TRASH');
    loadingState.style.display = 'none';

    if (!result.success) {
      showToast('加载失败: ' + result.error);
      return;
    }

    const list = result.list;

    if (list.length === 0) {
      emptyText.textContent = '回收站为空';
      emptyHint.textContent = '删除的条目会出现在这里，30天后自动清除';
      emptyState.style.display = 'block';
      trashSection.style.display = 'none';
      return;
    }

    trashSection.style.display = 'block';
    renderTrashList(list);
  }

  function renderList(list, container, isTrash) {
    container.innerHTML = '';
    list.forEach(item => {
      const card = createCard(item, isTrash);
      container.appendChild(card);
    });
  }

  function renderTrashList(list) {
    trashContainer.innerHTML = '';
    list.forEach(item => {
      const card = createTrashCard(item);
      trashContainer.appendChild(card);
    });
  }

  function createCard(item) {
    const card = document.createElement('div');
    card.className = 'card card-sidepanel';
    card.dataset.id = item.id;

    const row1 = document.createElement('div');
    row1.className = 'card-row1';

    const titleEl = document.createElement('div');
    titleEl.className = 'card-title';
    titleEl.textContent = item.title;
    titleEl.addEventListener('dblclick', () => startInlineEdit(titleEl, item));

    const actionsEl = document.createElement('div');
    actionsEl.className = 'card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-sm btn-edit';
    editBtn.textContent = '✏️';
    editBtn.title = '编辑';
    editBtn.addEventListener('click', () => showEditDialog(item));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-sm btn-delete';
    deleteBtn.textContent = '🗑️';
    deleteBtn.title = '删除';
    deleteBtn.addEventListener('click', async () => {
      const result = await sendMessage('DELETE_ITEM', { id: item.id });
      if (result.success) {
        showUndoBar(item);
        await loadList();
      }
    });

    actionsEl.appendChild(editBtn);
    actionsEl.appendChild(deleteBtn);
    row1.appendChild(titleEl);
    row1.appendChild(actionsEl);

    const urlEl = document.createElement('div');
    urlEl.className = 'card-url';
    urlEl.textContent = truncateUrl(item.url);
    urlEl.addEventListener('click', () => {
      chrome.tabs.create({ url: item.url });
    });

    card.appendChild(row1);
    card.appendChild(urlEl);

    return card;
  }

  function createTrashCard(item) {
    const card = document.createElement('div');
    card.className = 'card card-sidepanel';
    card.dataset.id = item.id;

    const row1 = document.createElement('div');
    row1.className = 'card-row1';

    const titleEl = document.createElement('div');
    titleEl.className = 'card-title';
    titleEl.textContent = item.title;
    titleEl.addEventListener('dblclick', () => startInlineEdit(titleEl, item));

    const actionsEl = document.createElement('div');
    actionsEl.className = 'card-actions';

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn-sm btn-restore';
    restoreBtn.textContent = '↩️ 恢复';
    restoreBtn.title = '恢复';
    restoreBtn.addEventListener('click', async () => {
      const result = await sendMessage('RESTORE_ITEM', { id: item.id });
      if (result.success) {
        showToast('✅ 已恢复');
        await loadTrash();
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-sm btn-delete';
    deleteBtn.textContent = '🗑️';
    deleteBtn.title = '永久删除';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`永久删除「${item.title}」？`)) return;
      const result = await sendMessage('PERMANENT_DELETE_ITEM', { id: item.id });
      if (result.success) {
        showToast('已永久删除');
        await loadTrash();
      }
    });

    actionsEl.appendChild(restoreBtn);
    actionsEl.appendChild(deleteBtn);
    row1.appendChild(titleEl);
    row1.appendChild(actionsEl);

    const urlEl = document.createElement('div');
    urlEl.className = 'card-url';
    urlEl.textContent = truncateUrl(item.url);

    const metaEl = document.createElement('div');
    metaEl.className = 'card-meta';
    const deletedDate = new Date(item.deletedAt);
    const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - item.deletedAt) / 86400000));
    metaEl.textContent = `删除于 ${formatDate(item.deletedAt)} · ${daysLeft}天后自动清除`;

    card.appendChild(row1);
    card.appendChild(urlEl);
    card.appendChild(metaEl);

    return card;
  }

  function showUndoBar(item) {
    clearUndo();
    undoItem = item;
    undoBar.classList.add('show');

    const progress = document.getElementById('undoProgress');
    progress.style.width = '100%';
    progress.style.transition = 'none';
    progress.offsetHeight;
    progress.style.transition = 'width 10s linear';
    progress.style.width = '0%';

    undoTimeout = setTimeout(() => {
      undoBar.classList.remove('show');
      undoItem = null;
      undoTimeout = null;
    }, 10000);
  }

  function clearUndo() {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      undoTimeout = null;
    }
    undoBar.classList.remove('show');
  }

  function startInlineEdit(titleEl, item) {
    const input = document.createElement('input');
    input.className = 'inline-edit-input';
    input.type = 'text';
    input.value = item.title;
    input.setAttribute('autofocus', '');

    const finish = async (save) => {
      if (save) {
        const val = input.value.trim();
        if (val && val !== item.title) {
          const result = await sendMessage('UPDATE_ITEM', {
            id: item.id,
            title: val,
            url: item.url,
            notes: item.notes || ''
          });
          if (result.success) {
            if (showingTrash) await loadTrash();
            else await loadList();
            return;
          }
        }
      }
      titleEl.textContent = item.title;
      titleEl.style.display = '';
      input.remove();
    };

    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });

    titleEl.style.display = 'none';
    titleEl.parentNode.insertBefore(input, titleEl.nextSibling);
    setTimeout(() => input.focus(), 10);
  }

  function showEditDialog(item) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    dialog.innerHTML = `
      <h3>编辑待办</h3>
      <label>
        标题
        <input type="text" id="editTitle" value="${escapeHtml(item.title)}" />
      </label>
      <label>
        URL
        <input type="text" id="editUrl" value="${escapeHtml(item.url)}" />
      </label>
      <label>
        备注
        <textarea id="editNotes" rows="3">${escapeHtml(item.notes || '')}</textarea>
      </label>
      <div class="dialog-actions">
        <button id="cancelEdit" class="btn-secondary">取消</button>
        <button id="saveEdit" class="btn-primary">保存</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    document.getElementById('cancelEdit').addEventListener('click', () => overlay.remove());
    document.getElementById('saveEdit').addEventListener('click', async () => {
      const title = document.getElementById('editTitle').value.trim();
      const url = document.getElementById('editUrl').value.trim();
      const notes = document.getElementById('editNotes').value.trim();

      if (!title) {
        showToast('标题不能为空');
        return;
      }

      const result = await sendMessage('UPDATE_ITEM', {
        id: item.id,
        title,
        url,
        notes
      });

      if (result.success) {
        showToast('✅ 已更新');
        overlay.remove();
        await loadList();
      } else {
        showToast('❌ 更新失败: ' + result.error);
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }, 10);
}
