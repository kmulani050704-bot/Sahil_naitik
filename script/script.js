/* =========================
   STATE & DATA INITIALIZATION
========================= */
const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024;
let currentPage = 'dashboard';
let currentFolder = null;
let currentSort = 'date-desc';
let currentFilter = 'all';

let files = JSON.parse(localStorage.getItem('cloudvault_files') || '[]');
let folders = JSON.parse(localStorage.getItem('cloudvault_folders') || '[]');
let shares = JSON.parse(localStorage.getItem('cloudvault_shares') || '[]');
let theme = localStorage.getItem('cloudvault_theme') || 'light';

if (!localStorage.getItem('cloudvault_initialized')) {
  folders = [];
  files = [];
  shares = [];
  localStorage.setItem('cloudvault_initialized', 'true');
  saveData();
}

/* =========================
   UTILITIES
========================= */
function saveData() {
  localStorage.setItem('cloudvault_files', JSON.stringify(files));
  localStorage.setItem('cloudvault_folders', JSON.stringify(folders));
  localStorage.setItem('cloudvault_shares', JSON.stringify(shares));
  updateStorage();
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + units[i];
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getExtension(name) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function fileIcon(file) {
  if (file.type === 'folder') return '📁';
  const ext = getExtension(file.name);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return '🎬';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return '🎵';
  if (['pdf'].includes(ext)) return '📕';
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
  if (['doc', 'docx', 'txt'].includes(ext)) return '📄';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  return '📎';
}

function toast(message, type = 'normal') {
  const container = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = 'toast';
  div.innerHTML = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ') + message;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* =========================
   AUTHENTICATION LOGIC
========================= */
document.getElementById('loginForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (username === 'admin' && password === 'admin123') {
    sessionStorage.setItem('cloudvault_logged', 'true');
    startApp();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', logout);

function logout() {
  sessionStorage.removeItem('cloudvault_logged');
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

function startApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('topUsername').textContent = 'Admin';
  document.getElementById('avatar').textContent = 'A';
  applyTheme();
  renderPage();
  updateStorage();
}

if (sessionStorage.getItem('cloudvault_logged') === 'true') {
  startApp();
}

/* =========================
   ROUTING & NAVIGATION
========================= */
document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
  item.addEventListener('click', () => navigateTo(item.dataset.page));
});

function navigateTo(page) {
  currentPage = page;
  currentFolder = null;
  activateNav(page);
  renderPage();
}

function activateNav(page) {
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
  const item = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (item) item.classList.add('active');
  document.getElementById('sidebar')?.classList.remove('open');
}

function renderPage() {
  const content = document.getElementById('content');
  content.classList.remove('fade-in');
  void content.offsetWidth;
  content.classList.add('fade-in');

  if (currentPage === 'dashboard') {
    content.innerHTML = dashboardHTML();
    bindDashboard();
  } else if (currentPage === 'files') {
    content.innerHTML = filesPageHTML();
  } else if (currentPage === 'shared') {
    content.innerHTML = sharedPageHTML();
  } else if (currentPage === 'trash') {
    content.innerHTML = trashPageHTML();
  } else if (currentPage === 'settings') {
    content.innerHTML = settingsPageHTML();
  }
}

/* =========================
   VIEWS (DASHBOARD)
========================= */
function dashboardHTML() {
  const activeFiles = files.filter((f) => !f.deleted);
  const used = activeFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  const images = activeFiles.filter((f) =>
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(getExtension(f.name)),
  ).length;
  const docs = activeFiles.filter((f) =>
    ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv'].includes(getExtension(f.name)),
  ).length;
  const recent = [...activeFiles].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return `
    <div class="page-header">
        <div>
            <h1>Dashboard</h1>
            <p>Manage your cloud files from one place.</p>
        </div>
        <div class="header-buttons">
            <button class="btn btn-light" onclick="createFolder()">+ New Folder</button>
            <button class="btn btn-primary" onclick="openUpload()">↑ Upload Files</button>
        </div>
    </div>
    <div class="stats">
        <div class="stat-card">
            <div class="stat-top"><span>Storage Used</span><div class="stat-icon">☁</div></div>
            <div class="stat-value">${formatBytes(used)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-top"><span>Total Files</span><div class="stat-icon">📁</div></div>
            <div class="stat-value">${activeFiles.length}</div>
        </div>
        <div class="stat-card">
            <div class="stat-top"><span>Images</span><div class="stat-icon">🖼</div></div>
            <div class="stat-value">${images}</div>
        </div>
        <div class="stat-card">
            <div class="stat-top"><span>Documents</span><div class="stat-icon">📄</div></div>
            <div class="stat-value">${docs}</div>
        </div>
    </div>
    <div class="upload-area" id="uploadArea">
        <div class="upload-icon">↑</div>
        <h3>Drag & Drop files here</h3>
        <p>or click to browse files from your device</p>
    </div>
    <div class="file-panel">
        <div class="file-toolbar">
            <strong>Recent Files</strong>
            <button class="btn btn-light" onclick="navigateTo('files')">View All</button>
        </div>
        ${recent.length ? fileTableHTML(recent) : emptyHTML('☁️', 'No files yet', 'Upload your first file to get started.')}
    </div>`;
}

function bindDashboard() {
  const area = document.getElementById('uploadArea');
  if (!area) return;
  area.onclick = openUpload;
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });
  area.addEventListener('dragleave', () => area.classList.remove('dragover'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    handleFiles(Array.from(e.dataTransfer.files));
  });
}

/* =========================
   VIEWS (FILES & FOLDERS)
========================= */
function filesPageHTML() {
  let visibleFiles = files.filter((f) => !f.deleted && f.parent === currentFolder);
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (search) visibleFiles = visibleFiles.filter((f) => f.name.toLowerCase().includes(search));

  if (currentFilter !== 'all') {
    visibleFiles = visibleFiles.filter((f) => {
      const ext = getExtension(f.name);
      if (currentFilter === 'image')
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
      if (currentFilter === 'video') return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
      if (currentFilter === 'document')
        return ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv'].includes(ext);
      if (currentFilter === 'archive') return ['zip', 'rar', '7z'].includes(ext);
      return true;
    });
  }

  visibleFiles.sort((a, b) => {
    if (currentSort === 'name') return a.name.localeCompare(b.name);
    if (currentSort === 'size') return (b.size || 0) - (a.size || 0);
    return new Date(b.date) - new Date(a.date);
  });

  const folderName = currentFolder
    ? folders.find((f) => f.id === currentFolder)?.name || 'Folder'
    : 'My Files';

  return `
    <div class="page-header">
        <div>
            <h1>${folderName}</h1>
            <p>Your personal cloud storage.</p>
        </div>
        <div class="header-buttons">
            <button class="btn btn-light" onclick="createFolder()">+ New Folder</button>
            <button class="btn btn-primary" onclick="openUpload()">↑ Upload</button>
        </div>
    </div>
    <div class="file-panel">
        <div class="file-toolbar">
            <div class="breadcrumb">
                <span onclick="goRoot()">☁ My Files</span>
                ${currentFolder ? ' / ' + folderName : ''}
            </div>
            <div class="toolbar-right">
                <select id="filterSelect" onchange="currentFilter=this.value; renderPage();">
                    <option value="all">All Files</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="document">Documents</option>
                    <option value="archive">Archives</option>
                </select>
                <select onchange="currentSort=this.value; renderPage();">
                    <option value="date-desc">Latest</option>
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                </select>
            </div>
        </div>
        ${visibleFiles.length ? fileTableHTML(visibleFiles) : emptyHTML('📁', 'This folder is empty', 'Upload files or create a new folder.')}
    </div>`;
}

function fileTableHTML(items) {
  return `
    <table class="file-table">
        <thead>
            <tr><th>Name</th><th>Type</th><th>Size</th><th>Modified</th><th>Actions</th></tr>
        </thead>
        <tbody>
        ${items
          .map((file) => {
            const isFolder = file.type === 'folder';
            return `
            <tr>
                <td>
                    <div class="file-name" ${isFolder ? `onclick="openFolder('${file.id}')"` : ''}>
                        <div class="file-icon">${fileIcon(file)}</div>
                        <span>${escapeHTML(file.name)}</span>
                    </div>
                </td>
                <td>${isFolder ? 'Folder' : getExtension(file.name).toUpperCase() || 'File'}</td>
                <td>${isFolder ? '-' : formatBytes(file.size)}</td>
                <td>${formatDate(file.date)}</td>
                <td>
                    <div class="file-actions">
                        ${!isFolder ? `<button class="small-btn" title="Download" onclick="downloadFile('${file.id}')">↓</button><button class="small-btn" title="Share" onclick="shareFile('${file.id}')">🔗</button>` : ''}
                        <button class="small-btn" title="Rename" onclick="renameItem('${file.id}')">✎</button>
                        <button class="small-btn" title="Delete" onclick="moveToTrash('${file.id}')">🗑</button>
                    </div>
                </td>
            </tr>`;
          })
          .join('')}
        </tbody>
    </table>`;
}

function emptyHTML(icon, title, text) {
  return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p></div>`;
}

/* =========================
   FILE OPERATIONS
========================= */
function openUpload() {
  document.getElementById('fileInput').click();
}

document.getElementById('fileInput')?.addEventListener('change', (e) => {
  handleFiles(Array.from(e.target.files));
  e.target.value = '';
});

function handleFiles(selectedFiles) {
  if (!selectedFiles.length) return;
  let total = files.filter((f) => !f.deleted).reduce((sum, f) => sum + (f.size || 0), 0);

  selectedFiles.forEach((file) => {
    if (total + file.size > STORAGE_LIMIT) {
      toast('Storage limit exceeded.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      files.push({
        id: Date.now() + Math.random().toString(36).substring(2),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        date: new Date().toISOString(),
        parent: currentFolder,
        deleted: false,
        data: e.target.result,
      });
      saveData();
      renderPage();
      toast(file.name + ' uploaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
    total += file.size;
  });
}

function createFolder() {
  openModal(`
        <h2>Create Folder</h2>
        <div class="form-group"><label>Folder Name</label><input id="folderName" placeholder="My Documents" autofocus></div>
        <div class="modal-actions"><button class="btn btn-light" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveFolder()">Create</button></div>
    `);
}

function saveFolder() {
  const name = document.getElementById('folderName').value.trim();
  if (!name) {
    toast('Enter a folder name.', 'error');
    return;
  }
  folders.push({
    id: Date.now() + Math.random().toString(36),
    name,
    parent: currentFolder,
    date: new Date().toISOString(),
  });
  closeModal();
  saveData();
  renderPage();
  toast('Folder created.', 'success');
}

function openFolder(id) {
  currentFolder = id;
  currentPage = 'files';
  activateNav('files');
  renderPage();
}
function goRoot() {
  currentFolder = null;
  renderPage();
}

function renameItem(id) {
  const item = files.find((f) => f.id === id) || folders.find((f) => f.id === id);
  if (!item) return;
  openModal(`
        <h2>Rename</h2>
        <div class="form-group"><label>New Name</label><input id="renameInput" value="${escapeHTML(item.name)}"></div>
        <div class="modal-actions"><button class="btn btn-light" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveRename('${id}')">Save</button></div>
    `);
}

function saveRename(id) {
  const name = document.getElementById('renameInput').value.trim();
  if (!name) return;
  const file = files.find((f) => f.id === id);
  const folder = folders.find((f) => f.id === id);
  if (file) file.name = name;
  if (folder) folder.name = name;
  closeModal();
  saveData();
  renderPage();
  toast('Renamed successfully.', 'success');
}

function downloadFile(id) {
  const file = files.find((f) => f.id === id);
  if (!file || !file.data) {
    toast('File data is unavailable.', 'error');
    return;
  }
  const a = document.createElement('a');
  a.href = file.data;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('Download started.', 'success');
}

/* =========================
   TRASH MANAGEMENT
========================= */
function moveToTrash(id) {
  const file = files.find((f) => f.id === id);
  const folder = folders.find((f) => f.id === id);
  if (file) {
    if (!confirm('Move this file to Trash?')) return;
    file.deleted = true;
  } else if (folder) {
    if (!confirm('Move this folder to Trash?')) return;
    folder.deleted = true;
  }
  saveData();
  renderPage();
  toast('Moved to Trash.', 'success');
}

function trashPageHTML() {
  const deleted = files.filter((f) => f.deleted);
  return `
    <div class="page-header">
        <div><h1>Trash</h1><p>Restore or permanently delete your files.</p></div>
        <button class="btn btn-danger" onclick="emptyTrash()">Empty Trash</button>
    </div>
    <div class="file-panel">
        ${
          deleted.length
            ? `
        <table class="file-table">
            <thead><tr><th>Name</th><th>Size</th><th>Deleted</th><th>Actions</th></tr></thead>
            <tbody>${deleted
              .map(
                (f) => `
                <tr>
                    <td><div class="file-name"><div class="file-icon">${fileIcon(f)}</div>${escapeHTML(f.name)}</div></td>
                    <td>${formatBytes(f.size)}</td><td>${formatDate(f.date)}</td>
                    <td><button class="small-btn" onclick="restoreFile('${f.id}')">♻ Restore</button><button class="small-btn" onclick="permanentDelete('${f.id}')">✕ Delete</button></td>
                </tr>`,
              )
              .join('')}
            </tbody>
        </table>`
            : emptyHTML('🗑️', 'Trash is empty', 'Deleted files will appear here.')
        }
    </div>`;
}

function restoreFile(id) {
  const file = files.find((f) => f.id === id);
  if (file) file.deleted = false;
  saveData();
  renderPage();
  toast('File restored.', 'success');
}
function permanentDelete(id) {
  if (!confirm('Permanently delete this file?')) return;
  files = files.filter((f) => f.id !== id);
  saveData();
  renderPage();
  toast('File permanently deleted.', 'success');
}
function emptyTrash() {
  if (!files.some((f) => f.deleted)) {
    toast('Trash is already empty.');
    return;
  }
  if (!confirm('Permanently delete all files in Trash?')) return;
  files = files.filter((f) => !f.deleted);
  saveData();
  renderPage();
  toast('Trash emptied.', 'success');
}

/* =========================
   SHARING
========================= */
function shareFile(id) {
  const file = files.find((f) => f.id === id);
  if (!file) return;
  let existing = shares.find((s) => s.fileId === id);
  if (!existing) {
    existing = {
      id: Date.now().toString(36),
      fileId: id,
      token: Math.random().toString(36).substring(2),
      permission: 'view',
      expires: '',
    };
    shares.push(existing);
    saveData();
  }
  const url = location.href.split('#')[0] + '#share=' + existing.token;
  openModal(`
        <h2>Share File</h2>
        <p style="color:var(--muted);margin-bottom:15px">Anyone with this link can access the shared file.</p>
        <div class="form-group">
            <label>Permission</label>
            <select id="sharePermission" onchange="updateSharePermission('${existing.id}')">
                <option value="view" ${existing.permission === 'view' ? 'selected' : ''}>View Only</option>
                <option value="download" ${existing.permission === 'download' ? 'selected' : ''}>View & Download</option>
            </select>
        </div>
        <div class="share-url"><input value="${url}" readonly id="shareLink"><button class="btn btn-primary" onclick="copyShareLink()">Copy</button></div>
        <div class="modal-actions"><button class="btn btn-light" onclick="closeModal()">Close</button><button class="btn btn-danger" onclick="revokeShare('${existing.id}')">Revoke</button></div>
    `);
}

function updateSharePermission(id) {
  const share = shares.find((s) => s.id === id);
  if (share) share.permission = document.getElementById('sharePermission').value;
  saveData();
}
function copyShareLink() {
  navigator.clipboard
    .writeText(document.getElementById('shareLink').value)
    .then(() => toast('Share link copied.', 'success'));
}
function revokeShare(id) {
  shares = shares.filter((s) => s.id !== id);
  saveData();
  closeModal();
  toast('Share link revoked.', 'success');
}

function sharedPageHTML() {
  const shared = shares
    .map((s) => {
      const file = files.find((f) => f.id === s.fileId);
      return file ? { ...s, file } : null;
    })
    .filter(Boolean);
  return `
    <div class="page-header"><div><h1>Shared Files</h1><p>Files that have share links.</p></div></div>
    <div class="file-panel">${shared.length ? fileTableHTML(shared.map((s) => s.file)) : emptyHTML('🔗', 'No shared files', 'Create a share link for any file.')}</div>`;
}

/* =========================
   SETTINGS & MISC
========================= */
function settingsPageHTML() {
  return `
    <div class="page-header"><div><h1>Settings</h1><p>Manage your CloudVault account.</p></div></div>
    <div class="settings-card"><h3>Profile</h3><p>Your account information.</p>
        <div class="profile-row"><div class="profile-avatar">A</div><div><div class="form-group"><label>Username</label><input value="admin" disabled></div><div class="form-group"><label>Account Type</label><input value="Personal Account" disabled></div></div></div>
    </div>
    <div class="settings-card"><h3>Security</h3><p>Demo authentication settings.</p><button class="btn btn-light" onclick="changePassword()">Change Password</button></div>
    <div class="settings-card"><h3>Appearance</h3><p>Customize your dashboard appearance.</p><button class="btn btn-light" onclick="toggleTheme()">Toggle Light / Dark Mode</button></div>
    <div class="settings-card"><h3>Storage</h3><p>Browser-based demo storage limit: 5 GB.</p><div class="progress"><div id="settingsProgress" style="width:0%"></div></div></div>`;
}

function changePassword() {
  openModal(`
        <h2>Change Password</h2>
        <div class="form-group"><label>Current Password</label><input type="password" id="oldPassword"></div>
        <div class="form-group"><label>New Password</label><input type="password" id="newPassword"></div>
        <div class="modal-actions"><button class="btn btn-light" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="savePassword()">Update Password</button></div>
    `);
}

function savePassword() {
  if (document.getElementById('oldPassword').value !== 'admin123') {
    toast('Current password is incorrect.', 'error');
    return;
  }
  if (document.getElementById('newPassword').value.length < 6) {
    toast('Password must be at least 6 characters.', 'error');
    return;
  }
  toast('Password changed for this demo session.', 'success');
  closeModal();
}

function updateStorage() {
  const used = files.filter((f) => !f.deleted).reduce((sum, f) => sum + (f.size || 0), 0);
  const percentage = Math.min((used / STORAGE_LIMIT) * 100, 100);
  const progress = document.getElementById('storageProgress');
  if (progress) progress.style.width = percentage + '%';
  const text = document.getElementById('storageText');
  if (text) text.textContent = `${formatBytes(used)} of 5 GB used`;
  const settingsProgress = document.getElementById('settingsProgress');
  if (settingsProgress) settingsProgress.style.width = percentage + '%';
}

function openModal(content) {
  document.getElementById('modal').innerHTML = content;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}
document.getElementById('modalOverlay')?.addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

document.getElementById('searchInput')?.addEventListener('input', function () {
  if (currentPage === 'files') renderPage();
});

function applyTheme() {
  document.body.classList.toggle('dark', theme === 'dark');
}
function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('cloudvault_theme', theme);
  applyTheme();
  if (currentPage === 'settings') renderPage();
}
document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);

document
  .getElementById('menuBtn')
  ?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
