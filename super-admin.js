let adminToken = localStorage.getItem('admin_token') || null;
let currentAdmin = null;
try { currentAdmin = JSON.parse(localStorage.getItem('admin_user')); } catch(e) {}
let currentLang = 'ar';

const API_BASE = (function() {
  var m = document.querySelector('meta[name="api-url"]');
  var metaUrl = m ? m.getAttribute('content') : '';
  if (metaUrl) return metaUrl;
  var stored = localStorage.getItem('syria_api_url');
  if (stored) return stored;
  return '';
})();
function api(path) { return API_BASE + path; }

if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register(API_BASE + '/sw.js').catch(() => {});
}

const LOC = {
  en: {
    dashboard: 'Dashboard', roles: 'Roles', employees: 'Employees',
    currencies: 'Currencies', security: 'Security', systemHealth: 'System Health',
    finance: 'Finance', payments: 'Payments', settings: 'Settings',
    logs: 'Activity Logs', backup: 'Backup', users: 'Users',
    signOut: 'Sign Out', add: 'Add New', edit: 'Edit', del: 'Delete',
    save: 'Save', cancel: 'Cancel', confirm: 'Confirm', search: 'Search',
    filter: 'Filter', all: 'All', new: 'New', pending: 'Pending',
    confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled',
    active: 'Active', inactive: 'Inactive', actions: 'Actions', status: 'Status',
    created: 'Created', total: 'Total', revenue: 'Revenue',
    welcome: 'Welcome to the System Control Center',
    email: 'Email', phone: 'Phone', country: 'Country', role: 'Role',
    id: 'ID', name: 'Name', city: 'City', rating: 'Rating', price: 'Price',
    ref: 'Ref', customer: 'Customer', type: 'Type', date: 'Date',
    nameAr: 'Name (Arabic)', cityAr: 'City (Arabic)',
    loading: 'Loading...', back: 'Back', saved: 'Saved', deleted: 'Deleted',
    updated: 'Updated', settingsSaved: 'Settings saved',
    backupCreated: 'Backup created:', page: 'Page', view: 'View',
    viewProfile: 'View Profile', disableUser: 'Disable', enableUser: 'Enable',
    noUsers: 'No users found',
  },
  ar: {
    dashboard: 'لوحة التحكم', roles: 'الأدوار', employees: 'الموظفين',
    currencies: 'العملات', security: 'الأمان', systemHealth: 'صحة النظام',
    finance: 'المالية', payments: 'المدفوعات', settings: 'الإعدادات',
    logs: 'سجل النشاطات', backup: 'نسخ احتياطي', users: 'المستخدمين',
    signOut: 'تسجيل خروج', add: 'إضافة', edit: 'تعديل', del: 'حذف',
    save: 'حفظ', cancel: 'إلغاء', confirm: 'تأكيد', search: 'بحث',
    filter: 'فلتر', all: 'الكل', new: 'جديد', pending: 'معلق',
    confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي',
    active: 'نشط', inactive: 'غير نشط', actions: 'إجراءات', status: 'الحالة',
    created: 'تاريخ', total: 'الإجمالي', revenue: 'الإيرادات',
    welcome: 'مرحباً بك في مركز التحكم المركزي',
    email: 'البريد الإلكتروني', phone: 'الهاتف', country: 'الدولة', role: 'الدور',
    id: 'الرقم', name: 'الاسم', city: 'المدينة', rating: 'التقييم', price: 'السعر',
    ref: 'المرجع', customer: 'العميل', type: 'النوع', date: 'التاريخ',
    nameAr: 'الاسم (عربي)', cityAr: 'المدينة (عربي)',
    loading: 'جار التحميل...', back: 'رجوع', saved: 'تم الحفظ', deleted: 'تم الحذف',
    updated: 'تم التحديث', settingsSaved: 'تم حفظ الإعدادات',
    backupCreated: 'تم إنشاء النسخة الاحتياطية:', page: 'صفحة', view: 'عرض',
    viewProfile: 'عرض الملف', disableUser: 'تعطيل', enableUser: 'تفعيل',
    noUsers: 'لا يوجد مستخدمين',
  }
};

function tx(key) { return LOC[currentLang]?.[key] || LOC['en'][key] || key; }

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(api('/api/admin/upload'), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

function createUploadBtn(inputId, callback) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'admin-btn admin-btn--sm';
  btn.textContent = currentLang === 'ar' ? '📁 رفع صورة' : '📁 Upload Image';
  btn.onclick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        btn.textContent = currentLang === 'ar' ? 'جاري الرفع...' : 'Uploading...';
        btn.disabled = true;
        const result = await uploadFile(file);
        if (inputId) document.getElementById(inputId).value = result.url;
        btn.textContent = currentLang === 'ar' ? '✅ تم الرفع' : '✅ Uploaded';
        setTimeout(() => {
          btn.textContent = currentLang === 'ar' ? '📁 رفع صورة' : '📁 Upload Image';
          btn.disabled = false;
        }, 2000);
        if (callback) callback(result.url);
      } catch (err) {
        btn.textContent = currentLang === 'ar' ? '❌ فشل' : '❌ Failed';
        showMsg(err.message, true);
        btn.disabled = false;
      }
    };
    fileInput.click();
  };
  return btn;
}

function initUploadButtons() {
  document.querySelectorAll('.img-upload').forEach(input => {
    if (input.nextElementSibling?.classList?.contains('upload-btn-container')) return;
    const container = document.createElement('div');
    container.className = 'upload-btn-container';
    container.style.marginTop = '6px';
    const btn = createUploadBtn(input.id || null, (url) => { input.value = url; });
    container.appendChild(btn);
    input.parentNode.appendChild(container);
  });
}

function toggleAdminLang() {
  currentLang = currentLang === 'en' ? 'ar' : 'en';
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', currentLang);
  if (adminToken) renderSuperAdminDashboard(); else renderSuperAdminLogin();
}

function toggleAdminPass() {
  const inp = document.getElementById('admin-password');
  const icon = document.getElementById('admin-pass-toggle');
  if (!inp || !icon) return;
  if (inp.type === 'password') { inp.type = 'text'; icon.textContent = '🙈'; }
  else { inp.type = 'password'; icon.textContent = '👁️'; }
}

async function adminRequest(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(api('/api/admin' + endpoint), opts);
  if (res.status === 401 || res.status === 403) {
    adminToken = null; localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user');
    renderSuperAdminLogin(); return null;
  }
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Request failed'); }
  return res.json();
}

function showMsg(msg, isError = false) {
  let el = document.getElementById('admin-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'admin-toast';
    el.style.cssText = 'display:none;position:fixed;bottom:20px;right:20px;padding:14px 28px;color:#FFF;border-radius:8px;z-index:9999;font-weight:600;font-size:0.95rem;box-shadow:0 8px 24px rgba(0,0,0,0.3);';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background = isError ? '#EF4444' : '#10B981';
  el.style.borderLeft = isError ? 'none' : '4px solid #C9A96E';
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function renderSuperAdminLogin() {
  document.querySelector('.header')?.style.removeProperty('display');
  document.getElementById('app').innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;min-height:90vh;padding:24px;">
      <div style="background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-color);padding:40px;width:100%;max-width:440px;position:relative;">
        <button onclick="toggleAdminLang()" style="position:absolute;top:16px;right:16px;padding:6px 14px;border:1px solid var(--border-color);background:var(--bg);color:var(--text-main);border-radius:6px;cursor:pointer;font-size:0.8rem;">🌐 ${currentLang === 'en' ? 'عربي' : 'English'}</button>
        <h1 style="text-align:center;font-family:var(--font-display);margin-bottom:8px;color:var(--gold-primary);">✦ ${currentLang === 'ar' ? 'النظام المركزي' : 'System Control'}</h1>
        <p style="text-align:center;color:var(--text-muted);margin-bottom:24px;">${currentLang === 'ar' ? 'بوابة الدخول الآمنة للنظام المركزي' : 'Secure Central Administration Portal'}</p>
        <form id="admin-login-form" onsubmit="handleSuperAdminLogin(event)">
          <div style="margin-bottom:20px;"><label style="display:block;font-size:0.82rem;font-weight:600;margin-bottom:6px;color:var(--text-main);">${currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
            <input type="email" style="width:100%;padding:10px 14px;border:1px solid var(--border-color);background:var(--bg);color:var(--text-main);border-radius:6px;font-size:0.9rem;" name="email" placeholder="${currentLang === 'ar' ? 'admin@syria-travel.com' : 'admin@syria-travel.com'}" required></div>
          <div style="margin-bottom:20px;"><label style="display:block;font-size:0.82rem;font-weight:600;margin-bottom:6px;color:var(--text-main);">${currentLang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
            <div style="position:relative;"><input type="password" style="width:100%;padding:10px 14px;border:1px solid var(--border-color);background:var(--bg);color:var(--text-main);border-radius:6px;font-size:0.9rem;padding-right:40px;" name="password" id="admin-password" required><span onclick="toggleAdminPass()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:1.1rem;user-select:none;" id="admin-pass-toggle">👁️</span></div>
            <label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:0.78rem;color:var(--text-muted);cursor:pointer;"><input type="checkbox" onchange="document.getElementById('admin-password').type=this.checked?'text':'password';this.nextElementSibling.textContent=this.checked?'${currentLang === 'ar' ? 'إخفاء' : 'Hide'}':'${currentLang === 'ar' ? 'إظهار' : 'Show'}';" style="accent-color:var(--gold-primary);"> <span>${currentLang === 'ar' ? 'إظهار' : 'Show'}</span></label></div>
          <button type="submit" style="width:100%;padding:14px;background:linear-gradient(135deg,var(--gold-primary),var(--gold-dark));color:var(--luxury-navy);border:none;border-radius:6px;font-weight:600;font-size:1rem;cursor:pointer;">${currentLang === 'ar' ? 'تسجيل دخول' : 'Authenticate'}</button>
        </form>
      </div>
    </div>`;
}

async function handleSuperAdminLogin(e) {
  e.preventDefault();
  const f = e.target;
  try {
    const res = await fetch(api('/api/admin/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.email.value, password: f.password.value }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    adminToken = data.token;
    currentAdmin = data.user;
    localStorage.setItem('admin_token', adminToken);
    localStorage.setItem('admin_user', JSON.stringify(currentAdmin));
    showMsg(currentLang === 'ar' ? 'تم الدخول' : 'Access granted');
    renderSuperAdminDashboard();
  } catch (err) { showMsg(err.message, true); }
}

function initAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
}
document.addEventListener('click', initAudioCtx, { once: true, passive: true });
document.addEventListener('touchstart', initAudioCtx, { once: true, passive: true });
document.addEventListener('mousedown', initAudioCtx, { once: true, passive: true });
document.addEventListener('keydown', initAudioCtx, { once: true, passive: true });
document.addEventListener('click', (e) => {
  const panel = document.getElementById('notif-panel');
  const bell = document.getElementById('notif-bell');
  if (panel && panel.style.display === 'block' && !panel.contains(e.target) && bell && !bell.contains(e.target)) {
    panel.style.display = 'none';
  }
});

// ==================== SOCKET.IO ====================
let _adminSocket = null;
let _socketConnected = false;
let _notifInterval2 = null;
let _lastSocketNotifId = 0;
let _notifList = [];
let _lastStats = {};

function connectSocket() {
  if (_adminSocket) { _adminSocket.disconnect(); _adminSocket = null; }
  if (!adminToken) return;
  _adminSocket = io(API_BASE || undefined, { auth: { token: adminToken }, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 2000 });
  _adminSocket.on('connect', () => {
    _socketConnected = true;
    if (_notifInterval2) { clearInterval(_notifInterval2); _notifInterval2 = null; }
  });
  _adminSocket.on('notification', (n) => {
    _lastSocketNotifId = n.id || 0;
    playNotifSound();
    showNotifToast(n.type, n.title, n.message);
    _notifList.unshift(n);
    updateNotifBadge();
    loadSuperAdminStats();
    sendBackgroundNotif(n.title, n.message);
  });
  _adminSocket.on('notifications:missed', (list) => {
    if (list && list.length) {
      for (const n of list) {
        _notifList.unshift(n);
        if (n.id > _lastSocketNotifId) _lastSocketNotifId = n.id;
      }
      playNotifSound();
      showMsg(currentLang === 'ar' ? `🔔 ${list.length} إشعار جديد أثناء الغياب` : `🔔 ${list.length} missed notifications`);
      updateNotifBadge();
      loadSuperAdminStats();
    }
  });
  _adminSocket.on('notifications:count', (cnt) => {
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = cnt; badge.style.display = cnt > 0 ? 'inline' : 'none'; }
  });
  _adminSocket.on('stats:update', () => { loadSuperAdminStats(); });
  _adminSocket.on('disconnect', () => {
    _socketConnected = false;
    startNotifFallback();
  });
  _adminSocket.on('connect_error', () => {
    _socketConnected = false;
    startNotifFallback();
  });
}

function disconnectSocket() {
  if (_adminSocket) { _adminSocket.disconnect(); _adminSocket = null; }
  _socketConnected = false;
  if (_notifInterval2) { clearInterval(_notifInterval2); _notifInterval2 = null; }
}

function startNotifFallback() {
  if (_notifInterval2) return;
  _notifInterval2 = setInterval(async () => {
    try {
      const res = await adminRequest('GET', '/notifications?since=' + _lastSocketNotifId);
      if (!res) return;
      if (res.notifications && res.notifications.length) {
        for (const n of res.notifications) {
          playNotifSound();
          showNotifToast(n.type, n.title, n.message);
          _notifList.unshift(n);
          if (n.id > _lastSocketNotifId) _lastSocketNotifId = n.id;
        }
        updateNotifBadge();
        loadSuperAdminStats();
      }
      if (res.unread_count !== undefined) {
        const badge = document.getElementById('notif-badge');
        if (badge) { badge.textContent = res.unread_count; badge.style.display = res.unread_count > 0 ? 'inline' : 'none'; }
      }
    } catch (e) {}
  }, 10000);
}

function sendBackgroundNotif(title, message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller && document.visibilityState === 'hidden') {
    navigator.serviceWorker.controller.postMessage({
      type: 'show-notification',
      title: title || 'Syria Travel Super Admin',
      message: message || '',
      tag: 'super-admin-notif-' + Date.now()
    });
  }
}

function showNotifToast(type, title, message) {
  const t = {
    booking: currentLang === 'ar' ? '📋 حجز' : '📋 Booking',
    contact: currentLang === 'ar' ? '✉️ استفسار' : '✉️ Inquiry',
    review: currentLang === 'ar' ? '⭐ تقييم' : '⭐ Review',
    user: currentLang === 'ar' ? '👤 مستخدم' : '👤 User',
    system: currentLang === 'ar' ? '⚙️ نظام' : '⚙️ System',
    security: currentLang === 'ar' ? '🔒 أمان' : '🔒 Security'
  };
  showMsg(`🔔 ${title || t[type] || type}: ${message ? message.substring(0, 100) : ''}`);
}

function showNotifPanel() {
  const panel = document.getElementById('notif-panel');
  const list = document.getElementById('notif-list');
  if (!panel || !list) return;
  if (panel.style.display === 'block') { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  if (!_notifList.length) {
    list.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px;">${currentLang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>`;
    return;
  }
  list.innerHTML = _notifList.map(n => {
    const icons = { booking: '📋', contact: '✉️', review: '⭐', user: '👤', system: '⚙️', security: '🔒' };
    return `<div style="padding:10px 12px;border-bottom:1px solid var(--border);${n.read_status ? 'opacity:0.6' : ''}">
      <div style="font-size:0.85rem;font-weight:600;color:var(--gold-primary);">${icons[n.type] || '🔔'} ${n.title}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${n.message ? n.message.substring(0, 150) : ''}</div>
      <div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;">${n.created_at || ''}</div>
    </div>`;
  }).join('');
}

function markNotifAllRead() {
  if (_adminSocket && _socketConnected) {
    _adminSocket.emit('notifications:markAllRead');
  } else {
    adminRequest('POST', '/notifications/read', { id: null });
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
  }
  _notifList = _notifList.map(n => ({ ...n, read_status: 1 }));
  document.getElementById('notif-list').innerHTML = _notifList.map(n => {
    const icons = { booking: '📋', contact: '✉️', review: '⭐', user: '👤', system: '⚙️', security: '🔒' };
    return `<div style="padding:10px 12px;border-bottom:1px solid var(--border);opacity:0.6">
      <div style="font-size:0.85rem;font-weight:600;color:var(--gold-primary);">${icons[n.type] || '🔔'} ${n.title}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${n.message ? n.message.substring(0, 150) : ''}</div>
      <div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;">${n.created_at || ''}</div>
    </div>`;
  }).join('');
}

function updateNotifBadge() {
  const unread = _notifList.filter(n => !n.read_status).length;
  const badge = document.getElementById('notif-badge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline' : 'none'; }
}

let _audioCtx = null;
function playNotifSound() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    const osc = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.connect(gain); gain.connect(_audioCtx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, _audioCtx.currentTime);
    osc.frequency.setValueAtTime(1320, _audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.3);
    osc.start(_audioCtx.currentTime); osc.stop(_audioCtx.currentTime + 0.3);
  } catch (e) {}
}

// ==================== AUTH GUARD & DASHBOARD ====================
function renderSuperAdminDashboard() {
  if (!adminToken) { renderSuperAdminLogin(); return; }
  if (currentAdmin?.role !== 'super_admin') {
    document.querySelector('.header')?.style.setProperty('display', 'none');
    document.getElementById('app').innerHTML = `
      <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:80vh;padding:24px;">
        <div style="background:var(--bg-card);border:1px solid var(--danger);border-radius:12px;padding:40px;max-width:500px;text-align:center;">
          <h2 style="color:var(--danger);margin-bottom:16px;">⛔ ${currentLang === 'ar' ? 'وصول مرفوض' : 'Access Denied'}</h2>
          <p style="color:var(--text-muted);margin-bottom:24px;">${currentLang === 'ar' ? 'ليس لديك صلاحية الوصول إلى لوحة التحكم المركزية. يجب أن يكون دورك super_admin.' : 'You do not have permission to access the System Control Center. Your role must be super_admin.'}</p>
          <a href="/admin" style="display:inline-block;padding:12px 24px;background:var(--gold-primary);color:var(--luxury-navy);border-radius:6px;text-decoration:none;font-weight:600;">${currentLang === 'ar' ? 'الذهاب إلى لوحة الإدارة' : 'Go to Admin Dashboard'}</a>
        </div>
      </div>`;
    return;
  }
  document.querySelector('.header')?.style.setProperty('display', 'none');
  document.getElementById('app').innerHTML = `
    <div style="padding:24px;">
      <div id="admin-toolbar" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <h1 style="font-family:var(--font-display);color:var(--gold-primary);font-size:1.5rem;">✦ ${currentLang === 'ar' ? 'النظام المركزي' : 'System Control'}</h1>
          <span style="color:var(--text-muted);font-size:0.85rem;">${currentAdmin?.name || (currentLang === 'ar' ? 'المشرف' : 'Admin')}</span>
          <span id="notif-bell" onclick="showNotifPanel()" style="position:relative;cursor:pointer;font-size:1.3rem;margin-left:8px;">🔔<span id="notif-badge" style="position:absolute;top:-6px;right:-8px;background:var(--danger);color:#FFF;font-size:0.65rem;padding:1px 5px;border-radius:10px;min-width:16px;text-align:center;display:none;">0</span></span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
          <button class="admin-nav-btn" onclick="renderSuperAdminDashboard()" data-section="dashboard">${tx('dashboard')}</button>
          <button class="admin-nav-btn" onclick="renderAdminRoles()" data-section="roles" style="background:var(--gold-dark);color:#000;">👑 ${currentLang === 'ar' ? 'الأدوار' : 'Roles'}</button>
          <button class="admin-nav-btn" onclick="renderAdminEmployees()" data-section="employees" style="background:var(--gold-dark);color:#000;">👥 ${currentLang === 'ar' ? 'الموظفين' : 'Employees'}</button>
          <button class="admin-nav-btn" onclick="renderAdminCurrencies()" data-section="currencies" style="background:var(--gold-dark);color:#000;">💰 ${currentLang === 'ar' ? 'العملات' : 'Currencies'}</button>
          <button class="admin-nav-btn" onclick="renderAdminSecurity()" data-section="security" style="background:var(--gold-dark);color:#000;">🔒 ${currentLang === 'ar' ? 'الأمان' : 'Security'}</button>
          <button class="admin-nav-btn" onclick="renderAdminSystemHealth()" data-section="health" style="background:var(--gold-dark);color:#000;">⚙️ ${currentLang === 'ar' ? 'صحة النظام' : 'System'}</button>
          <button class="admin-nav-btn" onclick="renderAdminFinance()" data-section="finance" style="background:var(--success);color:#FFF;">📊 ${currentLang === 'ar' ? 'المالية' : 'Finance'}</button>
          <button class="admin-nav-btn" onclick="renderAdminPayments()" data-section="payments" style="background:var(--success);color:#FFF;">💳 ${currentLang === 'ar' ? 'المدفوعات' : 'Payments'}</button>
          <button class="admin-nav-btn" onclick="renderAdminGateways()" data-section="gateways" style="background:var(--gold-dark);color:#000;">🔌 ${currentLang === 'ar' ? 'البوابات' : 'Gateways'}</button>
          <button class="admin-nav-btn" onclick="renderAdminPaymentMethods()" data-section="pyMethods" style="background:var(--gold-dark);color:#000;">📋 ${currentLang === 'ar' ? 'طرق الدفع' : 'Pmt Methods'}</button>
          <button class="admin-nav-btn" onclick="renderAdminFraud()" data-section="fraud" style="background:var(--gold-dark);color:#000;">🛡️ ${currentLang === 'ar' ? 'الاحتيال' : 'Fraud'}</button>
          <button class="admin-nav-btn" onclick="renderAdminAuditLogs()" data-section="audit" style="background:var(--gold-dark);color:#000;">📜 ${currentLang === 'ar' ? 'التدقيق' : 'Audit'}</button>
          <button class="admin-nav-btn" onclick="renderAdminSettings()" data-section="settings">${tx('settings')}</button>
          <button class="admin-nav-btn" onclick="renderAdminLogs()" data-section="logs">${tx('logs')}</button>
          <button class="admin-nav-btn" onclick="handleAdminBackup()" style="background:var(--success);color:#FFF;">${tx('backup')}</button>
          <button class="admin-nav-btn" onclick="toggleSATheme()" id="sa-theme-btn" style="background:transparent;">☀️</button>
          <button class="admin-nav-btn" onclick="toggleAdminLang()" style="background:var(--warning);color:#000;">🌐 ${currentLang === 'en' ? 'عربي' : 'EN'}</button>
          <button class="admin-nav-btn" onclick="handleAdminLogout()" style="background:var(--danger);color:#FFF;">${tx('signOut')}</button>
        </div>
      </div>
      <div id="admin-content">
        <div style="text-align:center;padding:40px;"><p style="color:var(--text-muted);">${tx('welcome')}</p></div>
      </div>
    </div>
    <div id="super-admin-toast" style="display:none;position:fixed;bottom:20px;right:20px;padding:12px 24px;background:#10B981;color:#FFF;border-radius:6px;z-index:2000;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.2);"></div>
    <div id="notif-panel" style="display:none;position:fixed;top:80px;right:24px;width:380px;max-height:500px;overflow-y:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;z-index:1999;box-shadow:0 8px 32px rgba(0,0,0,0.3);padding:16px;direction:${currentLang === 'ar' ? 'rtl' : 'ltr'};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:1rem;">${currentLang === 'ar' ? 'الإشعارات' : 'Notifications'}</h3>
        <button onclick="markNotifAllRead()" style="font-size:0.75rem;background:var(--gold-primary);color:#000;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">${currentLang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}</button>
      </div>
      <div id="notif-list"></div>
    </div>`;
  loadSuperAdminStats();
  connectSocket();
}

async function loadSuperAdminStats() {
  try {
    const s = await adminRequest('GET', '/stats');
    if (!s) return;
    _lastStats = { ...s };
    const f = await adminRequest('GET', '/finance/revenue?period=monthly').catch(() => null);
    document.getElementById('admin-content').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:24px;">
        <div class="stat-card"><span class="stat-value">${s.total_bookings}</span><span class="stat-label">${currentLang === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}</span></div>
        <div class="stat-card"><span class="stat-value" style="color:#3B82F6;">${s.new_bookings}</span><span class="stat-label">${currentLang === 'ar' ? 'جديد' : 'New'}</span></div>
        <div class="stat-card"><span class="stat-value" style="color:var(--warning);">${s.pending}</span><span class="stat-label">${currentLang === 'ar' ? 'معلق' : 'Pending'}</span></div>
        <div class="stat-card"><span class="stat-value" style="color:var(--success);">${s.confirmed}</span><span class="stat-label">${currentLang === 'ar' ? 'مؤكد' : 'Confirmed'}</span></div>
        <div class="stat-card"><span class="stat-value" style="color:#059669;">${s.completed}</span><span class="stat-label">${currentLang === 'ar' ? 'مكتمل' : 'Completed'}</span></div>
        <div class="stat-card"><span class="stat-value" style="color:var(--danger);">${s.cancelled}</span><span class="stat-label">${currentLang === 'ar' ? 'ملغي' : 'Cancelled'}</span></div>
        <div class="stat-card"><span class="stat-value">$${s.revenue}</span><span class="stat-label">${currentLang === 'ar' ? 'الإيرادات' : 'Revenue'}</span></div>
        <div class="stat-card"><span class="stat-value">${s.total_hotels}</span><span class="stat-label">${currentLang === 'ar' ? 'الفنادق' : 'Hotels'}</span></div>
        <div class="stat-card"><span class="stat-value">${s.total_tours}</span><span class="stat-label">${currentLang === 'ar' ? 'الجولات' : 'Tours'}</span></div>
        <div class="stat-card"><span class="stat-value">${s.total_vehicles}</span><span class="stat-label">${currentLang === 'ar' ? 'السيارات' : 'Vehicles'}</span></div>
        <div class="stat-card"><span class="stat-value">${s.total_inquiries}</span><span class="stat-label">${currentLang === 'ar' ? 'الاستفسارات' : 'Inquiries'}</span></div>
        <div class="stat-card"><span class="stat-value">${s.total_users}</span><span class="stat-label">${currentLang === 'ar' ? 'المستخدمين' : 'Users'}</span></div>
        ${f && f.today ? `<div class="stat-card"><span class="stat-value" style="color:var(--success);">$${f.today.total || 0}</span><span class="stat-label">${currentLang === 'ar' ? 'إيرادات اليوم' : 'Today Revenue'}</span></div>` : ''}
        ${f && f.today ? `<div class="stat-card"><span class="stat-value" style="color:var(--success);">${f.today.count || 0}</span><span class="stat-label">${currentLang === 'ar' ? 'معاملات اليوم' : 'Today Tx'}</span></div>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:20px;">
          <h3 style="margin-bottom:12px;">${currentLang === 'ar' ? 'آخر المدفوعات' : 'Recent Payments'}</h3>
          <div id="sa-recent-payments"><p style="color:var(--text-muted);font-size:0.85rem;">${currentLang === 'ar' ? 'جار التحميل...' : 'Loading...'}</p></div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:20px;">
          <h3 style="margin-bottom:12px;">${currentLang === 'ar' ? 'آخر الحجوزات' : 'Recent Bookings'}</h3>
          <div id="sa-recent-bookings"><p style="color:var(--text-muted);font-size:0.85rem;">${currentLang === 'ar' ? 'جار التحميل...' : 'Loading...'}</p></div>
        </div>
      </div>`;
    loadSARecentPayments();
    loadSARecentBookings();
  } catch (err) { showMsg(err.message, true); }
}

async function loadSARecentPayments() {
  try {
    const d = await adminRequest('GET', '/payments?limit=10');
    if (!d) return;
    const el = document.getElementById('sa-recent-payments');
    if (!d.payments || d.payments.length === 0) { el.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">${currentLang === 'ar' ? 'لا توجد مدفوعات' : 'No payments'}</p>`; return; }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
      <thead><tr style="border-bottom:1px solid var(--border-color);text-align:left;color:var(--text-muted);">
        <th style="padding:4px 6px;">#</th><th style="padding:4px 6px;">${currentLang === 'ar' ? 'المبلغ' : 'Amount'}</th><th style="padding:4px 6px;">${currentLang === 'ar' ? 'الحالة' : 'Status'}</th><th style="padding:4px 6px;">${currentLang === 'ar' ? 'التاريخ' : 'Date'}</th></tr></thead>
      <tbody>${d.payments.map(p => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:4px 6px;font-weight:600;">#${p.booking_ref || p.id}</td>
        <td style="padding:4px 6px;">${p.currency || 'USD'} ${p.amount}</td>
        <td style="padding:4px 6px;"><span class="booking-item__status status--${(p.status||'').toLowerCase()}">${p.status}</span></td>
        <td style="padding:4px 6px;color:var(--text-muted);">${p.created_at || ''}</td>
      </tr>`).join('')}</tbody></table>`;
  } catch (e) {}
}

async function loadSARecentBookings() {
  try {
    const d = await adminRequest('GET', '/bookings?limit=10');
    if (!d) return;
    const el = document.getElementById('sa-recent-bookings');
    if (!d.bookings || d.bookings.length === 0) { el.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">${currentLang === 'ar' ? 'لا توجد حجوزات' : 'No bookings'}</p>`; return; }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
      <thead><tr style="border-bottom:1px solid var(--border-color);text-align:left;color:var(--text-muted);">
        <th style="padding:4px 6px;">${currentLang === 'ar' ? 'المرجع' : 'Ref'}</th><th style="padding:4px 6px;">${currentLang === 'ar' ? 'العميل' : 'Customer'}</th><th style="padding:4px 6px;">${currentLang === 'ar' ? 'الحالة' : 'Status'}</th><th style="padding:4px 6px;">${currentLang === 'ar' ? 'التاريخ' : 'Date'}</th></tr></thead>
      <tbody>${d.bookings.map(b => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:4px 6px;font-weight:600;">#${b.booking_ref || b.id}</td>
        <td style="padding:4px 6px;">${b.customer_name}</td>
        <td style="padding:4px 6px;"><span class="booking-item__status status--${(b.status||'').toLowerCase()}">${b.status}</span></td>
        <td style="padding:4px 6px;color:var(--text-muted);">${b.created_at || ''}</td>
      </tr>`).join('')}</tbody></table>`;
  } catch (e) {}
}

// ==================== SUPER ADMIN: ROLES ====================
async function renderAdminRoles() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>👑 ${currentLang === 'ar' ? 'إدارة الأدوار' : 'Role Management'}</h2></div><button class="admin-btn admin-btn--primary" onclick="renderAdminRoleForm()">+ ${tx('add')}</button></div><div id="admin-roles-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/roles');
    if (!d) return;
    document.getElementById('admin-roles-list').innerHTML = `<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;"><th style="padding:8px;">ID</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الاسم بالعربية' : 'Name (AR)'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الصلاحيات' : 'Permissions'}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead><tbody>${
      d.roles.map(r => `<tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px;">${r.id}</td><td style="padding:8px;font-weight:600;">${r.name} ${r.is_system ? '<span style="font-size:0.7rem;color:var(--gold-primary);">(system)</span>' : ''}</td><td style="padding:8px;">${r.name_ar || ''}</td><td style="padding:8px;font-size:0.8rem;">${r.permissions ? JSON.parse(r.permissions).slice(0,5).join(', ') : ''}${r.permissions && JSON.parse(r.permissions).length > 5 ? '...' : ''}</td><td style="padding:8px;">${r.is_system ? '<span style="color:var(--text-muted);font-size:0.8rem;">System</span>' : `<button class="admin-btn admin-btn--sm" onclick="renderAdminRoleForm(${r.id})">${tx('edit')}</button> <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteAdminRole(${r.id})">${tx('del')}</button>`}</td></tr>`).join('')
    }</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

function renderAdminRoleForm(id) {
  const d = id ? null : { name: '', name_ar: '', description: '', permissions: [] };
  if (id) { const dd = adminRequest('GET', '/roles'); dd.then(r => { const role = r.roles.find(x => x.id == id); if (role) renderRoleForm(role); }); return; }
  renderRoleForm(d);
  function renderRoleForm(role) {
    const permsStr = role.permissions ? JSON.parse(role.permissions).join(', ') : '';
    document.getElementById('admin-content').innerHTML = `<div style="max-width:600px;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminRoles()">← ${tx('back')}</button><h2>${id ? tx('edit') : tx('add')} ${currentLang === 'ar' ? 'دور' : 'Role'}</h2></div>
      <form onsubmit="saveAdminRole(event, ${id || ''})"><div><label>${tx('name')}</label><input class="admin-input" name="name" value="${role.name || ''}" required></div>
      <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'الاسم بالعربية' : 'Name (AR)'}</label><input class="admin-input" name="name_ar" value="${role.name_ar || ''}"></div>
      <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'الوصف' : 'Description'}</label><textarea class="admin-input" name="description" style="min-height:60px;">${role.description || ''}</textarea></div>
      <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'الصلاحيات (مفصولة بفواصل)' : 'Permissions (comma-separated)'}</label><textarea class="admin-input" name="permissions" style="min-height:80px;">${permsStr}</textarea>
      <span style="font-size:0.7rem;color:var(--text-muted);">${currentLang === 'ar' ? 'مثال' : 'Example'}: bookings:view, bookings:create, hotels:manage, reports:view</span></div>
      <div style="margin-top:20px;"><button type="submit" class="admin-btn admin-btn--primary">${tx('save')}</button></div></form></div>`;
  }
}

async function saveAdminRole(e, id) {
  e.preventDefault();
  const f = e.target;
  const perms = f.permissions.value.split(',').map(p => p.trim()).filter(Boolean);
  const body = { name: f.name.value, name_ar: f.name_ar.value, description: f.description.value, permissions: perms };
  try {
    const res = id ? await adminRequest('PUT', '/roles/' + id, body) : await adminRequest('POST', '/roles', body);
    if (res) { showMsg(currentLang === 'ar' ? 'تم الحفظ' : 'Saved'); renderAdminRoles(); }
  } catch (err) { showMsg(err.message, true); }
}

async function deleteAdminRole(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذا الدور؟' : 'Delete this role?')) return;
  try { const res = await adminRequest('DELETE', '/roles/' + id); if (res) { showMsg(currentLang === 'ar' ? 'تم الحذف' : 'Deleted'); renderAdminRoles(); } }
  catch (err) { showMsg(err.message, true); }
}

// ==================== SUPER ADMIN: EMPLOYEES ====================
async function renderAdminEmployees() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>👥 ${currentLang === 'ar' ? 'إدارة الموظفين' : 'Employee Management'}</h2></div><button class="admin-btn admin-btn--primary" onclick="renderAdminEmployeeForm()">+ ${tx('add')}</button></div><div id="admin-employees-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/employees');
    if (!d) return;
    document.getElementById('admin-employees-list').innerHTML = `<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;"><th style="padding:8px;">ID</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('email')}</th><th style="padding:8px;">${currentLang === 'ar' ? 'القسم' : 'Department'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الوظيفة' : 'Position'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الراتب' : 'Salary'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الحالة' : 'Status'}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead><tbody>${
      d.employees.map(e => `<tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px;">${e.id}</td><td style="padding:8px;font-weight:600;">${e.user_name || ''}</td><td style="padding:8px;">${e.email || ''}</td><td style="padding:8px;">${e.department || ''}</td><td style="padding:8px;">${e.position || ''}</td><td style="padding:8px;">$${e.salary || 0}</td><td style="padding:8px;"><span class="status--${e.status || 'active'}">${e.status || ''}</span></td><td style="padding:8px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminEmployeeForm(${e.id})">${tx('edit')}</button> <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteAdminEmployee(${e.id})">${tx('del')}</button></td></tr>`).join('')
    }</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

function renderAdminEmployeeForm(id) {
  document.getElementById('admin-content').innerHTML = `<div style="max-width:600px;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminEmployees()">← ${tx('back')}</button><h2>${id ? tx('edit') : tx('add')} ${currentLang === 'ar' ? 'موظف' : 'Employee'}</h2></div>
    <form onsubmit="saveAdminEmployee(event, ${id || ''})" id="emp-form"><div><label>${currentLang === 'ar' ? 'المستخدم' : 'User'}</label>
    <select class="admin-input" name="user_id" id="emp-user" ${id ? 'disabled' : 'required'}><option value="">--</option></select></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'الدور' : 'Role'}</label>
    <select class="admin-input" name="role_id" required id="emp-role"><option value="">--</option></select></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'رقم الموظف' : 'Employee ID'}</label><input class="admin-input" name="employee_id" id="emp-eid"></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'القسم' : 'Department'}</label><input class="admin-input" name="department" id="emp-dept"></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'الوظيفة' : 'Position'}</label><input class="admin-input" name="position" id="emp-pos"></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'الراتب' : 'Salary ($)'}</label><input class="admin-input" name="salary" type="number" id="emp-sal"></div>
    <div style="margin-top:20px;"><button type="submit" class="admin-btn admin-btn--primary">${tx('save')}</button></div></form></div>`;
  adminRequest('GET', '/users?limit=200').then(d => {
    if (!d) return;
    const sel = document.getElementById('emp-user');
    if (!sel) return;
    d.users.forEach(u => {
      const opt = document.createElement('option'); opt.value = u.id; opt.textContent = `${u.name} (${u.email})`;
      if (id) { const ed = adminRequest('GET', '/employees'); ed.then(ed => { const emp = ed.employees.find(x => x.id == id); if (emp && emp.user_id == u.id) opt.selected = true; }); }
      sel.appendChild(opt);
    });
  });
  adminRequest('GET', '/roles').then(d => {
    if (!d) return;
    const sel = document.getElementById('emp-role');
    d.roles.forEach(r => {
      const opt = document.createElement('option'); opt.value = r.id; opt.textContent = `${r.name} - ${r.name_ar}`;
      sel.appendChild(opt);
    });
    if (id) { adminRequest('GET', '/employees').then(ed => { const emp = ed.employees.find(x => x.id == id); if (emp) { document.getElementById('emp-role').value = emp.role_id; document.getElementById('emp-eid').value = emp.employee_id || ''; document.getElementById('emp-dept').value = emp.department || ''; document.getElementById('emp-pos').value = emp.position || ''; document.getElementById('emp-sal').value = emp.salary || ''; } }); }
  });
}

async function saveAdminEmployee(e, id) {
  e.preventDefault();
  const f = e.target;
  const body = { user_id: parseInt(f.user_id?.value) || 0, role_id: parseInt(f.role_id.value), employee_id: f.employee_id.value, department: f.department.value, position: f.position.value, salary: parseFloat(f.salary.value) || 0 };
  try {
    const res = id ? await adminRequest('PUT', '/employees/' + id, body) : await adminRequest('POST', '/employees', body);
    if (res) { showMsg(currentLang === 'ar' ? 'تم الحفظ' : 'Saved'); renderAdminEmployees(); }
  } catch (err) { showMsg(err.message, true); }
}

async function deleteAdminEmployee(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذا الموظف؟' : 'Delete this employee?')) return;
  try { const res = await adminRequest('DELETE', '/employees/' + id); if (res) { showMsg(currentLang === 'ar' ? 'تم الحذف' : 'Deleted'); renderAdminEmployees(); } }
  catch (err) { showMsg(err.message, true); }
}

// ==================== SUPER ADMIN: CURRENCIES ====================
async function renderAdminCurrencies() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>💰 ${currentLang === 'ar' ? 'إدارة العملات' : 'Currencies'}</h2></div><button class="admin-btn admin-btn--primary" onclick="renderAdminCurrencyForm()">+ ${tx('add')}</button></div><div id="admin-currencies-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/currencies');
    if (!d) return;
    document.getElementById('admin-currencies-list').innerHTML = `<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;"><th style="padding:8px;">${currentLang === 'ar' ? 'الرمز' : 'Code'}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الرمز' : 'Symbol'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'سعر الصرف' : 'Rate'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'افتراضي' : 'Default'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الحالة' : 'Status'}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead><tbody>${
      d.currencies.map(c => `<tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px;font-weight:600;">${c.code}</td><td style="padding:8px;">${c.name_ar || c.name}</td><td style="padding:8px;">${c.symbol || ''}</td><td style="padding:8px;">${c.exchange_rate}</td><td style="padding:8px;">${c.is_default ? '⭐' : ''}</td><td style="padding:8px;"><span class="status--${c.status || 'active'}">${c.status || 'active'}</span></td><td style="padding:8px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminCurrencyForm(${c.id})">${tx('edit')}</button> <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteAdminCurrency(${c.id})">${tx('del')}</button></td></tr>`).join('')
    }</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

function renderAdminCurrencyForm(id) {
  document.getElementById('admin-content').innerHTML = `<div style="max-width:500px;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminCurrencies()">← ${tx('back')}</button><h2>${id ? tx('edit') : tx('add')} ${currentLang === 'ar' ? 'عملة' : 'Currency'}</h2></div>
    <form onsubmit="saveAdminCurrency(event, ${id || ''})"><div><label>${currentLang === 'ar' ? 'الرمز' : 'Code'}</label><input class="admin-input" name="code" id="cur-code" required ${id ? 'readonly' : ''}></div>
    <div style="margin-top:12px;"><label>Name</label><input class="admin-input" name="name" id="cur-name"></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'الاسم بالعربية' : 'Name (AR)'}</label><input class="admin-input" name="name_ar" id="cur-name-ar"></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'الرمز' : 'Symbol'}</label><input class="admin-input" name="symbol" id="cur-sym"></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'سعر الصرف (مقابل USD)' : 'Exchange Rate (vs USD)'}</label><input class="admin-input" name="exchange_rate" type="number" step="0.0001" id="cur-rate" value="1"></div>
    <div style="margin-top:12px;"><label><input type="checkbox" name="is_default" id="cur-def"> ${currentLang === 'ar' ? 'افتراضي' : 'Default'}</label></div>
    <div style="margin-top:20px;"><button type="submit" class="admin-btn admin-btn--primary">${tx('save')}</button></div></form></div>`;
  if (id) {
    adminRequest('GET', '/currencies').then(d => {
      if (!d) return;
      const c = d.currencies.find(x => x.id == id);
      if (!c) return;
      document.getElementById('cur-code').value = c.code;
      document.getElementById('cur-name').value = c.name || '';
      document.getElementById('cur-name-ar').value = c.name_ar || '';
      document.getElementById('cur-sym').value = c.symbol || '';
      document.getElementById('cur-rate').value = c.exchange_rate;
      document.getElementById('cur-def').checked = !!c.is_default;
    });
  }
}

async function saveAdminCurrency(e, id) {
  e.preventDefault();
  const f = e.target;
  const body = { code: f.code.value, name: f.name.value, name_ar: f.name_ar.value, symbol: f.symbol.value, exchange_rate: parseFloat(f.exchange_rate.value) || 1, is_default: f.is_default.checked };
  try {
    const res = id ? await adminRequest('PUT', '/currencies/' + id, body) : await adminRequest('POST', '/currencies', body);
    if (res) { showMsg(currentLang === 'ar' ? 'تم الحفظ' : 'Saved'); renderAdminCurrencies(); }
  } catch (err) { showMsg(err.message, true); }
}

async function deleteAdminCurrency(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذه العملة؟' : 'Delete this currency?')) return;
  try { const res = await adminRequest('DELETE', '/currencies/' + id); if (res) { showMsg(currentLang === 'ar' ? 'تم الحذف' : 'Deleted'); renderAdminCurrencies(); } }
  catch (err) { showMsg(err.message, true); }
}

// ==================== SUPER ADMIN: SECURITY ====================
async function renderAdminSecurity() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>🔒 ${currentLang === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}</h2></div><div id="admin-security-form"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/security/settings');
    if (!d) return;
    const s = d.settings;
    document.getElementById('admin-security-form').innerHTML = `<form onsubmit="saveAdminSecurity(event)" style="max-width:500px;">
      <div><label>${currentLang === 'ar' ? 'المصادقة الثنائية (2FA)' : 'Two-Factor Auth (2FA)'}</label>
      <select class="admin-input" name="two_factor_enabled"><option value="0" ${s.two_factor_enabled === '0' ? 'selected' : ''}>${currentLang === 'ar' ? 'معطل' : 'Disabled'}</option><option value="1" ${s.two_factor_enabled === '1' ? 'selected' : ''}>${currentLang === 'ar' ? 'مفعل' : 'Enabled'}</option></select></div>
      <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'مهلة الجلسة (دقيقة)' : 'Session Timeout (minutes)'}</label><input class="admin-input" name="session_timeout" value="${s.session_timeout || '60'}"></div>
      <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'الحد الأقصى لمحاولات الدخول' : 'Max Login Attempts'}</label><input class="admin-input" name="max_login_attempts" value="${s.max_login_attempts || '5'}"></div>
      <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'سياسة كلمة المرور' : 'Password Policy'}</label>
      <select class="admin-input" name="password_policy"><option value="low" ${s.password_policy === 'low' ? 'selected' : ''}>Low</option><option value="medium" ${s.password_policy === 'medium' ? 'selected' : ''}>Medium</option><option value="high" ${s.password_policy === 'high' ? 'selected' : ''}>High</option></select></div>
      <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'قائمة IP البيضاء (مفصولة بفاصلة)' : 'IP Whitelist (comma-separated)'}</label><textarea class="admin-input" name="ip_whitelist" style="min-height:60px;">${s.ip_whitelist || ''}</textarea></div>
      <div style="margin-top:20px;"><button type="submit" class="admin-btn admin-btn--primary">${tx('save')}</button></div></form>`;
  } catch (err) { showMsg(err.message, true); }
}

async function saveAdminSecurity(e) {
  e.preventDefault();
  const f = e.target;
  const body = { two_factor_enabled: f.two_factor_enabled.value, session_timeout: f.session_timeout.value, max_login_attempts: f.max_login_attempts.value, password_policy: f.password_policy.value, ip_whitelist: f.ip_whitelist.value };
  try { const res = await adminRequest('POST', '/security/settings', body); if (res) { showMsg(currentLang === 'ar' ? 'تم الحفظ' : 'Saved'); } }
  catch (err) { showMsg(err.message, true); }
}

// ==================== SUPER ADMIN: SYSTEM HEALTH ====================
async function renderAdminSystemHealth() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>⚙️ ${currentLang === 'ar' ? 'صحة النظام' : 'System Health'}</h2></div><div id="admin-health" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/system/health');
    if (!d) return;
    const items = [
      { label: currentLang === 'ar' ? 'الحالة' : 'Status', value: d.status, color: 'var(--success)' },
      { label: currentLang === 'ar' ? 'قاعدة البيانات' : 'Database', value: d.database, color: d.database === 'connected' ? 'var(--success)' : 'var(--danger)' },
      { label: currentLang === 'ar' ? 'حجم قاعدة البيانات' : 'DB Size', value: d.db_size + ' KB' },
      { label: currentLang === 'ar' ? 'مدة التشغيل' : 'Uptime', value: Math.floor(d.uptime_seconds / 60) + 'm ' + (d.uptime_seconds % 60) + 's' },
      { label: 'Memory', value: d.memory_mb + ' MB' },
      { label: 'Heap', value: d.heap_mb + ' MB' },
      { label: 'Node.js', value: d.node_version },
      { label: 'Platform', value: d.platform },
      { label: 'Environment', value: d.env },
    ];
    document.getElementById('admin-health').innerHTML = items.map(item => `<div class="stat-card" style="cursor:default;"><span class="stat-value" style="color:${item.color || 'var(--gold-primary)'}">${item.value}</span><span class="stat-label">${item.label}</span></div>`).join('');
  } catch (err) { showMsg(err.message, true); }
}

// ==================== FINANCE DASHBOARD ====================
async function renderAdminFinance() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>📊 ${currentLang === 'ar' ? 'لوحة المالية' : 'Finance Dashboard'}</h2>
    <button class="admin-btn admin-btn--sm" onclick="exportFinanceCSV()" style="background:var(--success);color:#FFF;">📥 CSV</button></div>
    <div id="finance-content"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/finance/revenue?period=monthly');
    if (!d) return;
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:24px;">';
    html += `<div class="stat-card" style="cursor:default;"><span class="stat-value">$${d.today?.total || 0}</span><span class="stat-label">${currentLang === 'ar' ? 'اليوم' : 'Today'}</span></div>`;
    html += `<div class="stat-card" style="cursor:default;"><span class="stat-value">${d.today?.count || 0}</span><span class="stat-label">${currentLang === 'ar' ? 'معاملات اليوم' : 'Today Tx'}</span></div>`;
    if (d.totals) d.totals.forEach(t => {
      html += `<div class="stat-card" style="cursor:default;"><span class="stat-value">${t.currency} ${t.total}</span><span class="stat-label">${currentLang === 'ar' ? 'إجمالي' : 'Total'} (${t.currency})</span></div>`;
    });
    if (d.refunds) {
      html += `<div class="stat-card" style="cursor:default;"><span class="stat-value" style="color:var(--danger);">${d.refunds.count}</span><span class="stat-label">${currentLang === 'ar' ? 'طلبات الاسترداد' : 'Refunds'}</span></div>`;
      html += `<div class="stat-card" style="cursor:default;"><span class="stat-value" style="color:var(--danger);">$${d.refunds.total || 0}</span><span class="stat-label">${currentLang === 'ar' ? 'قيمة المسترد' : 'Refunded'}</span></div>`;
    }
    html += '</div>';
    if (d.revenue && d.revenue.length) {
      html += `<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:20px;margin-bottom:24px;"><h3 style="margin-bottom:12px;">${currentLang === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</h3>
        <table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;"><th style="padding:8px;">${currentLang === 'ar' ? 'الشهر' : 'Period'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'المبلغ' : 'Amount'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'العملة' : 'Currency'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'عدد المعاملات' : 'Count'}</th></tr></thead><tbody>${
        d.revenue.map(r => `<tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px;">${r.period}</td><td style="padding:8px;font-weight:600;">${r.total}</td><td style="padding:8px;">${r.currency}</td><td style="padding:8px;">${r.count}</td></tr>`).join('')
      }</tbody></table></div>`;
    }
    if (d.stats && d.stats.length) {
      html += `<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:20px;"><h3 style="margin-bottom:12px;">${currentLang === 'ar' ? 'إحصائيات طرق الدفع' : 'Payment Method Stats'}</h3>
        <table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;"><th style="padding:8px;">${currentLang === 'ar' ? 'العملة' : 'Currency'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الطريقة' : 'Method'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'العدد' : 'Count'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الإجمالي' : 'Total'}</th></tr></thead><tbody>${
        d.stats.map(s => `<tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px;">${s.currency}</td><td style="padding:8px;">${s.payment_method}</td><td style="padding:8px;">${s.count}</td><td style="padding:8px;font-weight:600;">${s.total}</td></tr>`).join('')
      }</tbody></table></div>`;
    }
    if (!d.revenue?.length && !d.stats?.length) html += `<p style="color:var(--text-muted);text-align:center;">${currentLang === 'ar' ? 'لا توجد معاملات مالية بعد' : 'No financial transactions yet'}</p>`;
    document.getElementById('finance-content').innerHTML = html;
  } catch (err) { showMsg(err.message, true); }
}

function exportFinanceCSV() {
  window.open('/api/admin/finance/export?format=csv&token=' + encodeURIComponent(adminToken), '_blank');
}

// ==================== PAYMENTS ====================
async function renderAdminPayments() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>💳 ${currentLang === 'ar' ? 'المدفوعات' : 'Payments'}</h2>
    <select class="admin-input admin-input--sm" id="payment-filter" onchange="renderAdminPayments()" style="width:auto;margin-left:auto;"><option value="">${currentLang === 'ar' ? 'الكل' : 'All'}</option><option value="completed">${currentLang === 'ar' ? 'مكتمل' : 'Completed'}</option><option value="pending">${currentLang === 'ar' ? 'معلق' : 'Pending'}</option><option value="failed">${currentLang === 'ar' ? 'فشل' : 'Failed'}</option><option value="refunded">${currentLang === 'ar' ? 'مسترجع' : 'Refunded'}</option></select>
    <button class="admin-btn admin-btn--primary admin-btn--sm" onclick="renderAdminPaymentForm()" style="margin-left:8px;">+ ${currentLang === 'ar' ? 'إضافة' : 'Add'}</button>
    </div><div id="payments-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const status = document.getElementById('payment-filter')?.value || '';
    const d = await adminRequest('GET', '/payments' + (status ? '?status=' + status : ''));
    if (!d) return;
    document.getElementById('payments-list').innerHTML = `<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;"><th style="padding:8px;">ID</th><th style="padding:8px;">${currentLang === 'ar' ? 'المرجع' : 'Ref'}</th><th style="padding:8px;">${tx('customer')}</th><th style="padding:8px;">${currentLang === 'ar' ? 'المبلغ' : 'Amount'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الطريقة' : 'Method'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الحالة' : 'Status'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'التاريخ' : 'Date'}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead><tbody>${
      d.payments.map(p => `<tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px;">${p.id}</td><td style="padding:8px;font-weight:600;">#${p.booking_ref || ''}</td><td style="padding:8px;">${p.customer_name || ''}</td><td style="padding:8px;">${p.currency || 'USD'} ${p.amount}</td><td style="padding:8px;font-size:0.8rem;">${p.payment_method || ''}</td><td style="padding:8px;"><span class="status--${(p.status||'').toLowerCase()}">${p.status}</span></td><td style="padding:8px;font-size:0.8rem;">${p.created_at || ''}</td><td style="padding:8px;">
        <button class="admin-btn admin-btn--sm" onclick="viewAdminPayment(${p.id})">👁️</button>
        ${p.status === 'completed' ? `<button class="admin-btn admin-btn--sm admin-btn--danger" onclick="refundAdminPayment(${p.id})">🔄 ${currentLang === 'ar' ? 'استرداد' : 'Refund'}</button>` : ''}
      </td></tr>`).join('')
    }</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function viewAdminPayment(id) {
  try {
    const d = await adminRequest('GET', '/payments/' + id);
    if (!d || !d.payment) return;
    const p = d.payment;
    showMsg(`💳 Payment #${p.id}: ${p.currency} ${p.amount} | ${p.payment_method} | ${p.status} | Ref: #${p.booking_ref || ''} | Customer: ${p.customer_name || ''}${p.gateway_response ? ` | Gateway: ${JSON.stringify(p.gateway_response)}` : ''}`);
  } catch (err) { showMsg(err.message, true); }
}

async function refundAdminPayment(id) {
  const reason = prompt(currentLang === 'ar' ? 'سبب الاسترداد:' : 'Refund reason:');
  if (reason === null) return;
  try {
    const res = await adminRequest('POST', '/payments/' + id + '/refund', { reason });
    if (res) { showMsg(currentLang === 'ar' ? 'تم تقديم طلب الاسترداد' : 'Refund processed'); renderAdminPayments(); }
  } catch (err) { showMsg(err.message, true); }
}

function renderAdminPaymentForm() {
  document.getElementById('admin-content').innerHTML = `<div style="max-width:500px;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminPayments()">← ${tx('back')}</button><h2>💳 ${currentLang === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}</h2></div>
    <form onsubmit="saveAdminPayment(event)"><div><label>${currentLang === 'ar' ? 'معرف الحجز' : 'Booking ID'}</label><input class="admin-input" name="booking_id" type="number" required>
    <span style="font-size:0.7rem;color:var(--text-muted);">${currentLang === 'ar' ? 'أدخل رقم الحجز' : 'Enter the booking ID number'}</span></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'المبلغ' : 'Amount'}</label><input class="admin-input" name="amount" type="number" step="0.01" required></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'العملة' : 'Currency'}</label><select class="admin-input" name="currency"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="QAR">QAR</option><option value="SAR">SAR</option><option value="AED">AED</option></select></div>
    <div style="margin-top:12px;"><label>${currentLang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label><select class="admin-input" name="payment_method"><option value="visa">Visa</option><option value="mastercard">Mastercard</option><option value="apple_pay">Apple Pay</option><option value="google_pay">Google Pay</option><option value="bank_transfer">Bank Transfer</option></select></div>
    <div style="margin-top:20px;"><button type="submit" class="admin-btn admin-btn--primary">${currentLang === 'ar' ? 'تسجيل' : 'Record Payment'}</button></div></form></div>`;
}

async function saveAdminPayment(e) {
  e.preventDefault();
  const f = e.target;
  const body = { booking_id: parseInt(f.booking_id.value), amount: parseFloat(f.amount.value), currency: f.currency.value, payment_method: f.payment_method.value };
  try { const res = await adminRequest('POST', '/payments', body); if (res) { showMsg('✅ ' + (currentLang === 'ar' ? 'تم تسجيل الدفعة' : 'Payment recorded') + ': ' + f.amount.value + ' ' + f.currency.value); renderAdminPayments(); } }
  catch (err) { showMsg(err.message, true); }
}

// ==================== SETTINGS ====================
async function renderAdminSettings() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>${tx('settings')}</h2></div>
    <form id="admin-settings-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;" onsubmit="saveAdminSettings(event)">
      <div id="admin-settings-fields">${tx('loading')}</div>
      <div style="grid-column:1/-1;display:flex;gap:12px;">
        <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
        <button class="admin-btn" type="button" onclick="renderSuperAdminDashboard()">${tx('back')}</button></div>
    </form>`;
  try {
    const d = await adminRequest('GET', '/settings');
    if (!d) return;
    const fields = [
      'site_name', 'site_name_ar', 'company_name', 'company_address', 'company_address_ar',
      'contact_phone', 'whatsapp_number', 'contact_email', 'facebook_url', 'instagram_url',
      'twitter_url', 'youtube_url', 'hero_title', 'hero_title_ar', 'hero_subtitle', 'hero_subtitle_ar',
      'meta_title', 'meta_description', 'meta_keywords', 'maintenance_mode',
      'payment_methods', 'payment_methods_ar', 'bank_name', 'bank_account', 'iban', 'western_union_info'
    ];
    const s = d.settings ? Object.fromEntries(d.settings.map(x => [x.key, x.value])) : d;
    const html = fields.map(key => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<div><label>${label}</label><input class="admin-input" name="${key}" value="${(s[key] || '').replace(/"/g, '&quot;')}"></div>`;
    }).join('');
    document.getElementById('admin-settings-fields').innerHTML = html;
  } catch (err) { showMsg(err.message, true); }
}

async function saveAdminSettings(e) {
  e.preventDefault();
  const f = e.target;
  const settings = {};
  const inputs = f.querySelectorAll('[name]');
  inputs.forEach(inp => settings[inp.name] = inp.value);
  try {
    await adminRequest('PUT', '/settings', { settings });
    showMsg(tx('settingsSaved'));
  } catch (err) { showMsg(err.message, true); }
}

// ==================== LOGS ====================
async function renderAdminLogs() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>${tx('logs')}</h2></div>
    <div id="admin-logs-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/logs?limit=50');
    if (!d) return;
    const el = document.getElementById('admin-logs-list');
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${currentLang === 'ar' ? 'المستخدم' : 'User'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الإجراء' : 'Action'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'التفاصيل' : 'Details'}</th><th style="padding:8px;">IP</th><th style="padding:8px;">${tx('date')}</th></tr></thead>
      <tbody>${(d.logs || []).map(l => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;">${l.user_name || ''}</td>
        <td style="padding:8px;font-weight:600;">${l.action}</td>
        <td style="padding:8px;color:var(--text-muted);font-size:0.85rem;">${l.details || ''}</td>
        <td style="padding:8px;font-size:0.85rem;">${l.ip_address || ''}</td>
        <td style="padding:8px;font-size:0.85rem;color:var(--text-muted);">${l.created_at || ''}</td>
      </tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

// ==================== BACKUP ====================
async function handleAdminBackup() {
  try {
    const d = await adminRequest('POST', '/backup');
    showMsg(tx('backupCreated') + ' ' + (d.path || ''));
  } catch (err) { showMsg(err.message, true); }
}

// ==================== LOGOUT ====================
function handleAdminLogout() {
  disconnectSocket();
  if (_notifInterval2) clearInterval(_notifInterval2);
  adminToken = null;
  currentAdmin = null;
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  renderSuperAdminLogin();
}

// ==================== PAGINATION ====================
function renderPagination(currentPage, total, limit, callbackName) {
  const totalPages = Math.ceil(total / limit) || 1;
  if (totalPages <= 1) return '';
  let html = '<div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:20px;flex-wrap:wrap;">';
  if (currentPage > 1) html += `<button class="admin-btn admin-btn--sm" onclick="${callbackName}(${currentPage - 1})">← ${tx('page')} ${currentPage - 1}</button>`;
  html += `<span style="color:var(--text-muted);font-size:0.9rem;padding:0 12px;">${tx('page')} ${currentPage} / ${totalPages}</span>`;
  if (currentPage < totalPages) html += `<button class="admin-btn admin-btn--sm" onclick="${callbackName}(${currentPage + 1})">${tx('page')} ${currentPage + 1} →</button>`;
  html += '</div>';
  return html;
}

// ==================== USERS ====================
async function renderAdminUsers(search = '', page = 1) {
  const limit = 20;
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>${tx('users')}</h2></div>
      <div style="display:flex;gap:8px;">
        <input type="text" class="admin-input" id="users-search" placeholder="${tx('search')}..." style="width:200px;" value="${search}">
        <button class="admin-btn admin-btn--primary" onclick="renderAdminUsers(document.getElementById('users-search').value, 1)">${tx('search')}</button>
      </div>
    </div>
    <div id="admin-users-list"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  try {
    let url = `/users?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const d = await adminRequest('GET', url);
    if (!d) return;
    const el = document.getElementById('admin-users-list');
    if (!d.users || d.users.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('noUsers')}</p>`;
      return;
    }
    let html = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">Email</th><th style="padding:8px;">Phone</th><th style="padding:8px;">${tx('country') || 'Country'}</th><th style="padding:8px;">${tx('date')}</th><th style="padding:8px;">${tx('total')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${d.users.map(u => `<tr style="border-bottom:1px solid var(--border-color);" id="user-row-${u.id}">
        <td style="padding:8px;">${u.id}</td>
        <td style="padding:8px;font-weight:600;" class="user-name-${u.id}">${u.name}</td>
        <td style="padding:8px;" class="user-email-${u.id}">${u.email}</td>
        <td style="padding:8px;" class="user-phone-${u.id}">${u.phone || ''}</td>
        <td style="padding:8px;" class="user-country-${u.id}">${u.country || ''}</td>
        <td style="padding:8px;font-size:0.85rem;color:var(--text-muted);">${u.created_at || ''}</td>
        <td style="padding:8px;">${u.total_bookings || 0}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${(u.status||'active')}">${u.status || 'active'}</span></td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="viewUserProfile(${u.id})">${tx('viewProfile')}</button>
          <button class="admin-btn admin-btn--sm" onclick="editUserInline(${u.id})">${tx('edit')}</button>
          <button class="admin-btn admin-btn--sm ${u.status === 'disabled' ? 'admin-btn--primary' : 'admin-btn--danger'}" onclick="toggleUserStatus(${u.id}, '${u.status === 'disabled' ? 'active' : 'disabled'}')">${u.status === 'disabled' ? tx('enableUser') : tx('disableUser')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteUser(${u.id})">${tx('del')}</button>
        </td></tr>`).join('')}</tbody></table>`;
    html += renderPagination(page, d.total, limit, 'renderAdminUsers');
    el.innerHTML = html;
  } catch (err) { showMsg(err.message, true); }
}

async function viewUserProfile(userId) {
  try {
    const d = await adminRequest('GET', `/users/${userId}`);
    if (!d) return;
    const u = d.user;
    document.getElementById('admin-content').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminUsers()">← ${tx('back')}</button><h2>${tx('viewProfile')}</h2></div>
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:24px;max-width:600px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div><strong>${tx('name')}:</strong> ${u.name}</div>
          <div><strong>Email:</strong> ${u.email}</div>
          <div><strong>Phone:</strong> ${u.phone || '-'}</div>
          <div><strong>${tx('country') || 'Country'}:</strong> ${u.country || '-'}</div>
          <div><strong>${tx('role') || 'Role'}:</strong> ${u.role || 'user'}</div>
          <div><strong>${tx('status')}:</strong> ${u.status || 'active'}</div>
          <div><strong>${tx('total')} ${currentLang === 'ar' ? 'الحجوزات' : 'Bookings'}:</strong> ${u.bookings_count || 0}</div>
          <div><strong>${tx('date')}:</strong> ${u.created_at || ''}</div>
        </div>
        ${u.notes ? `<div style="margin-top:16px;"><strong>Notes:</strong><p style="color:var(--text-muted);">${u.notes}</p></div>` : ''}
      </div>`;
  } catch (err) { showMsg(err.message, true); }
}

async function editUserInline(userId) {
  const row = document.getElementById('user-row-' + userId);
  if (!row) return;
  const nameEl = row.querySelector('.user-name-' + userId);
  const emailEl = row.querySelector('.user-email-' + userId);
  const phoneEl = row.querySelector('.user-phone-' + userId);
  const countryEl = row.querySelector('.user-country-' + userId);
  const currentName = nameEl.textContent;
  const currentEmail = emailEl.textContent;
  const currentPhone = phoneEl.textContent;
  const currentCountry = countryEl.textContent;
  const actionsCell = row.querySelector('td:last-child');
  actionsCell.innerHTML = `
    <button class="admin-btn admin-btn--sm admin-btn--primary" onclick="saveUserInline(${userId})">${tx('save')}</button>
    <button class="admin-btn admin-btn--sm" onclick="renderAdminUsers()">${tx('cancel')}</button>`;
  nameEl.innerHTML = `<input class="admin-input admin-input--sm" id="inline-name-${userId}" value="${currentName}" style="width:100px;">`;
  emailEl.innerHTML = `<input class="admin-input admin-input--sm" id="inline-email-${userId}" value="${currentEmail}" style="width:120px;">`;
  phoneEl.innerHTML = `<input class="admin-input admin-input--sm" id="inline-phone-${userId}" value="${currentPhone}" style="width:100px;">`;
  countryEl.innerHTML = `<input class="admin-input admin-input--sm" id="inline-country-${userId}" value="${currentCountry}" style="width:80px;">`;
}

async function saveUserInline(userId) {
  const name = document.getElementById('inline-name-' + userId).value;
  const email = document.getElementById('inline-email-' + userId).value;
  const phone = document.getElementById('inline-phone-' + userId).value;
  const country = document.getElementById('inline-country-' + userId).value;
  try {
    await adminRequest('PUT', `/users/${userId}`, { name, phone, country });
    showMsg(tx('saved'));
    renderAdminUsers();
  } catch (err) { showMsg(err.message, true); }
}

async function toggleUserStatus(userId, newStatus) {
  try {
    await adminRequest('PUT', `/users/${userId}`, { status: newStatus });
    showMsg(tx('statusUpdated'));
    renderAdminUsers();
  } catch (err) { showMsg(err.message, true); }
}

async function deleteUser(userId) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذا المستخدم؟' : 'Delete this user?')) return;
  try {
    await adminRequest('DELETE', `/users/${userId}`);
    showMsg(tx('deleted'));
    renderAdminUsers();
  } catch (err) { showMsg(err.message, true); }
}

// ==================== CURRENCY HELPER ====================
adminRequest('GET', '/currencies').then(d => { if (d) window._currencies = d.currencies; }).catch(() => {});

// ==================== STYLES ====================
const style = document.createElement('style');
style.textContent = `
  .admin-nav-btn { padding: 8px 14px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); border-radius: 6px; cursor: pointer; font-size: 0.82rem; font-weight: 500; transition: all 0.2s; white-space: nowrap; }
  .admin-nav-btn:hover { border-color: var(--gold-primary); color: var(--gold-primary); }
  .admin-btn { padding: 10px 20px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); border-radius: 6px; cursor: pointer; font-size: 0.88rem; font-weight: 500; transition: all 0.2s; }
  .admin-btn--primary { background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark)); color: var(--luxury-navy); border: none; }
  .admin-btn--danger { background: var(--danger); color: #FFF; border: none; }
  .admin-btn--secondary { border-color: var(--gold-primary); color: var(--gold-primary); }
  .admin-btn--sm { padding: 6px 12px; font-size: 0.78rem; }
  .admin-input { padding: 8px 12px; border: 1px solid var(--border-color); background: var(--bg); color: var(--text-main); border-radius: 6px; font-size: 0.88rem; width: 100%; }
  .admin-input--sm { padding: 4px 8px; font-size: 0.8rem; width: auto; }
  .admin-input:focus { outline: none; border-color: var(--gold-primary); }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
  .stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
  .stat-value { display: block; font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; color: var(--gold-primary); }
  .stat-label { display: block; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-top: 4px; }
  label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
  table { font-size: 0.88rem; }
  @media (max-width: 768px) {
    #admin-toolbar { flex-direction: column; align-items: stretch; }
    #admin-toolbar > div:last-child { overflow-x: auto; display: flex; gap: 4px; padding-bottom: 8px; }
  }
`;
document.head.appendChild(style);

// ============ SUPER ADMIN: GATEWAYS ============
async function renderAdminGateways() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>🔌 ${currentLang === 'ar' ? 'إدارة بوابات الدفع' : 'Payment Gateways'}</h2></div>
    <div id="admin-gateways-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/gateways');
    if (!d) return;
    const el = document.getElementById('admin-gateways-list');
    el.innerHTML = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);font-size:0.8rem;">
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'البوابة' : 'Gateway'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المزوّد' : 'Provider'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'العملات' : 'Currencies'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'حالة' : 'Active'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الصحة' : 'Health'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الأولوية' : 'Priority'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
      </tr></thead>
      <tbody>${(d.gateways || []).map(g => `
        <tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px;"><strong>${g.name || g.code}</strong></td>
          <td style="padding:8px;font-size:0.85rem;">${g.provider}</td>
          <td style="padding:8px;font-size:0.85rem;">${(g.supported_currencies || []).join(', ')}</td>
          <td style="padding:8px;"><span class="booking-item__status status--${g.is_active ? 'active' : 'inactive'}">${g.is_active ? '✓' : '✗'}</span></td>
          <td style="padding:8px;"><span class="booking-item__status status--${g.health_status === 'healthy' ? 'active' : 'inactive'}">${g.health_status || 'unknown'}</span></td>
          <td style="padding:8px;">${g.priority}</td>
          <td style="padding:8px;">
            <button class="admin-btn admin-btn--sm" onclick="toggleGateway(${g.id}, ${g.is_active ? 0 : 1})">${g.is_active ? (currentLang === 'ar' ? 'تعطيل' : 'Disable') : (currentLang === 'ar' ? 'تفعيل' : 'Enable')}</button>
            <button class="admin-btn admin-btn--sm admin-btn--secondary" onclick="healthCheckGateway(${g.id})">${currentLang === 'ar' ? 'فحص' : 'Health'}</button>
          </td>
        </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

async function toggleGateway(id, active) {
  try {
    await adminRequest('PUT', `/gateways/${id}`, { is_active: active });
    showMsg(currentLang === 'ar' ? 'تم التحديث' : 'Updated');
    renderAdminGateways();
  } catch (err) { showMsg(err.message, true); }
}

async function healthCheckGateway(id) {
  try {
    const d = await adminRequest('POST', `/gateways/${id}/health-check`);
    showMsg(`${currentLang === 'ar' ? 'الفحص:' : 'Check:'} ${d.status} (${d.response_time}ms)`);
    renderAdminGateways();
  } catch (err) { showMsg(err.message, true); }
}

// ============ SUPER ADMIN: PAYMENT METHODS ============
async function renderAdminPaymentMethods() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>📋 ${currentLang === 'ar' ? 'طرق الدفع' : 'Payment Methods'}</h2></div>
    <div id="admin-pymethods-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/payment-methods');
    if (!d) return;
    const el = document.getElementById('admin-pymethods-list');
    el.innerHTML = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);font-size:0.8rem;">
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الطريقة' : 'Method'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الرمز' : 'Code'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المناطق' : 'Regions'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'فوري' : 'Instant'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'يدوي' : 'Manual'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الرسوم' : 'Fee'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'نشط' : 'Active'}</th>
        <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
      </tr></thead>
      <tbody>${(d.methods || []).map(m => `
        <tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px;">${m.icon || '💳'} <strong>${m.name || m.code}</strong></td>
          <td style="padding:8px;font-size:0.8rem;">${m.code}</td>
          <td style="padding:8px;font-size:0.8rem;">${(JSON.parse(m.regions || '["all"]')).join(', ')}</td>
          <td style="padding:8px;">${m.is_instant ? '✓' : '—'}</td>
          <td style="padding:8px;">${m.needs_manual_approval ? '✓' : '—'}</td>
          <td style="padding:8px;">${m.processing_fee}${m.fee_type === 'percentage' ? '%' : ''}</td>
          <td style="padding:8px;"><span class="booking-item__status status--${m.is_active ? 'active' : 'inactive'}">${m.is_active ? '✓' : '✗'}</span></td>
          <td style="padding:8px;">
            <button class="admin-btn admin-btn--sm" onclick="togglePaymentMethod(${m.id}, ${m.is_active ? 0 : 1})">${m.is_active ? (currentLang === 'ar' ? 'تعطيل' : 'Disable') : (currentLang === 'ar' ? 'تفعيل' : 'Enable')}</button>
          </td>
        </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

async function togglePaymentMethod(id, active) {
  try {
    await adminRequest('PUT', `/payment-methods/${id}`, { is_active: active });
    showMsg(currentLang === 'ar' ? 'تم التحديث' : 'Updated');
    renderAdminPaymentMethods();
  } catch (err) { showMsg(err.message, true); }
}

// ============ SUPER ADMIN: FRAUD ============
async function renderAdminFraud() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:20px;">
      <button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button>
      <h2>🛡️ ${currentLang === 'ar' ? 'إدارة الاحتيال' : 'Fraud Management'}</h2>
      <button class="admin-btn admin-btn--sm admin-btn--secondary" onclick="renderAdminBlacklist()">${currentLang === 'ar' ? 'القائمة السوداء' : 'Blacklist'}</button>
      <button class="admin-btn admin-btn--sm" onclick="renderAdminRiskLogs()">${currentLang === 'ar' ? 'سجلات المخاطر' : 'Risk Logs'}</button>
    </div>
    <div id="admin-fraud-scores"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/fraud/scores');
    if (!d) return;
    const el = document.getElementById('admin-fraud-scores');
    if (!d.scores || d.scores.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'لا توجد نتائج احتيال' : 'No fraud scores'}</p>`;
      return;
    }
    el.innerHTML = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);font-size:0.8rem;">
        <th style="padding:8px;">ID</th>
        <th style="padding:8px;">${currentLang === 'ar' ? 'العميل' : 'Customer'}</th>
        <th style="padding:8px;">${currentLang === 'ar' ? 'النتيجة' : 'Score'}</th>
        <th style="padding:8px;">${currentLang === 'ar' ? 'المستوى' : 'Level'}</th>
        <th style="padding:8px;">${currentLang === 'ar' ? 'التنبيهات' : 'Flags'}</th>
        <th style="padding:8px;">${currentLang === 'ar' ? 'IP' : 'IP'}</th>
        <th style="padding:8px;">${currentLang === 'ar' ? 'التاريخ' : 'Date'}</th>
      </tr></thead>
      <tbody>${d.scores.map(s => `
        <tr style="border-bottom:1px solid var(--border-color);${s.risk_level === 'critical' ? 'background:rgba(239,68,68,0.05);' : s.risk_level === 'high' ? 'background:rgba(245,158,11,0.05);' : ''}">
          <td style="padding:8px;font-size:0.85rem;">#${s.id}</td>
          <td style="padding:8px;">${s.customer_name || '—'}<br><small style="font-size:0.7rem;">${s.booking_ref || ''}</small></td>
          <td style="padding:8px;font-weight:700;${s.risk_score >= 70 ? 'color:var(--danger);' : s.risk_score >= 40 ? 'color:var(--warning);' : 'color:var(--success);'}">${s.risk_score}</td>
          <td style="padding:8px;"><span class="booking-item__status status--${s.risk_level === 'critical' ? 'cancelled' : s.risk_level === 'high' ? 'pending' : 'active'}">${s.risk_level}</span></td>
          <td style="padding:8px;font-size:0.8rem;">${(() => { try { return JSON.parse(s.flags || '[]').join(', '); } catch { return s.flags || ''; } })()}</td>
          <td style="padding:8px;font-size:0.8rem;color:var(--text-muted);">${s.ip_address || ''}</td>
          <td style="padding:8px;font-size:0.8rem;color:var(--text-muted);">${s.created_at || ''}</td>
        </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminBlacklist() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:20px;">
      <button class="admin-btn admin-btn--sm" onclick="renderAdminFraud()">← ${tx('back')}</button>
      <h2>🚫 ${currentLang === 'ar' ? 'القائمة السوداء' : 'Blacklist'}</h2>
      <button class="admin-btn admin-btn--sm admin-btn--primary" onclick="addBlacklistItem()">+ ${currentLang === 'ar' ? 'إضافة' : 'Add'}</button>
    </div>
    <div id="admin-blacklist-content"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/fraud/blacklist');
    if (!d) return;
    const el = document.getElementById('admin-blacklist-content');
    if (!d.blacklist || d.blacklist.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'القائمة السوداء فارغة' : 'Blacklist is empty'}</p>`;
      return;
    }
    el.innerHTML = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);">
        <th style="padding:8px;">ID</th><th style="padding:8px;">${currentLang === 'ar' ? 'النوع' : 'Type'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'القيمة' : 'Value'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'السبب' : 'Reason'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'التاريخ' : 'Date'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
      </tr></thead>
      <tbody>${d.blacklist.map(b => `
        <tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px;font-size:0.85rem;">#${b.id}</td>
          <td style="padding:8px;"><span class="booking-item__status status--${b.type}">${b.type}</span></td>
          <td style="padding:8px;font-family:monospace;">${b.value}</td>
          <td style="padding:8px;font-size:0.85rem;">${b.reason || '—'}</td>
          <td style="padding:8px;font-size:0.8rem;color:var(--text-muted);">${b.created_at || ''}</td>
          <td style="padding:8px;"><button class="admin-btn admin-btn--sm admin-btn--danger" onclick="removeBlacklistItem(${b.id})">${currentLang === 'ar' ? 'حذف' : 'Delete'}</button></td>
        </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

async function addBlacklistItem() {
  const type = prompt(`${currentLang === 'ar' ? 'النوع (email/ip/user_id):' : 'Type (email/ip/user_id):'}`);
  if (!type) return;
  const value = prompt(`${currentLang === 'ar' ? 'القيمة:' : 'Value:'}`);
  if (!value) return;
  const reason = prompt(`${currentLang === 'ar' ? 'السبب (اختياري):' : 'Reason (optional):'}`);
  try {
    await adminRequest('POST', '/fraud/blacklist', { type, value, reason: reason || '' });
    showMsg(currentLang === 'ar' ? 'تمت الإضافة' : 'Added');
    renderAdminBlacklist();
  } catch (err) { showMsg(err.message, true); }
}

async function removeBlacklistItem(id) {
  if (!confirm(currentLang === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) return;
  try {
    await adminRequest('DELETE', `/fraud/blacklist/${id}`);
    showMsg(currentLang === 'ar' ? 'تم الحذف' : 'Deleted');
    renderAdminBlacklist();
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminRiskLogs() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:20px;">
      <button class="admin-btn admin-btn--sm" onclick="renderAdminFraud()">← ${tx('back')}</button>
      <h2>⚠️ ${currentLang === 'ar' ? 'سجلات المخاطر' : 'Risk Logs'}</h2>
    </div>
    <div id="admin-risk-logs"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/fraud/logs');
    if (!d) return;
    const el = document.getElementById('admin-risk-logs');
    if (!d.logs || d.logs.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'لا توجد سجلات' : 'No logs'}</p>`;
      return;
    }
    el.innerHTML = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);">
        <th style="padding:8px;">ID</th><th style="padding:8px;">${currentLang === 'ar' ? 'العميل' : 'Customer'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الإجراء' : 'Action'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'السبب' : 'Reason'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'النتيجة' : 'Score'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'التاريخ' : 'Date'}</th>
      </tr></thead>
      <tbody>${d.logs.map(l => `
        <tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px;font-size:0.85rem;">#${l.id}</td>
          <td style="padding:8px;">${l.customer_name || '—'}</td>
          <td style="padding:8px;">${l.action}</td>
          <td style="padding:8px;font-size:0.85rem;">${l.reason || ''}</td>
          <td style="padding:8px;">${l.risk_score}</td>
          <td style="padding:8px;font-size:0.8rem;color:var(--text-muted);">${l.created_at || ''}</td>
        </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

// ============ SUPER ADMIN: AUDIT LOGS ============
async function renderAdminAuditLogs() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderSuperAdminDashboard()">← ${tx('back')}</button><h2>📜 ${currentLang === 'ar' ? 'سجلات التدقيق' : 'Audit Logs'}</h2></div>
    <div id="admin-audit-logs"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/audit-logs');
    if (!d) return;
    const el = document.getElementById('admin-audit-logs');
    if (!d.logs || d.logs.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'لا توجد سجلات تدقيق' : 'No audit logs'}</p>`;
      return;
    }
    el.innerHTML = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);font-size:0.8rem;">
        <th style="padding:8px;">ID</th><th style="padding:8px;">${currentLang === 'ar' ? 'المستخدم' : 'User'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الإجراء' : 'Action'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'الموارد' : 'Resource'}</th><th style="padding:8px;">${currentLang === 'ar' ? 'التفاصيل' : 'Details'}</th><th style="padding:8px;">IP</th><th style="padding:8px;">${currentLang === 'ar' ? 'التاريخ' : 'Date'}</th>
      </tr></thead>
      <tbody>${d.logs.map(l => `
        <tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px;font-size:0.85rem;">#${l.id}</td>
          <td style="padding:8px;">${l.user_email || '—'}<br><small style="font-size:0.7rem;color:var(--text-muted);">${l.user_role || ''}</small></td>
          <td style="padding:8px;font-weight:600;">${l.action}</td>
          <td style="padding:8px;font-size:0.85rem;">${l.resource || ''}${l.resource_id ? ' #' + l.resource_id : ''}</td>
          <td style="padding:8px;font-size:0.8rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;">${(() => { try { const d = JSON.parse(l.details || '{}'); return Object.entries(d).map(([k,v]) => `${k}: ${v}`).join(', '); } catch { return l.details || ''; } })()}</td>
          <td style="padding:8px;font-size:0.8rem;color:var(--text-muted);">${l.ip_address || ''}</td>
          <td style="padding:8px;font-size:0.8rem;color:var(--text-muted);">${l.created_at || ''}</td>
        </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

function toggleSATheme() {
  const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('syria_theme', theme);
  const btn = document.getElementById('sa-theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

window.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('syria_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const tb = document.getElementById('sa-theme-toggle');
  if (tb) tb.textContent = theme === 'dark' ? '☀️' : '🌙';
  if (adminToken) {
    renderSuperAdminDashboard();
    const tb2 = document.getElementById('sa-theme-btn');
    if (tb2) tb2.textContent = theme === 'dark' ? '☀️' : '🌙';
  } else {
    renderSuperAdminLogin();
  }
});
