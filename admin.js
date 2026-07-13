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

// Register service worker for background notifications
if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register(API_BASE + '/sw.js').catch(() => {});
}

const LOC = {
  en: {
    dashboard: 'Dashboard', hotels: 'Hotels', rooms: 'Rooms', tours: 'Tours',
    vehicles: 'Vehicles', gallery: 'Gallery', bookings: 'Bookings', contacts: 'Inquiries',
    reviews: 'Reviews', offers: 'Offers', coupons: 'Coupons', users: 'Users',
    settings: 'Settings', pages: 'Pages', cities: 'Cities', logs: 'Activity Logs',
    backup: 'Backup', signOut: 'Sign Out', add: 'Add New', edit: 'Edit', del: 'Delete',
    save: 'Save', cancel: 'Cancel', confirm: 'Confirm', search: 'Search',
    filter: 'Filter', all: 'All', new: 'New', pending: 'Pending', confirmed: 'Confirmed',
    completed: 'Completed', cancelled: 'Cancelled', active: 'Active', inactive: 'Inactive',
    actions: 'Actions', status: 'Status', created: 'Created', total: 'Total',
    revenue: 'Revenue', welcome: 'Welcome to the Control Suite',
    email: 'Email', phone: 'Phone', country: 'Country', role: 'Role',
    id: 'ID', name: 'Name', city: 'City', rating: 'Rating', price: 'Price',
    ref: 'Ref', customer: 'Customer', type: 'Type', date: 'Date',
    nameAr: 'Name (Arabic)', cityAr: 'City (Arabic)', address: 'Address',
    addressAr: 'Address (Arabic)', rating1_5: 'Rating (1-5)', price$: 'Price ($)',
    coverImage: 'Cover Image', amenitiesComma: 'Amenities (comma-separated)',
    description: 'Description', descriptionAr: 'Description (Arabic)',
    longDescription: 'Long Description', longDescriptionAr: 'Long Description (Arabic)',
    latitude: 'Latitude', longitude: 'Longitude', featured: 'Featured',
    hotel: 'Hotel', category: 'Category', categoryAr: 'Category (Arabic)',
    capacity: 'Capacity', size: 'Size', bedType: 'Bed Type',
    bedTypeAr: 'Bed Type (Arabic)', servicesComma: 'Services (comma-separated)',
    duration: 'Duration', durationAr: 'Duration (Arabic)',
    image: 'Image', included: 'Included (comma-separated)',
    brand: 'Brand', model: 'Model', year: 'Year',
    transmission: 'Transmission', fuelType: 'Fuel Type', seats: 'Seats',
    luggage: 'Luggage', priceDay: 'Price/Day ($)', priceWeek: 'Price/Week ($)',
    priceMonth: 'Price/Month ($)', featuresComma: 'Features (comma-separated)',
    historicalInfo: 'Historical Info', tourismInfo: 'Tourism Info',
    visitingTips: 'Visiting Tips', visitingTipsAr: 'Visiting Tips (Arabic)',
    nearbyAttractions: 'Nearby Attractions', nearbyAttractionsAr: 'Nearby Attractions (Arabic)',
    historicalInfoAr: 'Historical Info (Arabic)',
    tourismInfoAr: 'Tourism Info (Arabic)',
    mapUrl: 'Map URL', yearBuilt: 'Year Built', yearBuiltAr: 'Year Built (Arabic)',
    images: 'Images', noBookings: 'No bookings', loading: 'Loading...',
    noDescription: '(No description)', noHotel: '(No hotel)',
    back: 'Back', itinerary: 'Itinerary',
    homePage: 'Home Page', publicSite: 'Public Site',
    admin: 'Admin',
    saved: 'Saved', deleted: 'Deleted', hotelSaved: 'Hotel saved',
    roomSaved: 'Room saved', tourSaved: 'Tour saved',
    vehicleSaved: 'Vehicle saved', gallerySaved: 'Gallery item saved',
    imageAdded: 'Image added', statusUpdated: 'Status updated',
    updated: 'Updated', settingsSaved: 'Settings saved',
    pageSaved: 'Page saved',     backupCreated: 'Backup created:',
    hotelStats: 'Hotel Statistics',
    tourStats: 'Tour Statistics',
    carStats: 'Car Statistics',
    pendingItems: 'Pending Items',
    totalRooms: 'Total Rooms',
    availableRooms: 'Available',
    bookingsCount: 'Bookings',
    revenueReport: 'Financial Reports',
    monthly: 'Monthly',
    exportBtn: 'Export',
    viewProfile: 'View Profile',
    disableUser: 'Disable',
    enableUser: 'Enable',
    noUsers: 'No users found',
    page: 'Page',
    view: 'View',
    totalRevenue: 'Total Revenue',
    revenueByHotels: 'By Hotels',
    revenueByTours: 'By Tours',
    revenueByCars: 'By Cars',
    tripProgress: 'Trip Progress',
    tripProgressManage: 'Manage Trip Progress',
    manage: 'Manage',
    tour: 'Tour',
    markComplete: 'Mark Complete',
    markIncomplete: 'Mark Incomplete',
    progressUpdated: 'Progress updated',
    noItinerary: 'No itinerary for this tour',
    completedItems: 'Completed',
    remainingItems: 'Remaining',
    overallProgress: 'Overall Progress',
  },
  ar: {
    dashboard: 'لوحة التحكم', hotels: 'الفنادق', rooms: 'الغرف', tours: 'الجولات',
    vehicles: 'السيارات', gallery: 'معرض الصور', bookings: 'الحجوزات', contacts: 'الاستفسارات',
    reviews: 'التقييمات', offers: 'العروض', coupons: 'الكوبونات', users: 'المستخدمين',
    settings: 'الإعدادات', pages: 'الصفحات', cities: 'المدن', logs: 'سجل النشاطات',
    backup: 'نسخ احتياطي', signOut: 'تسجيل خروج', add: 'إضافة', edit: 'تعديل', del: 'حذف',
    save: 'حفظ', cancel: 'إلغاء', confirm: 'تأكيد', search: 'بحث',
    filter: 'فلتر', all: 'الكل', new: 'جديد', pending: 'معلق', confirmed: 'مؤكد',
    completed: 'مكتمل', cancelled: 'ملغي', active: 'نشط', inactive: 'غير نشط',
    actions: 'إجراءات', status: 'الحالة', created: 'تاريخ', total: 'الإجمالي',
    revenue: 'الإيرادات', welcome: 'مرحباً بك في لوحة التحكم',
    email: 'البريد الإلكتروني', phone: 'الهاتف', country: 'الدولة', role: 'الدور',
    // Table headers
    id: 'الرقم', name: 'الاسم', city: 'المدينة', rating: 'التقييم', price: 'السعر',
    ref: 'المرجع', customer: 'العميل', type: 'النوع', date: 'التاريخ',
    // Form labels
    nameAr: 'الاسم (عربي)', cityAr: 'المدينة (عربي)', address: 'العنوان',
    addressAr: 'العنوان (عربي)', rating1_5: 'التقييم (1-5)', price$: 'السعر ($)',
    coverImage: 'صورة الغلاف', amenitiesComma: 'وسائل الراحة (مفصولة بفاصلة)',
    description: 'الوصف', descriptionAr: 'الوصف (عربي)',
    longDescription: 'وصف طويل', longDescriptionAr: 'وصف طويل (عربي)',
    latitude: 'خط العرض', longitude: 'خط الطول', featured: 'مميز',
    hotel: 'الفندق', category: 'الفئة', categoryAr: 'الفئة (عربي)',
    capacity: 'السعة', size: 'المساحة', bedType: 'نوع السرير',
    bedTypeAr: 'نوع السرير (عربي)', servicesComma: 'الخدمات (مفصولة بفاصلة)',
    duration: 'المدة', durationAr: 'المدة (عربي)',
    image: 'الصورة', included: 'يشمل (مفصولة بفاصلة)',
    brand: 'العلامة التجارية', model: 'الموديل', year: 'السنة',
    transmission: 'ناقل الحركة', fuelType: 'نوع الوقود', seats: 'المقاعد',
    luggage: 'الأمتعة', priceDay: 'السعر/يوم ($)', priceWeek: 'السعر/أسبوع ($)',
    priceMonth: 'السعر/شهر ($)', featuresComma: 'الميزات (مفصولة بفاصلة)',
    historicalInfo: 'معلومات تاريخية', historicalInfoAr: 'معلومات تاريخية (إنجليزي)',
    tourismInfo: 'معلومات سياحية', tourismInfoAr: 'معلومات سياحية (إنجليزي)',
    visitingTips: 'نصائح الزيارة', visitingTipsAr: 'نصائح الزيارة (إنجليزي)',
    nearbyAttractions: 'المعالم القريبة', nearbyAttractionsAr: 'المعالم القريبة (إنجليزي)',
    mapUrl: 'رابط الخريطة', yearBuilt: 'عام البناء', yearBuiltAr: 'عام البناء (عربي)',
    // Buttons & misc
    images: 'الصور', noBookings: 'لا توجد حجوزات', loading: 'جار التحميل...',
    noDescription: '(بدون وصف)', noHotel: '(بدون فندق)',
    back: 'رجوع', itinerary: 'برنامج الرحلة', policies: 'السياسات',
    homePage: 'الصفحة الرئيسية', publicSite: 'الموقع العام',
    admin: 'مدير',
    // Messages
    saved: 'تم الحفظ', deleted: 'تم الحذف', hotelSaved: 'تم حفظ الفندق',
    roomSaved: 'تم حفظ الغرفة', tourSaved: 'تم حفظ الجولة',
    vehicleSaved: 'تم حفظ المركبة', gallerySaved: 'تم حفظ عنصر المعرض',
    imageAdded: 'تمت إضافة الصورة', statusUpdated: 'تم تحديث الحالة',
    updated: 'تم التحديث', settingsSaved: 'تم حفظ الإعدادات',
    pageSaved: 'تم حفظ الصفحة',     backupCreated: 'تم إنشاء النسخة الاحتياطية:',
    hotelStats: 'إحصائيات الفنادق',
    tourStats: 'إحصائيات الجولات',
    carStats: 'إحصائيات السيارات',
    pendingItems: 'العناصر المعلقة',
    totalRooms: 'إجمالي الغرف',
    availableRooms: 'متاح',
    bookingsCount: 'الحجوزات',
    revenueReport: 'التقارير المالية',
    monthly: 'شهري',
    exportBtn: 'تصدير',
    viewProfile: 'عرض الملف',
    disableUser: 'تعطيل',
    enableUser: 'تفعيل',
    noUsers: 'لا يوجد مستخدمين',
    page: 'صفحة',
    view: 'عرض',
    totalRevenue: 'الإيرادات الإجمالية',
    revenueByHotels: 'من الفنادق',
    revenueByTours: 'من الجولات',
    revenueByCars: 'من السيارات',
    tripProgress: 'تقدم الرحلة',
    tripProgressManage: 'إدارة تقدم الرحلة',
    manage: 'إدارة',
    tour: 'الجولة',
    markComplete: 'إكمال',
    markIncomplete: 'إلغاء الإكمال',
    progressUpdated: 'تم تحديث التقدم',
    noItinerary: 'لا يوجد برنامج رحلة لهذه الجولة',
    completedItems: 'المكتمل',
    remainingItems: 'المتبقي',
    overallProgress: 'التقدم العام',
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

function toggleAdminTheme() {
  const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('syria_theme', theme);
  const btn = document.getElementById('admin-theme-btn') || document.getElementById('admin-theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleAdminLang() {
  currentLang = currentLang === 'en' ? 'ar' : 'en';
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', currentLang);
  if (adminToken) renderAdminDashboard(); else renderAdminLogin();
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
    renderAdminLogin(); return null;
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

function renderAdminLogin() {
  document.querySelector('.header')?.style.removeProperty('display');
  document.getElementById('app').innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;min-height:90vh;padding:24px;">
      <div style="background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-color);padding:40px;width:100%;max-width:440px;position:relative;">
        <button onclick="toggleAdminLang()" style="position:absolute;top:16px;right:16px;padding:6px 14px;border:1px solid var(--border-color);background:var(--bg);color:var(--text-main);border-radius:6px;cursor:pointer;font-size:0.8rem;">🌐 ${currentLang === 'en' ? 'عربي' : 'English'}</button>
        <h1 style="text-align:center;font-family:var(--font-display);margin-bottom:8px;color:var(--gold-primary);">✦ ${currentLang === 'ar' ? 'لوحة التحكم' : 'Control Suite'}</h1>
        <p style="text-align:center;color:var(--text-muted);margin-bottom:24px;">${currentLang === 'ar' ? 'بوابة الدخول الآمنة' : 'Secure Administrative Portal'}</p>
        <form id="admin-login-form" onsubmit="handleAdminLogin(event)">
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

async function handleAdminLogin(e) {
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
    renderAdminDashboard();
  } catch (err) { showMsg(err.message, true); }
}

// Warm up audio context on first user gesture
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

function renderAdminDashboard() {
  if (!adminToken) { renderAdminLogin(); return; }
  document.querySelector('.header')?.style.setProperty('display', 'none');
  document.getElementById('app').innerHTML = `
    <div style="padding:24px;">
      <div id="admin-toolbar" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <h1 style="font-family:var(--font-display);color:var(--gold-primary);font-size:1.5rem;">✦ ${currentLang === 'ar' ? 'لوحة التحكم' : 'Control Suite'}</h1>
          <span style="color:var(--text-muted);font-size:0.85rem;">${currentAdmin?.name || (currentLang === 'ar' ? 'مدير' : 'Admin')}</span>
          <span id="notif-bell" onclick="showNotifPanel()" style="position:relative;cursor:pointer;font-size:1.3rem;margin-left:8px;">🔔<span id="notif-badge" style="position:absolute;top:-6px;right:-8px;background:var(--danger);color:#FFF;font-size:0.65rem;padding:1px 5px;border-radius:10px;min-width:16px;text-align:center;display:none;">0</span></span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
          <button class="admin-nav-btn" onclick="renderAdminDashboard()" data-section="dashboard">${tx('dashboard')}</button>
          <button class="admin-nav-btn" onclick="renderAdminHotels()" data-section="hotels">${tx('hotels')}</button>
          <button class="admin-nav-btn" onclick="renderAdminRooms()" data-section="rooms">${tx('rooms')}</button>
          <button class="admin-nav-btn" onclick="renderAdminTours()" data-section="tours">${tx('tours')}</button>
          <button class="admin-nav-btn" onclick="renderAdminVehicles()" data-section="vehicles">${tx('vehicles')}</button>
          <button class="admin-nav-btn" onclick="renderAdminGallery()" data-section="gallery">${tx('gallery')}</button>
          <button class="admin-nav-btn" onclick="renderGalleryWithTourDates()">📸 ${currentLang === 'ar' ? 'المعرض والجولات' : 'Gallery & Tours'}</button>
          <button class="admin-nav-btn" onclick="renderAdminTripProgressList()" data-section="trip-progress" style="background:#8B5CF6;color:#FFF;">📋 ${currentLang === 'ar' ? 'تقدم الرحلة' : 'Trip Progress'}</button>
          <button class="admin-nav-btn" onclick="renderAdminPayments()" data-section="payments" style="background:var(--success);color:#FFF;">💳 ${currentLang === 'ar' ? 'المدفوعات' : 'Payments'}</button>
          <button class="admin-nav-btn" onclick="renderAdminBookings()" data-section="bookings">${tx('bookings')}</button>
          <button class="admin-nav-btn" onclick="renderAdminContacts()" data-section="contacts">${tx('contacts')}</button>
          <button class="admin-nav-btn" onclick="renderAdminReviews()" data-section="reviews">${tx('reviews')}</button>
          <button class="admin-nav-btn" onclick="renderAdminUsers()" data-section="users">${tx('users')}</button>
          <button class="admin-nav-btn" onclick="renderAdminOffers()" data-section="offers">${tx('offers')}</button>
          <button class="admin-nav-btn" onclick="renderAdminCouponsList()" data-section="coupons" style="background:#F59E0B;color:#000;">🏷️ ${currentLang === 'ar' ? 'كوبونات' : 'Coupons'}</button>
          <button class="admin-nav-btn" onclick="renderAdminPages()" data-section="pages">${tx('pages')}</button>
          <button class="admin-nav-btn" onclick="renderAdminCities()" data-section="cities">${tx('cities')}</button>
          <button class="admin-nav-btn" onclick="renderAdminReports()" data-section="reports" style="background:#8B5CF6;color:#FFF;">📊 ${currentLang === 'ar' ? 'التقارير' : 'Reports'}</button>
          <button class="admin-nav-btn" onclick="toggleAdminTheme()" id="admin-theme-btn" style="background:transparent;">☀️</button>
          <button class="admin-nav-btn" onclick="toggleAdminLang()" style="background:var(--warning);color:#000;">🌐 ${currentLang === 'en' ? 'عربي' : 'EN'}</button>
          <button class="admin-nav-btn" onclick="handleAdminLogout()" style="background:var(--danger);color:#FFF;">${tx('signOut')}</button>
        </div>
      </div>
      <div id="admin-content">
        <div style="text-align:center;padding:40px;"><p style="color:var(--text-muted);">${tx('welcome')}</p></div>
      </div>
    </div>
    <div id="admin-toast" style="display:none;position:fixed;bottom:20px;right:20px;padding:12px 24px;background:#10B981;color:#FFF;border-radius:6px;z-index:2000;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.2);"></div>
    <div id="notif-panel" style="display:none;position:fixed;top:80px;right:24px;width:380px;max-height:500px;overflow-y:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;z-index:1999;box-shadow:0 8px 32px rgba(0,0,0,0.3);padding:16px;direction:${currentLang === 'ar' ? 'rtl' : 'ltr'};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:1rem;">${currentLang === 'ar' ? 'الإشعارات' : 'Notifications'}</h3>
        <button onclick="markNotifAllRead()" style="font-size:0.75rem;background:var(--gold-primary);color:#000;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">${currentLang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}</button>
      </div>
      <div id="notif-list"></div>
    </div>`;
  loadAdminStats();
  connectSocket();
}

// ==================== SOCKET.IO REAL-TIME ENGINE ====================
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
    loadAdminStats();
    // Show system notification via service worker (background tab)
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
      loadAdminStats();
    }
  });
  _adminSocket.on('notifications:count', (cnt) => {
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = cnt; badge.style.display = cnt > 0 ? 'inline' : 'none'; }
  });
  _adminSocket.on('stats:update', () => { loadAdminStats(); });
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
        loadAdminStats();
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
      title: title || 'Syria Travel Admin',
      message: message || '',
      tag: 'admin-notif-' + Date.now()
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

async function loadAdminStats() {
  try {
    const s = await adminRequest('GET', '/stats');
    if (!s) return;
    _lastStats = { ...s };
    document.getElementById('admin-content').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:40px;">
        <div class="stat-card" onclick="renderAdminBookings()" style="cursor:pointer;"><span class="stat-value">${s.total_bookings}</span><span class="stat-label">${tx('total')} ${tx('bookings')}</span></div>
        <div class="stat-card" onclick="renderAdminBookings()" style="cursor:pointer;"><span class="stat-value" style="color:#3B82F6;">${s.new_bookings}</span><span class="stat-label">${tx('new')}</span></div>
        <div class="stat-card" onclick="renderAdminPendingItems()" style="cursor:pointer;"><span class="stat-value" style="color:var(--warning);">${s.pending}</span><span class="stat-label">${tx('pending')}</span></div>
        <div class="stat-card" onclick="renderAdminBookings('confirmed')" style="cursor:pointer;"><span class="stat-value" style="color:var(--success);">${s.confirmed}</span><span class="stat-label">${tx('confirmed')}</span></div>
        <div class="stat-card" onclick="renderAdminBookings('completed')" style="cursor:pointer;"><span class="stat-value" style="color:#059669;">${s.completed}</span><span class="stat-label">${tx('completed')}</span></div>
        <div class="stat-card" onclick="renderAdminBookings('cancelled')" style="cursor:pointer;"><span class="stat-value" style="color:var(--danger);">${s.cancelled}</span><span class="stat-label">${tx('cancelled')}</span></div>
        <div class="stat-card" onclick="renderAdminRevenue()" style="cursor:pointer;"><span class="stat-value">$${s.revenue}</span><span class="stat-label">${tx('revenue')}</span></div>
        <div class="stat-card" onclick="renderAdminHotelStats()" style="cursor:pointer;"><span class="stat-value">${s.total_hotels}</span><span class="stat-label">${tx('hotels')}</span></div>
        <div class="stat-card" onclick="renderAdminTourStats()" style="cursor:pointer;"><span class="stat-value">${s.total_tours}</span><span class="stat-label">${tx('tours')}</span></div>
        <div class="stat-card" onclick="renderAdminCarStats()" style="cursor:pointer;"><span class="stat-value">${s.total_vehicles}</span><span class="stat-label">${tx('vehicles')}</span></div>
        <div class="stat-card" onclick="renderAdminContacts()" style="cursor:pointer;"><span class="stat-value">${s.total_inquiries}</span><span class="stat-label">${tx('contacts')}</span></div>
        <div class="stat-card" onclick="renderAdminReviews()" style="cursor:pointer;"><span class="stat-value">${s.total_reviews}${s.pending_reviews > 0 ? ` <span style="font-size:0.7rem;color:var(--warning);">(${s.pending_reviews})</span>` : ''}</span><span class="stat-label">${tx('reviews')}</span></div>
        <div class="stat-card" onclick="renderAdminUsers()" style="cursor:pointer;"><span class="stat-value">${s.total_users}</span><span class="stat-label">${tx('users')}</span></div>
      </div>
      <div style="background:var(--bg-card);border-radius:12px;border:1px solid var(--border-color);padding:24px;">
        <h3 style="margin-bottom:16px;">${currentLang === 'ar' ? 'آخر الحجوزات' : 'Recent Bookings'}</h3>
        <div id="recent-bookings-table"></div>
      </div>`;
    loadAdminRecentBookings();
  } catch (err) { showMsg(err.message, true); }
}

async function loadAdminRecentBookings() {
  try {
    const d = await adminRequest('GET', '/bookings?limit=10');
    if (!d) return;
    const el = document.getElementById('recent-bookings-table');
    if (!d.bookings || d.bookings.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);">' + tx('noBookings') + '</p>'; return; }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${tx('ref')}</th><th style="padding:8px;">${tx('customer')}</th><th style="padding:8px;">${tx('type')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('date')}</th></tr></thead>
      <tbody>${d.bookings.map(b => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;font-weight:600;">#${b.booking_ref || b.id}</td>
        <td style="padding:8px;">${b.customer_name}</td>
        <td style="padding:8px;">${b.booking_type}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${(b.status||'').toLowerCase()}">${b.status}</span></td>
        <td style="padding:8px;color:var(--text-muted);font-size:0.85rem;">${b.created_at || ''}</td>
      </tr>`).join('')}</tbody></table>`;
  } catch (err) {}
}

// ============ ADMIN: HOTELS ============
async function renderAdminHotels() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('hotels')}</h2></div><button class="admin-btn admin-btn--primary" onclick="renderAdminHotelForm()">+ ${tx('add')}</button></div>
    <div id="admin-hotels-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/hotels');
    if (!d) return;
    const el = document.getElementById('admin-hotels-list');
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('city')}</th><th style="padding:8px;">${tx('rating')}</th><th style="padding:8px;">${tx('price')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${(d.hotels || []).map(h => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;">${h.id}</td>
        <td style="padding:8px;font-weight:600;">${h.name}</td>
        <td style="padding:8px;">${h.city || ''}</td>
        <td style="padding:8px;">${'★'.repeat(h.rating)}</td>
        <td style="padding:8px;">$${h.price}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${h.status||'active'}">${h.status||'active'}</span></td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="renderAdminHotelForm(${h.id})">${tx('edit')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteHotel(${h.id})">${tx('del')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--secondary" onclick="renderAdminHotelImages(${h.id})">${tx('images')}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminHotelForm(id = null) {
  let hotel = { name: '', name_ar: '', city: '', city_ar: '', address: '', address_ar: '', rating: 5, price: 0, cover_image: '', desc: '', desc_ar: '', long_desc: '', long_desc_ar: '', amenities: '', lat: 0, lng: 0, featured: 0 };
  if (id) {
    const d = await adminRequest('GET', '/hotels');
    if (d) hotel = (d.hotels || []).find(h => h.id === id) || hotel;
  }
  document.getElementById('admin-content').innerHTML = `
    <h2 style="margin-bottom:20px;">${id ? tx('edit') : tx('add')} ${tx('hotels')}</h2>
    <form id="admin-hotel-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;" onsubmit="saveHotel(event, ${id || 'null'})">
      <div><label>${tx('name')}</label><input class="admin-input" name="name" value="${hotel.name}" required></div>
      <div><label>${tx('nameAr')}</label><input class="admin-input" name="name_ar" value="${hotel.name_ar || ''}"></div>
      <div><label>${tx('city')}</label><input class="admin-input" name="city" value="${hotel.city || ''}"></div>
      <div><label>${tx('cityAr')}</label><input class="admin-input" name="city_ar" value="${hotel.city_ar || ''}"></div>
      <div><label>${tx('address')}</label><input class="admin-input" name="address" value="${hotel.address || ''}"></div>
      <div><label>${tx('addressAr')}</label><input class="admin-input" name="address_ar" value="${hotel.address_ar || ''}"></div>
      <div><label>${tx('rating1_5')}</label><input class="admin-input" name="rating" type="number" min="1" max="5" value="${hotel.rating}"></div>
      <div><label>${tx('price$')}</label><input class="admin-input" name="price" type="number" step="0.01" value="${hotel.price}"></div>
      <div><label>${tx('coverImage')}</label><div style="display:flex;gap:8px;"><input class="admin-input img-upload" name="cover_image" value="${hotel.cover_image || ''}" style="flex:1;"></div></div>
      <div style="grid-column:1/-1;"><label>${tx('amenitiesComma')}</label><input class="admin-input" name="amenities" value="${Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : hotel.amenities}"></div>
      <div style="grid-column:1/-1;"><label>${tx('description')}</label><textarea class="admin-input" name="desc" rows="2">${hotel.desc || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('descriptionAr')}</label><textarea class="admin-input" name="desc_ar" rows="2">${hotel.desc_ar || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('longDescription')}</label><textarea class="admin-input" name="long_desc" rows="3">${hotel.long_desc || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('longDescriptionAr')}</label><textarea class="admin-input" name="long_desc_ar" rows="3">${hotel.long_desc_ar || ''}</textarea></div>
      <div><label>${tx('latitude')}</label><input class="admin-input" name="lat" type="number" step="any" value="${hotel.lat || 0}"></div>
      <div><label>${tx('longitude')}</label><input class="admin-input" name="lng" type="number" step="any" value="${hotel.lng || 0}"></div>
      <div><label><input type="checkbox" name="featured" ${hotel.featured ? 'checked' : ''}> ${tx('featured')}</label></div>
      <div style="grid-column:1/-1;display:flex;gap:12px;">
          <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
          <button class="admin-btn" type="button" onclick="renderAdminHotels()">${tx('back')}</button></div>
      </form>`;
  initUploadButtons();
}

async function saveHotel(e, id) {
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.name.value, name_ar: f.name_ar.value, city: f.city.value, city_ar: f.city_ar.value,
    address: f.address.value, address_ar: f.address_ar.value, rating: parseInt(f.rating.value),
    price: parseFloat(f.price.value), cover_image: f.cover_image.value,
    desc: f.desc.value, desc_ar: f.desc_ar.value, long_desc: f.long_desc.value, long_desc_ar: f.long_desc_ar.value,
    amenities: f.amenities.value.split(',').map(s => s.trim()).filter(Boolean),
    lat: parseFloat(f.lat.value) || 0, lng: parseFloat(f.lng.value) || 0, featured: f.featured.checked ? 1 : 0
  };
  try {
    if (id) await adminRequest('PUT', `/hotels/${id}`, data);
    else await adminRequest('POST', '/hotels', data);
    showMsg(tx('hotelSaved'));
    renderAdminHotels();
  } catch (err) { showMsg(err.message, true); }
}

async function deleteHotel(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذا الفندق؟' : 'Delete this hotel?')) return;
  try { await adminRequest('DELETE', `/hotels/${id}`); showMsg(tx('deleted')); renderAdminHotels(); }
  catch (err) { showMsg(err.message, true); }
}

async function renderAdminHotelImages(hotelId) {
  document.getElementById('admin-content').innerHTML = `<h2 style="margin-bottom:20px;">${currentLang === 'ar' ? 'صور الفندق' : 'Hotel Images'}</h2>
    <div style="margin-bottom:16px;">
      <input type="text" class="admin-input img-upload" id="hotel-img-url" placeholder="${currentLang === 'ar' ? 'رابط الصورة' : 'Image URL'}" style="width:300px;">
      <input type="text" class="admin-input" id="hotel-img-title" placeholder="${currentLang === 'ar' ? 'العنوان' : 'Title'}" style="width:200px;">
      <button class="admin-btn admin-btn--primary" onclick="addHotelImage(${hotelId})">${currentLang === 'ar' ? 'إضافة صورة' : 'Add Image'}</button>
      <button class="admin-btn" onclick="renderAdminHotels()">${tx('back')}</button>
    </div>
    <div id="hotel-images-list">${tx('loading')}</div>`;
  initUploadButtons();
  try {
    const d = await adminRequest('GET', `/hotels/${hotelId}/images`);
    if (!d) return;
    const el = document.getElementById('hotel-images-list');
    el.innerHTML = (d.images || []).map(img => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:8px;border:1px solid var(--border-color);border-radius:6px;">
        <img src="${img.image}" style="width:80px;height:60px;object-fit:cover;border-radius:4px;">
        <span>${img.title || ''}</span>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteHotelImage(${img.id})">${tx('del')}</button>
      </div>`).join('') || '<p>No images</p>';
  } catch (err) { showMsg(err.message, true); }
}

async function addHotelImage(hotelId) {
  const url = document.getElementById('hotel-img-url').value;
  const title = document.getElementById('hotel-img-title').value;
  if (!url) return;
  try {
    await adminRequest('POST', `/hotels/${hotelId}/images`, { images: [{ image: url, title }] });
    showMsg(tx('imageAdded'));
    renderAdminHotelImages(hotelId);
  } catch (err) { showMsg(err.message, true); }
}

async function deleteHotelImage(id) {
  try { await adminRequest('DELETE', `/hotel-images/${id}`); showMsg(tx('deleted')); renderAdminHotelImages(document.querySelector('[data-hotel-id]')?.dataset?.hotelId || 0); }
  catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: ROOMS ============
async function renderAdminRooms() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('rooms')}</h2></div><button class="admin-btn admin-btn--primary" onclick="renderAdminRoomForm()">+ ${tx('add')}</button></div>
    <div id="admin-rooms-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/rooms');
    if (!d) return;
    const el = document.getElementById('admin-rooms-list');
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
         <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('hotel')}</th><th style="padding:8px;">${tx('category')}</th><th style="padding:8px;">${tx('price')}</th><th style="padding:8px;">${tx('capacity')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${(d.rooms || []).map(r => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;">${r.id}</td>
        <td style="padding:8px;font-weight:600;">${r.name}</td>
        <td style="padding:8px;">${r.hotel_name || ''}</td>
        <td style="padding:8px;">${r.category || ''}</td>
        <td style="padding:8px;">$${r.price}</td>
        <td style="padding:8px;">${r.capacity}</td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="renderAdminRoomForm(${r.id})">${tx('edit')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRoom(${r.id})">${tx('del')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--secondary" onclick="renderAdminRoomImages(${r.id})">${tx('images')}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminRoomForm(id = null) {
  let room = { hotel_id: '', name: '', name_ar: '', category: '', category_ar: '', capacity: 2, size: '', bed_type: '', bed_type_ar: '', price: 0, description: '', description_ar: '', services: '', amenities: '' };
  if (id) {
    const d = await adminRequest('GET', '/rooms');
    if (d) room = (d.rooms || []).find(r => r.id === id) || room;
  }
  try {
    const hotels = await adminRequest('GET', '/hotels');
    const hotelOpts = (hotels?.hotels || []).map(h => `<option value="${h.id}" ${room.hotel_id == h.id ? 'selected' : ''}>${h.name}</option>`).join('');
    document.getElementById('admin-content').innerHTML = `
      <h2 style="margin-bottom:20px;">${id ? tx('edit') : tx('add')} ${tx('rooms')}</h2>
      <form id="admin-room-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;" onsubmit="saveRoom(event, ${id || 'null'})">
        <div><label>${tx('hotel')}</label><select class="admin-input" name="hotel_id" required>${hotelOpts}</select></div>
        <div><label>${tx('name')}</label><input class="admin-input" name="name" value="${room.name}" required></div>
        <div><label>${tx('nameAr')}</label><input class="admin-input" name="name_ar" value="${room.name_ar || ''}"></div>
        <div><label>${tx('category')}</label><input class="admin-input" name="category" value="${room.category || ''}"></div>
        <div><label>${tx('categoryAr')}</label><input class="admin-input" name="category_ar" value="${room.category_ar || ''}"></div>
        <div><label>${tx('capacity')}</label><input class="admin-input" name="capacity" type="number" value="${room.capacity}"></div>
        <div><label>${tx('size')}</label><input class="admin-input" name="size" value="${room.size || ''}"></div>
        <div><label>${tx('bedType')}</label><input class="admin-input" name="bed_type" value="${room.bed_type || ''}"></div>
        <div><label>${tx('bedTypeAr')}</label><input class="admin-input" name="bed_type_ar" value="${room.bed_type_ar || ''}"></div>
        <div><label>${tx('price$')}</label><input class="admin-input" name="price" type="number" step="0.01" value="${room.price}"></div>
        <div style="grid-column:1/-1;"><label>${tx('description')}</label><textarea class="admin-input" name="description" rows="2">${room.description || ''}</textarea></div>
        <div style="grid-column:1/-1;"><label>${tx('descriptionAr')}</label><textarea class="admin-input" name="description_ar" rows="2">${room.description_ar || ''}</textarea></div>
        <div style="grid-column:1/-1;"><label>${tx('servicesComma')}</label><input class="admin-input" name="services" value="${Array.isArray(room.services) ? room.services.join(', ') : room.services}"></div>
        <div style="grid-column:1/-1;"><label>${tx('amenitiesComma')}</label><input class="admin-input" name="amenities" value="${Array.isArray(room.amenities) ? room.amenities.join(', ') : room.amenities}"></div>
        <div style="grid-column:1/-1;display:flex;gap:12px;">
          <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
          <button class="admin-btn" type="button" onclick="renderAdminRooms()">${tx('back')}</button></div>
      </form>`;
  } catch (err) { showMsg(err.message, true); }
}

async function saveRoom(e, id) {
  e.preventDefault();
  const f = e.target;
  const data = {
    hotel_id: parseInt(f.hotel_id.value), name: f.name.value, name_ar: f.name_ar.value,
    category: f.category.value, category_ar: f.category_ar.value, capacity: parseInt(f.capacity.value),
    size: f.size.value, bed_type: f.bed_type.value, bed_type_ar: f.bed_type_ar.value,
    price: parseFloat(f.price.value), description: f.description.value, description_ar: f.description_ar.value,
    services: f.services.value.split(',').map(s => s.trim()).filter(Boolean),
    amenities: f.amenities.value.split(',').map(s => s.trim()).filter(Boolean)
  };
  try {
    if (id) await adminRequest('PUT', `/rooms/${id}`, data);
    else await adminRequest('POST', '/rooms', data);
    showMsg(tx('roomSaved'));
    renderAdminRooms();
  } catch (err) { showMsg(err.message, true); }
}

async function deleteRoom(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذه الغرفة؟' : 'Delete this room?')) return;
  try { await adminRequest('DELETE', `/rooms/${id}`); showMsg(tx('deleted')); renderAdminRooms(); }
  catch (err) { showMsg(err.message, true); }
}

async function renderAdminRoomImages(roomId) {
  document.getElementById('admin-content').innerHTML = `<h2 style="margin-bottom:20px;">${currentLang === 'ar' ? 'صور الغرفة' : 'Room Images'}</h2>
    <div style="margin-bottom:16px;">
      <input type="text" class="admin-input img-upload" id="room-img-url" placeholder="${currentLang === 'ar' ? 'رابط الصورة' : 'Image URL'}" style="width:300px;">
      <input type="text" class="admin-input" id="room-img-title" placeholder="${currentLang === 'ar' ? 'العنوان' : 'Title'}" style="width:150px;">
      <input type="text" class="admin-input" id="room-img-desc" placeholder="${currentLang === 'ar' ? 'الوصف' : 'Description'}" style="width:200px;">
      <button class="admin-btn admin-btn--primary" onclick="addRoomImage(${roomId})">${currentLang === 'ar' ? 'إضافة صورة' : 'Add Image'}</button>
      <button class="admin-btn" onclick="renderAdminRooms()">${tx('back')}</button>
    </div>
    <div id="room-images-list" data-room-id="${roomId}">${tx('loading')}</div>`;
  initUploadButtons();
  try {
    const d = await adminRequest('GET', `/rooms/${roomId}/images`);
    const images = d.images || [];
    const el = document.getElementById('room-images-list');
    el.innerHTML = images.map(img => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:8px;border:1px solid var(--border-color);border-radius:6px;">
        <img src="${img.image}" style="width:80px;height:60px;object-fit:cover;border-radius:4px;">
        <span>${img.title || ''}</span>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRoomImage(${img.id})">${tx('del')}</button>
      </div>`).join('') || '<p>' + (currentLang === 'ar' ? 'لا توجد صور' : 'No images') + '</p>';
  } catch (err) { showMsg(err.message, true); }
}

async function addRoomImage(roomId) {
  const url = document.getElementById('room-img-url').value;
  const title = document.getElementById('room-img-title').value;
  const desc = document.getElementById('room-img-desc').value;
  if (!url) return;
  try {
    await adminRequest('POST', `/rooms/${roomId}/images`, { images: [{ image: url, title, description: desc }] });
    showMsg(tx('imageAdded'));
    renderAdminRoomImages(roomId);
  } catch (err) { showMsg(err.message, true); }
}

async function deleteRoomImage(id) {
  try { await adminRequest('DELETE', `/room-images/${id}`); showMsg(tx('deleted')); const el = document.getElementById('room-images-list'); const rid = el?.dataset?.roomId; if (rid) renderAdminRoomImages(rid); }
  catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: TOURS ============
async function renderAdminTours() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('tours')}</h2></div><button class="admin-btn admin-btn--primary" onclick="renderAdminTourForm()">+ ${tx('add')}</button></div>
    <div id="admin-tours-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/tours');
    if (!d) return;
    const el = document.getElementById('admin-tours-list');
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
         <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('duration')}</th><th style="padding:8px;">${tx('price')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${(d.tours || []).map(t => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;">${t.id}</td>
        <td style="padding:8px;font-weight:600;">${t.name}</td>
        <td style="padding:8px;">${t.duration}</td>
        <td style="padding:8px;">$${t.price}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${t.status||'active'}">${t.status||'active'}</span></td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="renderAdminTourForm(${t.id})">${tx('edit')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteTour(${t.id})">${tx('del')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--secondary" onclick="renderAdminTourItinerary(${t.id})">${currentLang === 'ar' ? 'برنامج الرحلة' : 'Itinerary'}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminTourForm(id = null) {
  let tour = { name: '', name_ar: '', duration: '', duration_ar: '', price: 0, image: '', description: '', description_ar: '', featured: 0 };
  if (id) {
    const d = await adminRequest('GET', '/tours');
    if (d) tour = (d.tours || []).find(t => t.id === id) || tour;
  }
  document.getElementById('admin-content').innerHTML = `
    <h2 style="margin-bottom:20px;">${id ? tx('edit') : tx('add')} ${tx('tours')}</h2>
    <form id="admin-tour-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;" onsubmit="saveTour(event, ${id || 'null'})">
      <div><label>${tx('name')}</label><input class="admin-input" name="name" value="${tour.name}" required></div>
      <div><label>${tx('nameAr')}</label><input class="admin-input" name="name_ar" value="${tour.name_ar || ''}"></div>
      <div><label>${tx('duration')}</label><input class="admin-input" name="duration" value="${tour.duration || ''}"></div>
      <div><label>${tx('durationAr')}</label><input class="admin-input" name="duration_ar" value="${tour.duration_ar || ''}"></div>
      <div><label>${tx('price$')}</label><input class="admin-input" name="price" type="number" step="0.01" value="${tour.price}"></div>
      <div><label>${tx('image')}</label><input class="admin-input img-upload" name="image" value="${tour.image || ''}"></div>
      <div><label><input type="checkbox" name="featured" ${tour.featured ? 'checked' : ''}> ${tx('featured')}</label></div>
      <div style="grid-column:1/-1;"><label>${tx('description')}</label><textarea class="admin-input" name="description" rows="3">${tour.description || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('descriptionAr')}</label><textarea class="admin-input" name="description_ar" rows="3">${tour.description_ar || ''}</textarea></div>
      <div style="grid-column:1/-1;display:flex;gap:12px;">
        <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
        <button class="admin-btn" type="button" onclick="renderAdminTours()">${tx('back')}</button></div>
    </form>`;
  initUploadButtons();
}

async function saveTour(e, id) {
  e.preventDefault();
  const f = e.target;
  const data = { name: f.name.value, name_ar: f.name_ar.value, duration: f.duration.value, duration_ar: f.duration_ar.value, price: parseFloat(f.price.value), image: f.image.value, description: f.description.value, description_ar: f.description_ar.value, featured: f.featured.checked ? 1 : 0, included: [], included_ar: [] };
  try {
    if (id) await adminRequest('PUT', `/tours/${id}`, data);
    else await adminRequest('POST', '/tours', data);
    showMsg(tx('tourSaved'));
    renderAdminTours();
  } catch (err) { showMsg(err.message, true); }
}

async function deleteTour(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذه الجولة؟' : 'Delete this tour?')) return;
  try { await adminRequest('DELETE', `/tours/${id}`); showMsg(tx('deleted')); renderAdminTours(); }
  catch (err) { showMsg(err.message, true); }
}

async function renderAdminTourItinerary(tourId) {
  document.getElementById('admin-content').innerHTML = `<h2 style="margin-bottom:20px;">${tx('itinerary')}</h2>
    <div id="tour-itinerary-form"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', `/tours`);
    const tour = (d.tours || []).find(t => t.id == tourId);
    if (!tour) return;
    let html = `<form id="itinerary-form" onsubmit="saveTourItinerary(event, ${tourId})">`;
    for (let i = 1; i <= 7; i++) {
      const it = (tour.itinerary || []).find(x => x.day == i);
      html += `<div style="border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px;">
        <h4>${currentLang === 'ar' ? 'اليوم' : 'Day'} ${i}</h4>
        <input class="admin-input" name="day${i}_title" placeholder="${currentLang === 'ar' ? 'العنوان' : 'Title'}" value="${it?.title || ''}" style="margin-top:8px;">
        <input class="admin-input" name="day${i}_title_ar" placeholder="${currentLang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}" value="${it?.title_ar || ''}">
      </div>`;
    }
    html += `<button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
      <button class="admin-btn" type="button" onclick="renderAdminTours()">${tx('back')}</button></form>`;
    document.getElementById('tour-itinerary-form').innerHTML = html;
  } catch (err) { showMsg(err.message, true); }
}

async function saveTourItinerary(e, tourId) {
  e.preventDefault();
  const f = e.target;
  const itinerary = [];
  for (let i = 1; i <= 7; i++) {
    const title = f[`day${i}_title`]?.value;
    const titleAr = f[`day${i}_title_ar`]?.value;
    if (title || titleAr) itinerary.push({ day: i, title: title || '', title_ar: titleAr || '' });
  }
  try {
    await adminRequest('POST', `/tours/${tourId}/itinerary`, { itinerary });
    showMsg(currentLang === 'ar' ? 'تم حفظ البرنامج' : 'Itinerary saved');
    renderAdminTours();
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: VEHICLES ============
async function renderAdminVehicles() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('vehicles')}</h2></div><button class="admin-btn admin-btn--primary" onclick="renderAdminVehicleForm()">+ ${tx('add')}</button></div>
    <div id="admin-vehicles-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/vehicles');
    if (!d) return;
    const el = document.getElementById('admin-vehicles-list');
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
         <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('brand')}</th><th style="padding:8px;">${tx('model')}</th><th style="padding:8px;">${tx('priceDay')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${(d.vehicles || []).map(v => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;">${v.id}</td>
        <td style="padding:8px;font-weight:600;">${v.name}</td>
        <td style="padding:8px;">${v.brand}</td>
        <td style="padding:8px;">${v.model}</td>
        <td style="padding:8px;">$${v.price_per_day}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${v.status||'active'}">${v.status||'active'}</span></td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="renderAdminVehicleForm(${v.id})">${tx('edit')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteVehicle(${v.id})">${tx('del')}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminVehicleForm(id = null) {
  let v = { name: '', name_ar: '', brand: '', model: '', year: 2024, transmission: '', fuel_type: '', seats: 5, luggage: 3, price_per_day: 0, price_per_week: 0, price_per_month: 0, image: '', features: '', features_ar: '', featured: 0 };
  if (id) {
    const d = await adminRequest('GET', '/vehicles');
    if (d) v = (d.vehicles || []).find(x => x.id === id) || v;
  }
  document.getElementById('admin-content').innerHTML = `
    <h2 style="margin-bottom:20px;">${id ? tx('edit') : tx('add')} ${tx('vehicles')}</h2>
    <form id="admin-vehicle-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;" onsubmit="saveVehicle(event, ${id || 'null'})">
      <div><label>${tx('name')}</label><input class="admin-input" name="name" value="${v.name}" required></div>
      <div><label>${tx('nameAr')}</label><input class="admin-input" name="name_ar" value="${v.name_ar || ''}"></div>
      <div><label>${tx('brand')}</label><input class="admin-input" name="brand" value="${v.brand || ''}"></div>
      <div><label>${tx('model')}</label><input class="admin-input" name="model" value="${v.model || ''}"></div>
      <div><label>${tx('year')}</label><input class="admin-input" name="year" type="number" value="${v.year}"></div>
      <div><label>${tx('transmission')}</label><input class="admin-input" name="transmission" value="${v.transmission || ''}"></div>
      <div><label>${tx('fuelType')}</label><input class="admin-input" name="fuel_type" value="${v.fuel_type || ''}"></div>
      <div><label>${tx('seats')}</label><input class="admin-input" name="seats" type="number" value="${v.seats}"></div>
      <div><label>${tx('luggage')}</label><input class="admin-input" name="luggage" type="number" value="${v.luggage}"></div>
      <div><label>${tx('priceDay')}</label><input class="admin-input" name="price_per_day" type="number" step="0.01" value="${v.price_per_day}"></div>
      <div><label>${tx('priceWeek')}</label><input class="admin-input" name="price_per_week" type="number" step="0.01" value="${v.price_per_week}"></div>
      <div><label>${tx('priceMonth')}</label><input class="admin-input" name="price_per_month" type="number" step="0.01" value="${v.price_per_month}"></div>
      <div><label>${tx('image')}</label><input class="admin-input img-upload" name="image" value="${v.image || ''}"></div>
      <div><label><input type="checkbox" name="featured" ${v.featured ? 'checked' : ''}> ${tx('featured')}</label></div>
      <div style="grid-column:1/-1;"><label>${tx('featuresComma')}</label><input class="admin-input" name="features" value="${Array.isArray(v.features) ? v.features.join(', ') : v.features}"></div>
      <div style="grid-column:1/-1;display:flex;gap:12px;">
        <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
        <button class="admin-btn" type="button" onclick="renderAdminVehicles()">${tx('back')}</button></div>
    </form>`;
  initUploadButtons();
}

async function saveVehicle(e, id) {
  e.preventDefault();
  const f = e.target;
  const data = { name: f.name.value, name_ar: f.name_ar.value, brand: f.brand.value, model: f.model.value, year: parseInt(f.year.value), transmission: f.transmission.value, fuel_type: f.fuel_type.value, seats: parseInt(f.seats.value), luggage: parseInt(f.luggage.value), price_per_day: parseFloat(f.price_per_day.value), price_per_week: parseFloat(f.price_per_week.value), price_per_month: parseFloat(f.price_per_month.value), image: f.image.value, features: f.features.value.split(',').map(s => s.trim()).filter(Boolean), features_ar: [], featured: f.featured.checked ? 1 : 0 };
  try {
    if (id) await adminRequest('PUT', `/vehicles/${id}`, data);
    else await adminRequest('POST', '/vehicles', data);
    showMsg(tx('vehicleSaved'));
    renderAdminVehicles();
  } catch (err) { showMsg(err.message, true); }
}

async function deleteVehicle(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذه المركبة؟' : 'Delete this vehicle?')) return;
  try { await adminRequest('DELETE', `/vehicles/${id}`); showMsg(tx('deleted')); renderAdminVehicles(); }
  catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: GALLERY ============
async function renderAdminGallery() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('gallery')}</h2></div><button class="admin-btn admin-btn--primary" onclick="renderAdminGalleryForm()">+ ${tx('add')}</button></div>
    <div id="admin-gallery-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/gallery');
    if (!d) return;
    const el = document.getElementById('admin-gallery-list');
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
         <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${(d.gallery || []).map(g => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;">${g.id}</td>
        <td style="padding:8px;font-weight:600;">${g.name}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${g.status||'active'}">${g.status||'active'}</span></td>
         <td style="padding:8px;">
           <button class="admin-btn admin-btn--sm" onclick="renderAdminGalleryForm(${g.id})">${tx('edit')}</button>
           <button class="admin-btn admin-btn--sm admin-btn--primary" onclick="renderAdminGalleryImages(${g.id})">${currentLang === 'ar' ? 'صور' : 'Images'}</button>
           <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteGallery(${g.id})">${tx('del')}</button>
         </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminGalleryForm(id = null) {
  let g = { name: '', name_ar: '', cover_image: '', description: '', description_ar: '', historical_info: '', historical_info_ar: '', tourism_info: '', tourism_info_ar: '', visiting_tips: '', visiting_tips_ar: '', nearby_attractions: '', nearby_attractions_ar: '', lat: 0, lng: 0, featured: 0 };
  if (id) {
    const d = await adminRequest('GET', '/gallery');
    if (d) g = (d.gallery || []).find(x => x.id === id) || g;
  }
  document.getElementById('admin-content').innerHTML = `
    <h2 style="margin-bottom:20px;">${id ? tx('edit') : tx('add')} ${tx('gallery')}</h2>
    <form id="admin-gallery-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;" onsubmit="saveGallery(event, ${id || 'null'})">
      <div><label>${tx('name')}</label><input class="admin-input" name="name" value="${g.name}" required></div>
      <div><label>${tx('nameAr')}</label><input class="admin-input" name="name_ar" value="${g.name_ar || ''}"></div>
      <div><label>${tx('coverImage')}</label><input class="admin-input img-upload" name="cover_image" value="${g.cover_image || ''}"></div>
      <div><label><input type="checkbox" name="featured" ${g.featured ? 'checked' : ''}> ${tx('featured')}</label></div>
      <div><label>${tx('latitude')}</label><input class="admin-input" name="lat" type="number" step="any" value="${g.lat || 0}"></div>
      <div><label>${tx('longitude')}</label><input class="admin-input" name="lng" type="number" step="any" value="${g.lng || 0}"></div>
      <div style="grid-column:1/-1;"><label>${tx('description')}</label><textarea class="admin-input" name="description" rows="2">${g.description || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('descriptionAr')}</label><textarea class="admin-input" name="description_ar" rows="2">${g.description_ar || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('historicalInfo')}</label><textarea class="admin-input" name="historical_info" rows="2">${g.historical_info || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('historicalInfoAr')}</label><textarea class="admin-input" name="historical_info_ar" rows="2">${g.historical_info_ar || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('tourismInfo')}</label><textarea class="admin-input" name="tourism_info" rows="2">${g.tourism_info || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('tourismInfoAr')}</label><textarea class="admin-input" name="tourism_info_ar" rows="2">${g.tourism_info_ar || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('visitingTips')}</label><textarea class="admin-input" name="visiting_tips" rows="2">${g.visiting_tips || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('visitingTipsAr')}</label><textarea class="admin-input" name="visiting_tips_ar" rows="2">${g.visiting_tips_ar || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('nearbyAttractions')}</label><textarea class="admin-input" name="nearby_attractions" rows="2">${g.nearby_attractions || ''}</textarea></div>
      <div style="grid-column:1/-1;"><label>${tx('nearbyAttractionsAr')}</label><textarea class="admin-input" name="nearby_attractions_ar" rows="2">${g.nearby_attractions_ar || ''}</textarea></div>
      <div style="grid-column:1/-1;display:flex;gap:16px;">
        <div style="flex:1;"><label>${currentLang === 'ar' ? 'الأنشطة (عربي)' : 'Activities (Arabic)'}</label><textarea class="admin-input" name="activities_ar" rows="2" placeholder="${currentLang === 'ar' ? 'نشاط واحد لكل سطر' : 'One activity per line'}">${Array.isArray(g.activities_ar) ? g.activities_ar.join('\n') : (g.activities_ar || '')}</textarea></div>
        <div style="flex:1;"><label>${currentLang === 'ar' ? 'الأنشطة (إنجليزي)' : 'Activities (English)'}</label><textarea class="admin-input" name="activities" rows="2" placeholder="${currentLang === 'ar' ? 'نشاط واحد لكل سطر' : 'One activity per line'}">${Array.isArray(g.activities) ? g.activities.join('\n') : (g.activities || '')}</textarea></div>
      </div>
      <div style="grid-column:1/-1;display:flex;gap:12px;">
        <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
        <button class="admin-btn" type="button" onclick="renderAdminGallery()">${tx('back')}</button></div>
    </form>`;
  initUploadButtons();
}

async function saveGallery(e, id) {
  e.preventDefault();
  const f = e.target;
  const splitLines = v => v.split('\n').map(s => s.trim()).filter(Boolean);
  const data = {
    name: f.name.value, name_ar: f.name_ar.value,
    cover_image: f.cover_image.value,
    description: f.description.value, description_ar: f.description_ar.value,
    historical_info: f.historical_info.value, historical_info_ar: f.historical_info_ar.value,
    tourism_info: f.tourism_info.value, tourism_info_ar: f.tourism_info_ar.value,
    visiting_tips: f.visiting_tips.value, visiting_tips_ar: f.visiting_tips_ar.value,
    nearby_attractions: f.nearby_attractions.value, nearby_attractions_ar: f.nearby_attractions_ar.value,
    lat: parseFloat(f.lat.value) || 0, lng: parseFloat(f.lng.value) || 0,
    featured: f.featured.checked ? 1 : 0,
    activities: splitLines(f.activities.value),
    activities_ar: splitLines(f.activities_ar.value)
  };
  try {
    if (id) await adminRequest('PUT', `/gallery/${id}`, data);
    else await adminRequest('POST', '/gallery', data);
    showMsg(tx('gallerySaved'));
    renderAdminGallery();
  } catch (err) { showMsg(err.message, true); }
}

async function deleteGallery(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذا العنصر؟' : 'Delete this gallery item?')) return;
  try { await adminRequest('DELETE', `/gallery/${id}`); showMsg(tx('deleted')); renderAdminGallery(); }
  catch (err) { showMsg(err.message, true); }
}

async function renderAdminGalleryImages(galleryId) {
  document.getElementById('admin-content').innerHTML = `<input type="hidden" id="gallery-current-id" value="${galleryId}">
    <h2 style="margin-bottom:20px;">${currentLang === 'ar' ? 'صور المعرض' : 'Gallery Images'}</h2>
    <div style="margin-bottom:16px;">
      <input type="text" class="admin-input img-upload" id="gallery-img-url" placeholder="${currentLang === 'ar' ? 'رابط الصورة' : 'Image URL'}" style="width:300px;">
      <input type="text" class="admin-input" id="gallery-img-title" placeholder="${currentLang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}" style="width:200px;">
      <input type="text" class="admin-input" id="gallery-img-title-ar" placeholder="${currentLang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}" style="width:200px;">
      <button class="admin-btn admin-btn--primary" onclick="addGalleryImage(${galleryId})">${currentLang === 'ar' ? 'إضافة صورة' : 'Add Image'}</button>
      <button class="admin-btn" onclick="renderAdminGallery()">${tx('back')}</button>
    </div>
    <div id="gallery-images-list">${tx('loading')}</div>`;
  initUploadButtons();
  try {
    const d = await adminRequest('GET', `/gallery/${galleryId}/images`);
    if (!d) return;
    const el = document.getElementById('gallery-images-list');
    el.innerHTML = (d.images || []).map(img => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:8px;border:1px solid var(--border-color);border-radius:6px;">
        <img src="${img.image}" style="width:80px;height:60px;object-fit:cover;border-radius:4px;">
        <span>${img.title || img.title_ar || ''}</span>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteGalleryImage(${img.id})">${tx('del')}</button>
      </div>`).join('') || '<p>No images</p>';
  } catch (err) { showMsg(err.message, true); }
}

async function addGalleryImage(galleryId) {
  const url = document.getElementById('gallery-img-url').value;
  const title = document.getElementById('gallery-img-title').value;
  const titleAr = document.getElementById('gallery-img-title-ar').value;
  if (!url) return;
  try {
    await adminRequest('POST', `/gallery/${galleryId}/images`, { images: [{ image: url, title, title_ar: titleAr }] });
    showMsg(tx('imageAdded'));
    renderAdminGalleryImages(galleryId);
  } catch (err) { showMsg(err.message, true); }
}

async function deleteGalleryImage(id) {
  try {
    await adminRequest('DELETE', `/gallery-images/${id}`);
    showMsg(tx('deleted'));
    const el = document.getElementById('gallery-current-id');
    if (el) renderAdminGalleryImages(parseInt(el.value));
  } catch (err) { showMsg(err.message, true); }
}

// ============ GALLERY WITH TOUR DATES ============
async function renderGalleryWithTourDates() {
  const container = document.getElementById('admin-content');
  container.innerHTML = `<h2 style="margin-bottom:24px;">📸 ${currentLang === 'ar' ? 'معرض الصور مع مواعيد الجولات' : 'Gallery & Tour Dates'}</h2>
    <div style="margin-bottom:20px;display:flex;gap:12px;flex-wrap:wrap;">
      <button class="admin-btn" onclick="renderGalleryWithTourDates()" style="background:var(--gold-primary);color:#000;">🖼️ ${currentLang === 'ar' ? 'كل الصور' : 'All Images'}</button>
      <button class="admin-btn" onclick="loadTourDatesView()" style="background:#10b981;color:#fff;">📅 ${currentLang === 'ar' ? 'مواعيد الجولات' : 'Tour Dates'}</button>
    </div>
    <div id="gallery-tour-container"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  
  try {
    const resp = await fetch(api('/api/gallery-full'));
    const data = await resp.json();
    const el = document.getElementById('gallery-tour-container');
    if (!data.gallery || data.gallery.length === 0) {
      el.innerHTML = `<p style="text-align:center;color:var(--text-muted);">${currentLang === 'ar' ? 'لا توجد صور' : 'No gallery images'}</p>`;
      return;
    }
    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;">
      ${data.gallery.map(item => `
        <div style="background:var(--glass-bg);border-radius:12px;overflow:hidden;border:1px solid var(--border-color);">
          <img src="${item.cover_image}" alt="${item.name||item.name_ar||item.item_name||''}" style="width:100%;height:200px;object-fit:cover;" onerror="this.src='/uploads/default.jpg'">
          <div style="padding:12px;">
            <strong style="color:var(--gold-primary);">${item.name_ar || item.name || item.item_name || ''}</strong>
            <span style="display:block;font-size:0.8rem;color:var(--text-muted);margin-top:4px;">${item.item_type || ''} ${item.item_name ? '- ' + item.item_name : ''}</span>
          </div>
        </div>`).join('')}</div>`;
  } catch (err) {
    document.getElementById('gallery-tour-container').innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}

async function loadTourDatesView() {
  const el = document.getElementById('gallery-tour-container');
  el.innerHTML = `<p style="color:var(--text-muted);">${tx('loading')}</p>`;
  try {
    const resp = await fetch(api('/api/tour-dates'));
    const data = await resp.json();
    if (!data.tours || data.tours.length === 0) {
      el.innerHTML = `<p style="text-align:center;color:var(--text-muted);">${currentLang === 'ar' ? 'لا توجد جولات' : 'No tours available'}</p>`;
      return;
    }
    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;">
      ${data.tours.map(tour => {
        const name = currentLang === 'ar' && tour.name_ar ? tour.name_ar : tour.name;
        const city = currentLang === 'ar' && tour.city_ar ? tour.city_ar : tour.city;
        return `<div style="background:var(--glass-bg);border-radius:12px;overflow:hidden;border:1px solid var(--border-color);">
          <img src="${tour.main_image || '/uploads/default.jpg'}" alt="${name}" style="width:100%;height:200px;object-fit:cover;" onerror="this.src='/uploads/default.jpg'">
          <div style="padding:16px;">
            <h3 style="color:var(--gold-primary);margin:0 0 8px;">${name}</h3>
            <div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:6px;">📍 ${city || ''}</div>
            <div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:6px;">🕐 ${tour.duration || ''}</div>
            <div style="font-size:1.1rem;font-weight:700;margin-bottom:12px;">$${tour.price || '0'} <span style="font-size:0.8rem;font-weight:400;color:var(--text-muted);">/person</span></div>
            <div style="margin-bottom:12px;">
              <span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${tour.available_dates > 0 ? '#10b981' : '#ef4444'};color:#fff;font-size:0.85rem;">
                📅 ${tour.available_dates || 0} ${currentLang === 'ar' ? 'موعد متاح' : (tour.available_dates === 1 ? 'date available' : 'dates available')}
              </span>
              ${tour.rating ? `<span style="display:inline-block;margin-left:8px;padding:4px 12px;border-radius:20px;background:#f59e0b;color:#000;font-size:0.85rem;">⭐ ${tour.rating}/5</span>` : ''}
            </div>
            <button class="admin-btn admin-btn--primary" onclick="window.location.href='/#tours'" style="width:100%;">${currentLang === 'ar' ? 'احجز الآن' : 'Book Now'}</button>
          </div>
        </div>`;
      }).join('')}</div>`;
  } catch (err) {
    el.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}

// ============ ADMIN: BOOKINGS ============
async function renderAdminBookings(statusFilter = '') {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
    <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('bookings')}</h2></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input type="text" class="admin-input" id="booking-search" placeholder="${tx('search')}..." style="width:200px;">
      <select class="admin-input" id="booking-filter" style="width:150px;">
        <option value="">${tx('all')}</option>
        <option value="new">${tx('new')}</option>
        <option value="pending">${tx('pending')}</option>
        <option value="confirmed">${tx('confirmed')}</option>
        <option value="completed">${tx('completed')}</option>
        <option value="cancelled">${tx('cancelled')}</option>
      </select>
      <button class="admin-btn admin-btn--primary" onclick="loadAdminBookings()">${tx('search')}</button>
    </div></div>
    <div id="admin-bookings-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  const sel = document.getElementById('booking-filter');
  if (sel && statusFilter) sel.value = statusFilter;
  loadAdminBookings();
}

async function loadAdminBookings() {
  const search = document.getElementById('booking-search')?.value || '';
  const status = document.getElementById('booking-filter')?.value || '';
  let url = '/bookings';
  const params = [];
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (status) params.push(`status=${status}`);
  if (params.length) url += '?' + params.join('&');
  try {
    const d = await adminRequest('GET', url);
    if (!d) return;
    const el = document.getElementById('admin-bookings-list');
    if (!d.bookings || d.bookings.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">' + tx('noBookings') + '</p>'; return; }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${tx('ref')}</th><th style="padding:8px;">${tx('customer')}</th><th style="padding:8px;">Phone</th><th style="padding:8px;">${tx('type')}</th><th style="padding:8px;">Item</th><th style="padding:8px;">${tx('date')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${d.bookings.map(b => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;font-weight:600;">#${b.booking_ref || b.id}</td>
        <td style="padding:8px;">${b.customer_name}</td>
        <td style="padding:8px;">${b.customer_phone || ''}</td>
        <td style="padding:8px;">${b.booking_type}</td>
        <td style="padding:8px;">${b.item_name || ''}</td>
        <td style="padding:8px;font-size:0.85rem;color:var(--text-muted);">${b.created_at || ''}</td>
        <td style="padding:8px;"><select class="admin-input admin-input--sm" onchange="updateBookingStatus(${b.id}, this.value)">
          <option value="new" ${b.status === 'new' ? 'selected' : ''}>${tx('new')}</option>
          <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>${tx('pending')}</option>
          <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>${tx('confirmed')}</option>
          <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>${tx('completed')}</option>
          <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>${tx('cancelled')}</option>
        </select></td>
        <td style="padding:8px;">
          ${b.booking_type === 'tour' ? `<button class="admin-btn admin-btn--sm" onclick="renderAdminTripProgress(${b.id})">${tx('tripProgress')}</button> ` : ''}
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteBooking(${b.id})">${tx('del')}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function updateBookingStatus(id, status) {
  if (!status) return;
  try { await adminRequest('PUT', `/bookings/${id}`, { status }); showMsg(tx('statusUpdated')); loadAdminBookings(); }
  catch (err) { showMsg(err.message, true); }
}

async function deleteBooking(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف هذا الحجز؟' : 'Delete this booking?')) return;
  try { await adminRequest('DELETE', `/bookings/${id}`); showMsg(tx('deleted')); loadAdminBookings(); }
  catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: TRIP PROGRESS ============
async function renderAdminTripProgressList() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>📋 ${tx('tripProgress')}</h2></div>
    <div id="admin-trip-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/bookings?booking_type=tour&status=new,pending,confirmed');
    if (!d) return;
    const el = document.getElementById('admin-trip-list');
    if (!d.bookings || d.bookings.length === 0) {
      el.innerHTML = `<div style="text-align:center;padding:40px;">
        <div style="font-size:3rem;margin-bottom:12px;">🧳</div>
        <p style="color:var(--text-muted);">${currentLang === 'ar' ? 'لا توجد رحلات نشطة' : 'No active trips'}</p>
      </div>`;
      return;
    }
    let html = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${tx('ref')}</th><th style="padding:8px;">${tx('customer')}</th><th style="padding:8px;">${currentLang === 'ar' ? 'البريد' : 'Email'}</th><th style="padding:8px;">${tx('tour')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('overallProgress')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>`;
    for (const b of d.bookings) {
      const prog = await adminRequest('GET', `/trip-progress/${b.id}`).catch(() => null) || {};
      const items = prog.progress || [];
      const total = items.length;
      const done = items.filter(p => p.completed).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const email = prog.booking?.user_email || prog.booking?.customer_email || b.customer_email || '-';
      html += `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;font-weight:600;">#${b.booking_ref || b.id}</td>
        <td style="padding:8px;">${b.customer_name}</td>
        <td style="padding:8px;font-size:0.8rem;color:var(--text-muted);">${email}</td>
        <td style="padding:8px;">${b.item_name || ''}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${(b.status||'').toLowerCase()}">${b.status}</span></td>
        <td style="padding:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;min-width:80px;">
              <div style="height:100%;width:${pct}%;background:var(--gold-primary);border-radius:3px;"></div>
            </div>
            <span style="font-size:0.8rem;color:var(--text-muted);">${done}/${total}</span>
          </div>
        </td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="renderAdminTripProgress(${b.id})">${tx('manage')}</button>
        </td></tr>`;
    }
    html += `</tbody></table>`;
    el.innerHTML = html;
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminTripProgress(bookingId) {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminBookings()">← ${tx('back')}</button><h2>${tx('tripProgressManage')}</h2></div>
    <div id="admin-trip-progress"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', `/trip-progress/${bookingId}`);
    if (!d) return;
    const el = document.getElementById('admin-trip-progress');
    if (!d.progress || d.progress.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('noItinerary')}</p>`;
      return;
    }
    const total = d.progress.length;
    const done = d.progress.filter(p => p.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const email = d.booking?.user_email || d.booking?.customer_email || '-';
    const name = d.booking?.user_name || d.booking?.customer_name || '-';
    let html = `<div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;padding:12px;background:var(--bg-secondary);border-radius:8px;font-size:0.85rem;color:var(--text-muted);">
      <span><strong>${currentLang === 'ar' ? 'الاسم' : 'Name'}:</strong> ${name}</span>
      <span><strong>${currentLang === 'ar' ? 'البريد' : 'Email'}:</strong> ${email}</span>
      <span><strong>${currentLang === 'ar' ? 'الجولة' : 'Tour'}:</strong> ${d.booking?.item_name || ''}</span>
      <span><strong>${currentLang === 'ar' ? 'رقم الحجز' : 'Ref'}:</strong> #${d.booking?.booking_ref || d.booking?.id}</span>
    </div>
    <div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:var(--text-muted);margin-bottom:6px;">
        <span>${tx('overallProgress')}: ${pct}%</span>
        <span>${done}/${total} ${tx('completedItems')}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:var(--success,#059669);border-radius:4px;transition:width 0.3s;"></div>
      </div>
    </div>
    <form id="trip-progress-form" onsubmit="saveAdminTripProgress(event, ${bookingId})">`;
    let curDay = 0;
    for (const p of d.progress) {
      if (p.day !== curDay) {
        if (curDay > 0) html += `</div>`;
        curDay = p.day;
        html += `<div style="margin-bottom:16px;border:1px solid var(--border-color);border-radius:8px;padding:16px;">
          <h4 style="color:var(--gold-primary);margin-bottom:12px;">${currentLang === 'ar' ? 'اليوم' : 'Day'} ${p.day}</h4>`;
      }
      const title = currentLang === 'ar' && p.title_ar ? p.title_ar : p.title;
      html += `<label style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;">
        <input type="checkbox" name="progress_${p.id}" ${p.completed ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--gold-primary);">
        <span style="${p.completed ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${title}</span>
        ${p.completed_at ? `<span style="font-size:0.75rem;color:var(--text-muted);margin-left:auto;">${p.completed_at}</span>` : ''}
      </label>`;
    }
    if (curDay > 0) html += `</div>`;
    html += `<div style="display:flex;gap:12px;margin-top:16px;">
      <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
      <button class="admin-btn" type="button" onclick="renderAdminBookings()">${tx('back')}</button>
    </div></form>`;
    el.innerHTML = html;
  } catch (err) { showMsg(err.message, true); }
}

async function saveAdminTripProgress(e, bookingId) {
  e.preventDefault();
  const f = e.target;
  const items = [];
  f.querySelectorAll('[name^="progress_"]').forEach(chk => {
    const id = parseInt(chk.name.replace('progress_', ''));
    items.push({ id, completed: chk.checked });
  });
  try {
    await adminRequest('PUT', `/trip-progress/${bookingId}`, { items });
    showMsg(tx('progressUpdated'));
    renderAdminTripProgress(bookingId);
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: CONTACTS ============
async function renderAdminContacts() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('contacts')}</h2></div>
    <div id="admin-contacts-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/contacts');
    if (!d) return;
    const el = document.getElementById('admin-contacts-list');
    if (!d.contacts || d.contacts.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);">' + (currentLang === 'ar' ? 'لا توجد استفسارات' : 'No inquiries') + '</p>'; return; }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
         <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">Email</th><th style="padding:8px;">Subject</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('date')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${d.contacts.map(c => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;">${c.id}</td>
        <td style="padding:8px;font-weight:600;">${c.name}</td>
        <td style="padding:8px;">${c.email || ''}</td>
        <td style="padding:8px;">${c.subject || ''}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${(c.status||'new')}">${c.status}</span></td>
        <td style="padding:8px;font-size:0.85rem;color:var(--text-muted);">${c.created_at || ''}</td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="updateContactStatus(${c.id}, 'read')">${currentLang === 'ar' ? 'مقروء' : 'Read'}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteContact(${c.id})">${tx('del')}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function updateContactStatus(id, status) {
  try { await adminRequest('PUT', `/contacts/${id}`, { status }); showMsg(tx('updated')); renderAdminContacts(); }
  catch (err) { showMsg(err.message, true); }
}
async function deleteContact(id) {
  try { await adminRequest('DELETE', `/contacts/${id}`); renderAdminContacts(); }
  catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: REVIEWS ============
async function renderAdminReviews() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('reviews')}</h2></div>
    <div id="admin-reviews-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/reviews');
    if (!d) return;
    const el = document.getElementById('admin-reviews-list');
    el.innerHTML = (d.reviews || []).map(r => `
      <div style="border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div><strong>${r.user_name}</strong> ${'★'.repeat(r.rating)}</div>
          <span class="booking-item__status status--${r.status||'pending'}">${r.status}</span>
        </div>
        <p style="color:var(--text-muted);font-size:0.9rem;">${r.text}</p>
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="admin-btn admin-btn--sm" onclick="updateReviewStatus(${r.id}, 'approved')">${currentLang === 'ar' ? 'موافقة' : 'Approve'}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="updateReviewStatus(${r.id}, 'rejected')">${currentLang === 'ar' ? 'رفض' : 'Reject'}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteReview(${r.id})">${tx('del')}</button>
        </div>
      </div>`).join('') || '<p>' + (currentLang === 'ar' ? 'لا توجد تقييمات' : 'No reviews') + '</p>';
  } catch (err) { showMsg(err.message, true); }
}

async function updateReviewStatus(id, status) {
  try { await adminRequest('PUT', `/reviews/${id}`, { status }); renderAdminReviews(); }
  catch (err) { showMsg(err.message, true); }
}
async function deleteReview(id) {
  try { await adminRequest('DELETE', `/reviews/${id}`); renderAdminReviews(); }
  catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: OFFERS ============
let _offersSectionVisible = true;

async function renderAdminOffers() {
  try {
    const hp = await adminRequest('GET', '/homepage');
    if (hp && hp.offers_visible !== undefined) _offersSectionVisible = hp.offers_visible;
  } catch (e) {}
  const toggleLabel = _offersSectionVisible
    ? (currentLang === 'ar' ? '🔴 إخفاء قسم العروض من الرئيسية' : '🔴 Hide Offers Section')
    : (currentLang === 'ar' ? '🟢 إظهار قسم العروض في الرئيسية' : '🟢 Show Offers Section');
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
    <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('offers')}</h2></div>
    <div style="display:flex;gap:8px;">
      <button class="admin-btn admin-btn--sm" onclick="toggleOffersSection()" style="background:${_offersSectionVisible ? 'var(--danger)' : 'var(--success)'};color:#FFF;border:none;">${toggleLabel}</button>
      <button class="admin-btn admin-btn--primary" onclick="renderAdminOfferForm()">+ ${tx('add')}</button>
    </div></div>
    <div id="admin-offers-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/offers');
    if (!d) return;
    const el = document.getElementById('admin-offers-list');
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
         <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">Title</th><th style="padding:8px;">Discount</th><th style="padding:8px;">Period</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${(d.offers || []).map(o => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;">${o.id}</td>
        <td style="padding:8px;">${o.title}</td>
        <td style="padding:8px;">${o.discount_value}${o.discount_type === 'percentage' ? '%' : '$'}</td>
        <td style="padding:8px;font-size:0.85rem;">${o.start_date || ''} → ${o.end_date || ''}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${o.status||'active'}">${o.status||'active'}</span></td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="renderAdminOfferForm(${o.id})">${tx('edit')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteOffer(${o.id})">${tx('del')}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminOfferForm(id = null) {
  let o = { title: '', title_ar: '', description: '', description_ar: '', discount_type: 'percentage', discount_value: 0, item_type: '', item_id: 0, start_date: '', end_date: '', image: '', status: 'active', sections: ['hotels'] };
  if (id) {
    const d = await adminRequest('GET', '/offers');
    if (d) o = (d.offers || []).find(x => x.id === id) || o;
    if (typeof o.sections === 'string') { try { o.sections = JSON.parse(o.sections); } catch(e) { o.sections = []; } }
  }
  const sections = o.sections || [];
  document.getElementById('admin-content').innerHTML = `<h2>${id ? tx('edit') : tx('add')} ${tx('offers')}</h2>
    <form id="admin-offer-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:20px;" onsubmit="saveOffer(event, ${id || 'null'})">
      <div><label>${currentLang === 'ar' ? 'العنوان' : 'Title'}</label><input class="admin-input" name="title" value="${o.title}" required></div>
      <div><label>${currentLang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label><input class="admin-input" name="title_ar" value="${o.title_ar || ''}"></div>
      <div><label>${currentLang === 'ar' ? 'الصورة' : 'Image'}</label><input class="admin-input img-upload" name="image" value="${o.image || ''}"></div>
      <div><label>${currentLang === 'ar' ? 'الوصف' : 'Description'}</label><textarea class="admin-input" name="description" rows="2">${o.description || ''}</textarea></div>
      <div><label>${currentLang === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</label><textarea class="admin-input" name="description_ar" rows="2">${o.description_ar || ''}</textarea></div>
      <div><label>${currentLang === 'ar' ? 'قيمة الخصم' : 'Discount Value'}</label><input class="admin-input" name="discount_value" type="number" step="0.01" value="${o.discount_value}"></div>
      <div><label>${currentLang === 'ar' ? 'نوع الخصم' : 'Discount Type'}</label><select class="admin-input" name="discount_type"><option value="percentage" ${o.discount_type==='percentage'?'selected':''}>%</option><option value="fixed" ${o.discount_type==='fixed'?'selected':''}>$</option></select></div>
      <div><label>${currentLang === 'ar' ? 'تاريخ البداية' : 'Start Date'}</label><input class="admin-input" name="start_date" type="date" value="${o.start_date || ''}"></div>
      <div><label>${currentLang === 'ar' ? 'تاريخ النهاية' : 'End Date'}</label><input class="admin-input" name="end_date" type="date" value="${o.end_date || ''}"></div>
      <div><label>${tx('status')}</label><select class="admin-input" name="status"><option value="active" ${o.status==='active'?'selected':''}>${tx('active')}</option><option value="inactive" ${o.status==='inactive'?'selected':''}>${tx('inactive')}</option></select></div>
      <div style="grid-column:1/-1;"><label style="display:block;margin-bottom:8px;font-weight:700;">${currentLang === 'ar' ? 'الأقسام المرتبطة (سيظهر للمستخدم عند الضغط على احجز الآن)' : 'Linked Sections (shown to user on Book Now)'}</label>
        <label style="margin-right:20px;"><input type="checkbox" name="section_hotels" value="hotels" ${sections.includes('hotels')?'checked':''}> 🏨 ${tx('hotels')}</label>
        <label style="margin-right:20px;"><input type="checkbox" name="section_tours" value="tours" ${sections.includes('tours')?'checked':''}> 🗺️ ${tx('tours')}</label>
        <label><input type="checkbox" name="section_vehicles" value="vehicles" ${sections.includes('vehicles')?'checked':''}> 🚗 ${tx('vehicles')}</label></div>
      <div style="grid-column:1/-1;display:flex;gap:12px;">
        <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
        <button class="admin-btn" type="button" onclick="renderAdminOffers()">${tx('back')}</button></div>
    </form>`;
  initUploadButtons();
}

async function saveOffer(e, id) {
  e.preventDefault();
  const f = e.target;
  const sections = [];
  if (f.section_hotels?.checked) sections.push('hotels');
  if (f.section_tours?.checked) sections.push('tours');
  if (f.section_vehicles?.checked) sections.push('vehicles');
  const data = {
    title: f.title.value, title_ar: f.title_ar.value,
    image: f.image.value,
    description: f.description.value, description_ar: f.description_ar.value,
    discount_value: parseFloat(f.discount_value.value), discount_type: f.discount_type.value,
    start_date: f.start_date.value, end_date: f.end_date.value,
    status: f.status.value,
    sections
  };
  try {
    if (id) await adminRequest('PUT', `/offers/${id}`, data);
    else await adminRequest('POST', '/offers', data);
    showMsg(tx('saved'));
    renderAdminOffers();
  } catch (err) { showMsg(err.message, true); }
}

async function toggleOffersSection() {
  _offersSectionVisible = !_offersSectionVisible;
  try {
    await adminRequest('POST', '/homepage', { sections: { offers_visible: _offersSectionVisible } });
    showMsg(_offersSectionVisible
      ? (currentLang === 'ar' ? 'تم إظهار قسم العروض في الرئيسية' : 'Offers section is now visible')
      : (currentLang === 'ar' ? 'تم إخفاء قسم العروض من الرئيسية' : 'Offers section is now hidden'));
    renderAdminOffers();
  } catch (err) { showMsg(err.message, true); _offersSectionVisible = !_offersSectionVisible; }
}

async function deleteOffer(id) {
  try { await adminRequest('DELETE', `/offers/${id}`); renderAdminOffers(); }
  catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: PAYMENTS ============
async function renderAdminPayments(filter = '') {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>💳 ${currentLang === 'ar' ? 'إدارة المدفوعات' : 'Payment Management'}</h2></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
      <button class="admin-btn admin-btn--sm ${!filter ? 'admin-btn--primary' : ''}" onclick="renderAdminPayments('')">${currentLang === 'ar' ? 'الكل' : 'All'}</button>
      <button class="admin-btn admin-btn--sm ${filter === 'completed' ? 'admin-btn--primary' : ''}" onclick="renderAdminPayments('completed')" style="${filter === 'completed' ? '' : 'border-color:var(--success);color:var(--success);'}">${currentLang === 'ar' ? 'مكتمل' : 'Completed'}</button>
      <button class="admin-btn admin-btn--sm ${filter === 'pending' ? 'admin-btn--primary' : ''}" onclick="renderAdminPayments('pending')" style="${filter === 'pending' ? '' : 'border-color:var(--warning);color:var(--warning);'}">${currentLang === 'ar' ? 'قيد الانتظار' : 'Pending'}</button>
      <button class="admin-btn admin-btn--sm ${filter === 'failed' ? 'admin-btn--primary' : ''}" onclick="renderAdminPayments('failed')" style="${filter === 'failed' ? '' : 'border-color:var(--danger);color:var(--danger);'}">${currentLang === 'ar' ? 'فشل' : 'Failed'}</button>
      <button class="admin-btn admin-btn--sm ${filter === 'refunded' ? 'admin-btn--primary' : ''}" onclick="renderAdminPayments('refunded')" style="${filter === 'refunded' ? '' : 'border-color:#8B5CF6;color:#8B5CF6;'}">${currentLang === 'ar' ? 'مسترجع' : 'Refunded'}</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding:8px 0;border-top:1px solid var(--border-color);border-bottom:1px solid var(--border-color);">
      <button class="admin-btn admin-btn--sm" onclick="renderAdminBankTransfers()" style="border-color:var(--gold-primary);color:var(--gold-primary);">🏦 ${currentLang === 'ar' ? 'التحويلات البنكية' : 'Bank Transfers'}</button>
      <button class="admin-btn admin-btn--sm" onclick="renderAdminDeposits()" style="border-color:#8B5CF6;color:#8B5CF6;">💰 ${currentLang === 'ar' ? 'الودائع' : 'Deposits'}</button>
      <button class="admin-btn admin-btn--sm" onclick="renderAdminAgentPayments()" style="border-color:var(--success);color:var(--success);">👤 ${currentLang === 'ar' ? 'مدفوعات الوكيل' : 'Agent Payments'}</button>
    </div>
    <div id="admin-payments-list"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  try {
    const q = filter ? `?status=${filter}` : '';
    const d = await adminRequest('GET', `/payments${q}`);
    if (!d) return;
    const el = document.getElementById('admin-payments-list');
    if (!d.payments || d.payments.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'لا توجد مدفوعات' : 'No payments found'}</p>`;
      return;
    }
    el.innerHTML = `
      <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid var(--border-color);font-size:0.8rem;">
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المعرف' : 'ID'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'العميل' : 'Customer'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المبلغ' : 'Amount'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'العملة' : 'Currency'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الطريقة' : 'Method'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الحالة' : 'Status'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'التاريخ' : 'Date'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
        </tr></thead>
        <tbody>${d.payments.map(p => `
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:8px;font-weight:600;">#${p.id}</td>
            <td style="padding:8px;">${p.customer_name || '—'}<br><small style="color:var(--text-muted);font-size:0.75rem;">${p.booking_ref || ''}</small></td>
            <td style="padding:8px;font-weight:600;">${p.amount}</td>
            <td style="padding:8px;">${p.currency || 'USD'}</td>
            <td style="padding:8px;">${p.payment_method || '—'}</td>
            <td style="padding:8px;"><span class="booking-item__status status--${(p.status||'pending').toLowerCase()}">${p.status}</span></td>
            <td style="padding:8px;font-size:0.8rem;color:var(--text-muted)">${p.created_at || ''}</td>
            <td style="padding:8px;">
              ${p.status === 'pending' ? `<button class="admin-btn admin-btn--sm admin-btn--primary" onclick="approvePayment(${p.id})">${currentLang === 'ar' ? 'موافقة' : 'Approve'}</button> <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="rejectPayment(${p.id})">${currentLang === 'ar' ? 'رفض' : 'Reject'}</button>` : ''}
              ${p.status === 'completed' ? `<button class="admin-btn admin-btn--sm" onclick="refundPayment(${p.id})" style="border-color:#8B5CF6;color:#8B5CF6;">${currentLang === 'ar' ? 'استرجاع' : 'Refund'}</button>` : ''}
            </td>
          </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

async function approvePayment(id) {
  if (!confirm(currentLang === 'ar' ? 'تأكيد الموافقة على الدفع؟' : 'Approve this payment?')) return;
  try {
    await adminRequest('PUT', `/payments/${id}/approve`);
    showMsg(currentLang === 'ar' ? 'تمت الموافقة' : 'Approved');
    renderAdminPayments();
  } catch (err) { showMsg(err.message, true); }
}

async function rejectPayment(id) {
  const reason = prompt(currentLang === 'ar' ? 'سبب الرفض:' : 'Rejection reason:');
  if (reason === null) return;
  try {
    await adminRequest('PUT', `/payments/${id}/reject`, { reason: reason || 'No reason' });
    showMsg(currentLang === 'ar' ? 'تم الرفض' : 'Rejected');
    renderAdminPayments();
  } catch (err) { showMsg(err.message, true); }
}

async function refundPayment(id) {
  const reason = prompt(currentLang === 'ar' ? 'سبب الاسترجاع:' : 'Refund reason:');
  if (reason === null) return;
  try {
    await adminRequest('POST', `/payments/${id}/refund`, { reason: reason || 'No reason' });
    showMsg(currentLang === 'ar' ? 'تم الاسترجاع' : 'Refunded');
    renderAdminPayments();
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: BANK TRANSFERS ============
async function renderAdminBankTransfers(filter = '') {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminPayments()">← ${currentLang === 'ar' ? 'رجوع للمدفوعات' : 'Back to Payments'}</button><h2>🏦 ${currentLang === 'ar' ? 'التحويلات البنكية' : 'Bank Transfers'}</h2></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <button class="admin-btn admin-btn--sm ${!filter ? 'admin-btn--primary' : ''}" onclick="renderAdminBankTransfers('')">${currentLang === 'ar' ? 'الكل' : 'All'}</button>
      <button class="admin-btn admin-btn--sm ${filter === 'pending' ? 'admin-btn--primary' : ''}" onclick="renderAdminBankTransfers('pending')" style="${filter === 'pending' ? '' : 'border-color:var(--warning);color:var(--warning);'}">${currentLang === 'ar' ? 'قيد الانتظار' : 'Pending'}</button>
      <button class="admin-btn admin-btn--sm ${filter === 'approved' ? 'admin-btn--primary' : ''}" onclick="renderAdminBankTransfers('approved')" style="${filter === 'approved' ? '' : 'border-color:var(--success);color:var(--success);'}">${currentLang === 'ar' ? 'مقبول' : 'Approved'}</button>
      <button class="admin-btn admin-btn--sm ${filter === 'rejected' ? 'admin-btn--primary' : ''}" onclick="renderAdminBankTransfers('rejected')" style="${filter === 'rejected' ? '' : 'border-color:var(--danger);color:var(--danger);'}">${currentLang === 'ar' ? 'مرفوض' : 'Rejected'}</button>
    </div>
    <div id="admin-bank-transfers-list"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  try {
    const q = filter ? `?status=${filter}` : '';
    const d = await adminRequest('GET', `/bank-transfers${q}`);
    if (!d) return;
    const el = document.getElementById('admin-bank-transfers-list');
    const transfersList = d.bank_transfers || d.transfers || [];
    if (!transfersList.length) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'لا توجد تحويلات بنكية' : 'No bank transfers'}</p>`;
      return;
    }
    el.innerHTML = `
      <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid var(--border-color);font-size:0.8rem;">
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المعرف' : 'ID'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'العميل' : 'Customer'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المبلغ' : 'Amount'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'البنك' : 'Bank'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المُرسل' : 'Sender'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الإيصال' : 'Receipt'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الحالة' : 'Status'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
        </tr></thead>
        <tbody>${transfersList.map(t => `
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:8px;font-weight:600;">#${t.id}</td>
            <td style="padding:8px;">${t.customer_name || '—'}<br><small style="color:var(--text-muted);font-size:0.75rem;">${t.customer_phone || ''}</small></td>
            <td style="padding:8px;font-weight:600;">$${t.amount}</td>
            <td style="padding:8px;">${t.bank_name || '—'}</td>
            <td style="padding:8px;">${t.sender_name || '—'}<br><small style="color:var(--text-muted);font-size:0.75rem;">${t.sender_phone || ''}</small></td>
            <td style="padding:8px;">${t.receipt_url ? `<a href="${t.receipt_url}" target="_blank" style="color:var(--gold-primary);">${currentLang === 'ar' ? 'عرض' : 'View'}</a>` : '—'}</td>
            <td style="padding:8px;"><span class="booking-item__status status--${t.status.toLowerCase()}">${t.status}</span></td>
            <td style="padding:8px;">
              ${t.status === 'pending' ? `<button class="admin-btn admin-btn--sm admin-btn--primary" onclick="approveBankTransfer(${t.id})">${currentLang === 'ar' ? 'موافقة' : 'Approve'}</button> <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="rejectBankTransfer(${t.id})">${currentLang === 'ar' ? 'رفض' : 'Reject'}</button>` : ''}
            </td>
          </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

async function approveBankTransfer(id) {
  if (!confirm(currentLang === 'ar' ? 'تأكيد الموافقة على التحويل البنكي؟' : 'Approve this bank transfer?')) return;
  try {
    await adminRequest('PUT', `/bank-transfers/${id}/approve`);
    showMsg(currentLang === 'ar' ? 'تمت الموافقة على التحويل' : 'Transfer approved');
    renderAdminBankTransfers();
  } catch (err) { showMsg(err.message, true); }
}

async function rejectBankTransfer(id) {
  const reason = prompt(currentLang === 'ar' ? 'سبب الرفض:' : 'Rejection reason:');
  if (reason === null) return;
  try {
    await adminRequest('PUT', `/bank-transfers/${id}/reject`, { reason: reason || 'No reason' });
    showMsg(currentLang === 'ar' ? 'تم رفض التحويل' : 'Transfer rejected');
    renderAdminBankTransfers();
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: DEPOSITS ============
async function renderAdminDeposits() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminPayments()">← ${currentLang === 'ar' ? 'رجوع للمدفوعات' : 'Back to Payments'}</button><h2>💰 ${currentLang === 'ar' ? 'الودائع' : 'Deposits'}</h2></div>
    <div id="admin-deposits-list"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/deposits');
    if (!d) return;
    const el = document.getElementById('admin-deposits-list');
    if (!d.deposits || d.deposits.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'لا توجد ودائع' : 'No deposits'}</p>`;
      return;
    }
    el.innerHTML = `
      <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid var(--border-color);font-size:0.8rem;">
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المعرف' : 'ID'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'العميل' : 'Customer'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الإجمالي' : 'Total'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الوديعة' : 'Deposit'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'النسبة' : 'Pct'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المتبقي' : 'Remaining'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الحالة' : 'Status'}</th>
        </tr></thead>
        <tbody>${d.deposits.map(dp => `
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:8px;font-weight:600;">#${dp.id}</td>
            <td style="padding:8px;">${dp.customer_name || '—'}</td>
            <td style="padding:8px;">$${dp.total_amount}</td>
            <td style="padding:8px;font-weight:600;color:var(--gold-primary);">$${dp.deposit_amount}</td>
            <td style="padding:8px;">${dp.deposit_percentage || 0}%</td>
            <td style="padding:8px;">$${dp.remaining_amount}</td>
            <td style="padding:8px;"><span class="booking-item__status status--${dp.status.toLowerCase()}">${dp.status}</span></td>
          </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: AGENT PAYMENTS ============
async function renderAdminAgentPayments() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminPayments()">← ${currentLang === 'ar' ? 'رجوع للمدفوعات' : 'Back to Payments'}</button><h2>👤 ${currentLang === 'ar' ? 'مدفوعات الوكيل' : 'Agent Payments'}</h2></div>
    <div id="admin-agent-payments-list"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/agent-payments');
    if (!d) return;
    const el = document.getElementById('admin-agent-payments-list');
    if (!d.agent_payments || d.agent_payments.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'لا توجد مدفوعات وكيل' : 'No agent payments'}</p>`;
      return;
    }
    el.innerHTML = `
      <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid var(--border-color);font-size:0.8rem;">
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المعرف' : 'ID'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الوكيل' : 'Agent'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'رقم الوكيل' : 'Agent Phone'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'المبلغ' : 'Amount'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
          <th style="padding:8px;text-align:left;">${currentLang === 'ar' ? 'الحالة' : 'Status'}</th>
        </tr></thead>
        <tbody>${d.agent_payments.map(ap => `
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:8px;font-weight:600;">#${ap.id}</td>
            <td style="padding:8px;">${ap.agent_name || '—'}</td>
            <td style="padding:8px;">${ap.agent_phone || '—'}</td>
            <td style="padding:8px;">$${ap.amount}</td>
            <td style="padding:8px;">${ap.payment_method_confirmed || '—'}</td>
            <td style="padding:8px;"><span class="booking-item__status status--${ap.status.toLowerCase()}">${ap.status}</span></td>
          </tr>`).join('')}</tbody></table></div>`;
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: PAGES ============
async function renderAdminPages() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('pages')}</h2></div>
    <div id="admin-pages-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/pages');
    if (!d) return;
    const el = document.getElementById('admin-pages-list');
    el.innerHTML = (d.pages || []).map(p => `<div style="border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h4>${p.title}</h4>
        <button class="admin-btn admin-btn--sm" onclick="renderAdminPageForm(${p.id})">${tx('edit')}</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label style="font-size:0.8rem;color:var(--text-muted);">${currentLang === 'ar' ? 'إنجليزي' : 'English'}</label>
          <textarea style="width:100%;padding:8px;border:1px solid var(--border-color);background:var(--bg);color:var(--text-main);border-radius:4px;font-size:0.85rem;height:80px;" readonly>${p.content?.replace(/<[^>]*>/g, '').substring(0, 100) || ''}</textarea></div>
        <div><label style="font-size:0.8rem;color:var(--text-muted);">${currentLang === 'ar' ? 'عربي' : 'Arabic'}</label>
          <textarea style="width:100%;padding:8px;border:1px solid var(--border-color);background:var(--bg);color:var(--text-main);border-radius:4px;font-size:0.85rem;height:80px;" readonly>${p.content_ar?.replace(/<[^>]*>/g, '').substring(0, 100) || ''}</textarea></div>
      </div>
    </div>`).join('');
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminPageForm(id) {
  let page = { title: '', title_ar: '', content: '', content_ar: '' };
  const d = await adminRequest('GET', '/pages');
  if (d) page = (d.pages || []).find(p => p.id === id) || page;
  document.getElementById('admin-content').innerHTML = `<h2 style="margin-bottom:20px;">${tx('edit')}: ${page.title}</h2>
    <form id="admin-page-form" onsubmit="saveAdminPage(event, ${id})">
      <div style="margin-bottom:16px;"><label>${currentLang === 'ar' ? 'العنوان' : 'Title'}</label><input class="admin-input" name="title" value="${page.title}" style="width:100%;"></div>
      <div style="margin-bottom:16px;"><label>${currentLang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label><input class="admin-input" name="title_ar" value="${page.title_ar || ''}" style="width:100%;"></div>
      <div style="margin-bottom:16px;"><label>${currentLang === 'ar' ? 'المحتوى (HTML)' : 'Content (HTML)'}</label><textarea class="admin-input" name="content" rows="10" style="width:100%;font-family:monospace;">${(page.content || '').replace(/</g, '&lt;')}</textarea></div>
      <div style="margin-bottom:16px;"><label>${currentLang === 'ar' ? 'المحتوى عربي (HTML)' : 'Content Arabic (HTML)'}</label><textarea class="admin-input" name="content_ar" rows="10" style="width:100%;font-family:monospace;">${(page.content_ar || '').replace(/</g, '&lt;')}</textarea></div>
      <div style="display:flex;gap:12px;">
        <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
        <button class="admin-btn" type="button" onclick="renderAdminPages()">${tx('back')}</button></div>
    </form>`;
}

async function saveAdminPage(e, id) {
  e.preventDefault();
  const f = e.target;
  try {
    await adminRequest('PUT', `/pages/${id}`, { title: f.title.value, title_ar: f.title_ar.value, content: f.content.value, content_ar: f.content_ar.value });
    showMsg(tx('pageSaved'));
    renderAdminPages();
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: CITIES ============
async function renderAdminCities() {
  document.getElementById('admin-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('cities')}</h2></div><button class="admin-btn admin-btn--primary" onclick="renderAdminCityForm()">+ ${tx('add')}</button></div>
    <div id="admin-cities-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/cities');
    if (!d) return;
    const el = document.getElementById('admin-cities-list');
    el.innerHTML = (d.cities || []).map(c => `<div style="display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border-color);border-radius:8px;padding:12px 16px;margin-bottom:8px;">
      <span>${c.name}${c.name_ar ? ' - ' + c.name_ar : ''}</span>
      <div><button class="admin-btn admin-btn--sm" onclick="renderAdminCityForm(${c.id})">${tx('edit')}</button>
      <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteCity(${c.id})">${tx('del')}</button></div>
    </div>`).join('') || '<p>' + (currentLang === 'ar' ? 'لا توجد مدن' : 'No cities') + '</p>';
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminCityForm(id = null) {
  let c = { name: '', name_ar: '', country: 'Syria', image: '', description: '', description_ar: '', activities: [], activities_ar: [] };
  if (id) {
    const d = await adminRequest('GET', '/cities');
    if (d) c = (d.cities || []).find(x => x.id === id) || c;
    try { c.activities = typeof c.activities === 'string' ? JSON.parse(c.activities) : (c.activities || []); } catch(e) { c.activities = []; }
    try { c.activities_ar = typeof c.activities_ar === 'string' ? JSON.parse(c.activities_ar) : (c.activities_ar || []); } catch(e) { c.activities_ar = []; }
  }
  document.getElementById('admin-content').innerHTML = `<h2 style="margin-bottom:20px;">${id ? tx('edit') : tx('add')} ${tx('cities')}</h2>
    <form id="admin-city-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;" onsubmit="saveCity(event, ${id || 'null'})">
      <div><label>${tx('name')}</label><input class="admin-input" name="name" value="${c.name}"></div>
      <div><label>${tx('nameAr')}</label><input class="admin-input" name="name_ar" value="${c.name_ar || ''}"></div>
      <div><label>${currentLang === 'ar' ? 'الدولة' : 'Country'}</label><input class="admin-input" name="country" value="${c.country}"></div>
      <div><label>${tx('image')}</label><input class="admin-input img-upload" name="image" value="${c.image || ''}"></div>
      <div><label>${currentLang === 'ar' ? 'الوصف' : 'Description'}</label><textarea class="admin-input" name="description" rows="2">${c.description || ''}</textarea></div>
      <div><label>${currentLang === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</label><textarea class="admin-input" name="description_ar" rows="2">${c.description_ar || ''}</textarea></div>
      <div><label>${currentLang === 'ar' ? 'الأنشطة (مفصولة بفاصلة)' : 'Activities (comma-separated)'}</label><input class="admin-input" name="activities" value="${(c.activities || []).join(', ')}"></div>
      <div><label>${currentLang === 'ar' ? 'الأنشطة (عربي، مفصولة بفاصلة)' : 'Activities (Arabic, comma-separated)'}</label><input class="admin-input" name="activities_ar" value="${(c.activities_ar || []).join(', ')}"></div>
      <div style="display:flex;gap:12px;grid-column:1/-1;">
        <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
        <button class="admin-btn" type="button" onclick="renderAdminCities()">${tx('back')}</button></div>
    </form>
    ${id ? `<div style="margin-top:24px;border-top:1px solid var(--border-color);padding-top:20px;">
      <h3 style="margin-bottom:16px;">${currentLang === 'ar' ? 'صور المدينة' : 'City Images'}</h3>
      <div id="admin-city-images"><p style="color:var(--text-muted);">${currentLang === 'ar' ? 'تحميل...' : 'Loading...'}</p></div>
      <div style="margin-top:12px;"><input type="file" accept="image/*" id="city-img-upload" multiple>
      <button class="admin-btn admin-btn--primary admin-btn--sm" onclick="uploadCityImages(${id})">${currentLang === 'ar' ? 'رفع الصور' : 'Upload Images'}</button></div>
    </div>` : ''}`;
  initUploadButtons();
  if (id) loadCityImages(id);
}

async function loadCityImages(cityId) {
  try {
    const d = await adminRequest('GET', `/cities/${cityId}/images`);
    const el = document.getElementById('admin-city-images');
    if (!el) return;
    if (!d.images || d.images.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);">${currentLang === 'ar' ? 'لا توجد صور' : 'No images'}</p>`;
      return;
    }
    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">${
      d.images.map(img => `<div style="position:relative;border-radius:8px;overflow:hidden;border:1px solid var(--border-color);">
        <img src="${img.image}" style="width:100%;height:80px;object-fit:cover;display:block;">
        <button onclick="deleteCityImage(${img.id})" style="position:absolute;top:4px;right:4px;background:rgba(239,68,68,0.9);color:#fff;border:none;border-radius:4px;width:22px;height:22px;font-size:12px;cursor:pointer;">✕</button>
      </div>`).join('')
    }</div>`;
  } catch (err) { showMsg(err.message, true); }
}

async function uploadCityImages(cityId) {
  const input = document.getElementById('city-img-upload');
  if (!input || !input.files.length) { showMsg(currentLang === 'ar' ? 'اختر صوراً أولاً' : 'Select images first', true); return; }
  const files = Array.from(input.files);
  const uploaded = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(api('/api/admin/upload'), { method: 'POST', headers: { 'Authorization': 'Bearer ' + adminToken }, body: formData });
      const data = await res.json();
      if (data.url) uploaded.push({ image: data.url, title: '', title_ar: '', sort_order: 0 });
    } catch (err) { showMsg(err.message, true); }
  }
  if (uploaded.length > 0) {
    await adminRequest('POST', `/cities/${cityId}/images`, { images: uploaded });
    showMsg(currentLang === 'ar' ? 'تم رفع الصور' : 'Images uploaded');
    loadCityImages(cityId);
  }
}

async function deleteCityImage(imgId) {
  try {
    await adminRequest('DELETE', `/city-images/${imgId}`);
    showMsg(tx('deleted'));
    const cityId = document.querySelector('#admin-city-form [name="name"]');
    if (cityId) { /* refresh not needed, will reload on next save */ }
  } catch (err) { showMsg(err.message, true); }
}

async function saveCity(e, id) {
  e.preventDefault();
  const f = e.target;
  const parseCSV = (v) => v.split(',').map(s => s.trim()).filter(Boolean);
  const data = {
    name: f.name.value, name_ar: f.name_ar.value, country: f.country.value, image: f.image.value,
    description: f.description.value, description_ar: f.description_ar.value,
    activities: parseCSV(f.activities.value), activities_ar: parseCSV(f.activities_ar.value)
  };
  try {
    if (id) await adminRequest('PUT', `/cities/${id}`, data);
    else await adminRequest('POST', '/cities', data);
    showMsg(tx('saved'));
    renderAdminCities();
  } catch (err) { showMsg(err.message, true); }
}
async function deleteCity(id) {
  try { await adminRequest('DELETE', `/cities/${id}`); renderAdminCities(); }
  catch (err) { showMsg(err.message, true); }
}

function handleAdminLogout() {
  disconnectSocket();
  if (_notifInterval2) clearInterval(_notifInterval2);
  adminToken = null;
  currentAdmin = null;
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  renderAdminLogin();
}

// ============ PAGINATION HELPER ============
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

// ============ ADMIN: USERS ============
async function renderAdminUsers(search = '', page = 1) {
  const limit = 20;
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('users')}</h2></div>
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
          <div><strong>${tx('total')} ${tx('bookings')}:</strong> ${u.bookings_count || 0}</div>
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

// ============ ADMIN: PENDING ITEMS ============
async function renderAdminPendingItems() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('pendingItems')}</h2></div>
    <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--border-color);">
      <button class="admin-btn admin-btn--sm" onclick="switchPendingTab('bookings')" id="pend-tab-bookings" style="border-bottom:2px solid var(--gold-primary);border-radius:0;">${tx('bookings')}</button>
      <button class="admin-btn admin-btn--sm" onclick="switchPendingTab('reviews')" id="pend-tab-reviews" style="border-radius:0;">${tx('reviews')}</button>
      <button class="admin-btn admin-btn--sm" onclick="switchPendingTab('hotels')" id="pend-tab-hotels" style="border-radius:0;">${tx('hotels')}</button>
      <button class="admin-btn admin-btn--sm" onclick="switchPendingTab('tours')" id="pend-tab-tours" style="border-radius:0;">${tx('tours')}</button>
    </div>
    <div id="pending-items-content"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  loadPendingTab('bookings');
}

function switchPendingTab(tab) {
  document.querySelectorAll('[id^="pend-tab-"]').forEach(b => { b.style.borderBottom = '2px solid transparent'; b.style.borderRadius = '0'; });
  const btn = document.getElementById('pend-tab-' + tab);
  if (btn) btn.style.borderBottom = '2px solid var(--gold-primary)';
  loadPendingTab(tab);
}

async function loadPendingTab(tab) {
  try {
    const d = await adminRequest('GET', '/pending-items');
    if (!d) return;
    const el = document.getElementById('pending-items-content');
    if (tab === 'bookings') {
      const items = d.pending_bookings || [];
      if (items.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">' + tx('noBookings') + '</p>'; return; }
      el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
          <th style="padding:8px;">${tx('ref')}</th><th style="padding:8px;">${tx('customer')}</th><th style="padding:8px;">${tx('type')}</th><th style="padding:8px;">Item</th><th style="padding:8px;">${tx('date')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
        <tbody>${items.map(b => `<tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px;font-weight:600;">#${b.booking_ref || b.id}</td>
          <td style="padding:8px;">${b.customer_name}</td>
          <td style="padding:8px;">${b.booking_type}</td>
          <td style="padding:8px;">${b.item_name || ''}</td>
          <td style="padding:8px;font-size:0.85rem;color:var(--text-muted);">${b.created_at || ''}</td>
          <td style="padding:8px;">
            <button class="admin-btn admin-btn--sm admin-btn--primary" onclick="approvePendingBooking(${b.id})">${currentLang === 'ar' ? 'موافقة' : 'Approve'}</button>
            <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="rejectPendingBooking(${b.id})">${currentLang === 'ar' ? 'رفض' : 'Reject'}</button>
            <button class="admin-btn admin-btn--sm" onclick="viewPendingBooking(${b.id})">${tx('view')}</button>
          </td></tr>`).join('')}</tbody></table>`;
    } else if (tab === 'reviews') {
      const items = d.pending_reviews || [];
      if (items.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">' + (currentLang === 'ar' ? 'لا توجد تقييمات معلقة' : 'No pending reviews') + '</p>'; return; }
      el.innerHTML = items.map(r => `
        <div style="border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div><strong>${r.user_name}</strong> ${'★'.repeat(r.rating)}</div>
          </div>
          <p style="color:var(--text-muted);font-size:0.9rem;">${r.text}</p>
          <div style="margin-top:12px;display:flex;gap:8px;">
            <button class="admin-btn admin-btn--sm admin-btn--primary" onclick="approvePendingReview(${r.id})">${currentLang === 'ar' ? 'موافقة' : 'Approve'}</button>
            <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="rejectPendingReview(${r.id})">${currentLang === 'ar' ? 'رفض' : 'Reject'}</button>
            <button class="admin-btn admin-btn--sm" onclick="viewPendingReview(${r.id})">${tx('view')}</button>
          </div>
        </div>`).join('');
    } else if (tab === 'hotels') {
      const items = d.pending_hotels || [];
      if (items.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">' + (currentLang === 'ar' ? 'لا توجد فنادق معلقة' : 'No pending hotels') + '</p>'; return; }
      el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
          <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('city')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
        <tbody>${items.map(h => `<tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px;">${h.id}</td>
          <td style="padding:8px;font-weight:600;">${h.name}</td>
          <td style="padding:8px;">${h.city || ''}</td>
          <td style="padding:8px;">
            <button class="admin-btn admin-btn--sm admin-btn--primary" onclick="approvePendingHotel(${h.id})">${currentLang === 'ar' ? 'موافقة' : 'Approve'}</button>
            <button class="admin-btn admin-btn--sm" onclick="renderAdminHotelForm(${h.id})">${tx('edit')}</button>
            <button class="admin-btn admin-btn--sm" onclick="viewPendingHotel(${h.id})">${tx('view')}</button>
          </td></tr>`).join('')}</tbody></table>`;
    } else if (tab === 'tours') {
      const items = d.pending_tours || [];
      if (items.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">' + (currentLang === 'ar' ? 'لا توجد جولات معلقة' : 'No pending tours') + '</p>'; return; }
      el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
          <th style="padding:8px;">${tx('id')}</th><th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('price')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
        <tbody>${items.map(t => `<tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px;">${t.id}</td>
          <td style="padding:8px;font-weight:600;">${t.name}</td>
          <td style="padding:8px;">$${t.price}</td>
          <td style="padding:8px;">
            <button class="admin-btn admin-btn--sm admin-btn--primary" onclick="approvePendingTour(${t.id})">${currentLang === 'ar' ? 'موافقة' : 'Approve'}</button>
            <button class="admin-btn admin-btn--sm" onclick="renderAdminTourForm(${t.id})">${tx('edit')}</button>
            <button class="admin-btn admin-btn--sm" onclick="viewPendingTour(${t.id})">${tx('view')}</button>
          </td></tr>`).join('')}</tbody></table>`;
    }
  } catch (err) { showMsg(err.message, true); }
}

async function approvePendingBooking(id) {
  try { await adminRequest('POST', `/bookings/${id}/status`, { status: 'confirmed' }); showMsg(tx('confirmed')); loadPendingTab('bookings'); } catch (err) { showMsg(err.message, true); }
}
async function rejectPendingBooking(id) {
  try { await adminRequest('POST', `/bookings/${id}/status`, { status: 'cancelled' }); showMsg(tx('cancelled')); loadPendingTab('bookings'); } catch (err) { showMsg(err.message, true); }
}
async function viewPendingBooking(id) {
  try { await adminRequest('PUT', `/bookings/${id}`, { status: 'pending' }); renderAdminBookings(); } catch (err) { showMsg(err.message, true); }
}
async function approvePendingReview(id) {
  try { await adminRequest('PUT', `/reviews/${id}`, { status: 'approved' }); showMsg(tx('updated')); loadPendingTab('reviews'); } catch (err) { showMsg(err.message, true); }
}
async function rejectPendingReview(id) {
  try { await adminRequest('PUT', `/reviews/${id}`, { status: 'rejected' }); showMsg(tx('updated')); loadPendingTab('reviews'); } catch (err) { showMsg(err.message, true); }
}
async function viewPendingReview(id) { renderAdminReviews(); }
async function approvePendingHotel(id) {
  try { await adminRequest('PUT', `/hotels/${id}`, { status: 'active' }); showMsg(tx('updated')); loadPendingTab('hotels'); } catch (err) { showMsg(err.message, true); }
}
async function viewPendingHotel(id) { renderAdminHotels(); }
async function approvePendingTour(id) {
  try { await adminRequest('PUT', `/tours/${id}`, { status: 'active' }); showMsg(tx('updated')); loadPendingTab('tours'); } catch (err) { showMsg(err.message, true); }
}
async function viewPendingTour(id) { renderAdminTours(); }

// ============ ADMIN: REVENUE ============
async function renderAdminRevenue() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('revenueReport')}</h2></div>
    <div id="revenue-content"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/revenue');
    if (!d) return;
    const el = document.getElementById('revenue-content');
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:32px;">
        <div class="stat-card"><span class="stat-value">$${d.total}</span><span class="stat-label">${tx('totalRevenue')}</span></div>
        <div class="stat-card"><span class="stat-value">$${d.hotels}</span><span class="stat-label">${tx('revenueByHotels')}</span></div>
        <div class="stat-card"><span class="stat-value">$${d.tours}</span><span class="stat-label">${tx('revenueByTours')}</span></div>
        <div class="stat-card"><span class="stat-value">$${d.cars}</span><span class="stat-label">${tx('revenueByCars')}</span></div>
      </div>
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3>${tx('monthly')} ${tx('revenue')}</h3>
          <button class="admin-btn admin-btn--sm admin-btn--primary">${tx('exportBtn')}</button>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
            <th style="padding:8px;">${tx('monthly')}</th><th style="padding:8px;">${tx('total')}</th></tr></thead>
          <tbody>${(d.monthly || []).map(m => `<tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:8px;font-weight:600;">${m.month}</td>
            <td style="padding:8px;">$${m.total}</td>
          </tr>`).join('') || '<tr><td colspan="2" style="padding:20px;text-align:center;color:var(--text-muted);">' + (currentLang === 'ar' ? 'لا توجد بيانات' : 'No data') + '</td></tr>'}
        </tbody></table>
      </div>`;
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: HOTEL STATS ============
async function renderAdminHotelStats() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('hotelStats')}</h2></div>
    <div id="hotel-stats-content"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/hotels-stats');
    if (!d) return;
    const el = document.getElementById('hotel-stats-content');
    if (!d.hotels || d.hotels.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">' + (currentLang === 'ar' ? 'لا توجد فنادق' : 'No hotels') + '</p>'; return; }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('city')}</th><th style="padding:8px;">${tx('rating')}</th><th style="padding:8px;">${tx('totalRooms')}</th><th style="padding:8px;">${tx('availableRooms')}</th><th style="padding:8px;">${tx('bookingsCount')}</th><th style="padding:8px;">${tx('revenue')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${d.hotels.map(h => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;font-weight:600;cursor:pointer;color:var(--gold-primary);" onclick="renderAdminHotelForm(${h.id})">${h.name}</td>
        <td style="padding:8px;">${h.city || ''}</td>
        <td style="padding:8px;">${'★'.repeat(h.rating)}</td>
        <td style="padding:8px;">${h.total_rooms || 0}</td>
        <td style="padding:8px;">${h.available_rooms || 0}</td>
        <td style="padding:8px;">${h.total_bookings || 0}</td>
        <td style="padding:8px;">$${h.revenue || 0}</td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="renderAdminHotelForm(${h.id})">${tx('edit')}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: TOUR STATS ============
async function renderAdminTourStats() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('tourStats')}</h2></div>
    <div id="tour-stats-content"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/tours-stats');
    if (!d) return;
    const el = document.getElementById('tour-stats-content');
    if (!d.tours || d.tours.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">' + (currentLang === 'ar' ? 'لا توجد جولات' : 'No tours') + '</p>'; return; }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('city') || 'Location'}</th><th style="padding:8px;">${tx('price')}</th><th style="padding:8px;">${tx('duration')}</th><th style="padding:8px;">${tx('bookingsCount')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${d.tours.map(t => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;font-weight:600;">${t.name}</td>
        <td style="padding:8px;">${t.city_id || ''}</td>
        <td style="padding:8px;">$${t.price}</td>
        <td style="padding:8px;">${t.duration || ''}</td>
        <td style="padding:8px;">${t.bookings_count || 0}</td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="viewTourDetail(${t.id})">${tx('view')}</button>
          <button class="admin-btn admin-btn--sm" onclick="renderAdminTourForm(${t.id})">${tx('edit')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteTour(${t.id})">${tx('del')}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function viewTourDetail(tourId) {
  try {
    const d = await adminRequest('GET', '/tours');
    if (!d) return;
    const tour = (d.tours || []).find(t => t.id === tourId);
    if (!tour) return;
    document.getElementById('admin-content').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminTourStats()">← ${tx('back')}</button><h2>${tx('view')}: ${tour.name}</h2></div>
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:24px;max-width:600px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div><strong>${tx('name')}:</strong> ${tour.name}</div>
          ${tour.name_ar ? `<div><strong>${tx('nameAr')}:</strong> ${tour.name_ar}</div>` : ''}
          <div><strong>${tx('duration')}:</strong> ${tour.duration || '-'}</div>
          <div><strong>${tx('price')}:</strong> $${tour.price}</div>
          <div><strong>${tx('status')}:</strong> ${tour.status || 'active'}</div>
          <div><strong>${tx('featured')}:</strong> ${tour.featured ? 'Yes' : 'No'}</div>
        </div>
        ${tour.description ? `<div style="margin-top:16px;"><strong>${tx('description')}:</strong><p style="color:var(--text-muted);">${tour.description}</p></div>` : ''}
      </div>`;
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: CAR STATS ============
async function renderAdminCarStats() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>${tx('carStats')}</h2></div>
    <div id="car-stats-content"><p style="color:var(--text-muted);text-align:center;padding:40px;">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/vehicles-stats');
    if (!d) return;
    const el = document.getElementById('car-stats-content');
    if (!d.vehicles || d.vehicles.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">' + (currentLang === 'ar' ? 'لا توجد سيارات' : 'No vehicles') + '</p>'; return; }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${tx('name')}</th><th style="padding:8px;">${tx('model')}</th><th style="padding:8px;">${tx('priceDay')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('bookingsCount')}</th><th style="padding:8px;">${tx('actions')}</th></tr></thead>
      <tbody>${d.vehicles.map(v => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;font-weight:600;">${v.name}</td>
        <td style="padding:8px;">${v.model || ''}</td>
        <td style="padding:8px;">$${v.price_per_day || 0}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${v.status||'active'}">${v.status||'active'}</span></td>
        <td style="padding:8px;">${v.reservations_count || 0}</td>
        <td style="padding:8px;">
          <button class="admin-btn admin-btn--sm" onclick="renderAdminVehicleForm(${v.id})">${tx('edit')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteVehicle(${v.id})">${tx('del')}</button>
          <button class="admin-btn admin-btn--sm" onclick="viewCarReservations(${v.id})">${tx('view')}</button>
        </td></tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

async function viewCarReservations(vehicleId) {
  try {
    const d = await adminRequest('GET', `/bookings?booking_type=car&item_id=${vehicleId}`);
    if (!d) return;
    document.getElementById('admin-content').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminCarStats()">← ${tx('back')}</button><h2>${currentLang === 'ar' ? 'حجوزات السيارة' : 'Car Reservations'}</h2></div>
      <div id="car-reservations-list"></div>`;
    const el = document.getElementById('car-reservations-list');
    if (!d.bookings || d.bookings.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">' + tx('noBookings') + '</p>'; return; }
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;color:var(--text-muted);font-size:0.8rem;">
        <th style="padding:8px;">${tx('ref')}</th><th style="padding:8px;">${tx('customer')}</th><th style="padding:8px;">${tx('total')}</th><th style="padding:8px;">${tx('status')}</th><th style="padding:8px;">${tx('date')}</th></tr></thead>
      <tbody>${d.bookings.map(b => `<tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;font-weight:600;">#${b.booking_ref || b.id}</td>
        <td style="padding:8px;">${b.customer_name}</td>
        <td style="padding:8px;">$${b.total}</td>
        <td style="padding:8px;"><span class="booking-item__status status--${(b.status||'').toLowerCase()}">${b.status}</span></td>
        <td style="padding:8px;font-size:0.85rem;color:var(--text-muted);">${b.created_at || ''}</td>
      </tr>`).join('')}</tbody></table>`;
  } catch (err) { showMsg(err.message, true); }
}

// ============ ADMIN: REPORTS ============
async function renderAdminReports() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>📊 ${currentLang === 'ar' ? 'التقارير والإحصائيات' : 'Reports & Statistics'}</h2></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;" id="reports-grid">
      <p style="color:var(--text-muted);text-align:center;padding:40px;grid-column:1/-1;">${tx('loading')}</p>
    </div>`;
  try {
    const [monthly, breakdown, paymentStats, daily] = await Promise.all([
      adminRequest('GET', '/reports/monthly-revenue'),
      adminRequest('GET', '/reports/booking-type-breakdown'),
      adminRequest('GET', '/reports/payment-method-stats'),
      adminRequest('GET', '/reports/daily-bookings?days=30')
    ]);
    const grid = document.getElementById('reports-grid');
    if (!grid) return;
    let html = '';

    // Monthly Revenue Chart (simple bar)
    if (monthly && monthly.monthly) {
      const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const maxRev = Math.max(...monthly.monthly.map(m => m.revenue), 1);
      html += '<div class="card" style="grid-column:1/-1;padding:20px;"><h3 style="margin-bottom:16px;">💰 ' + (currentLang === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue') + ' ($' + (monthly.total_revenue || 0).toLocaleString() + ')</h3><div style="display:flex;gap:4px;align-items:flex-end;height:160px;padding:10px 0;">';
      for (let i = 1; i <= 12; i++) {
        const m = monthly.monthly.find(x => parseInt(x.month) === i);
        const rev = m ? parseFloat(m.revenue) : 0;
        const pct = maxRev > 0 ? (rev / maxRev) * 100 : 0;
        html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;"><div style="width:100%;background:linear-gradient(to top,var(--gold-primary),var(--gold-dark));border-radius:4px 4px 0 0;height:' + Math.max(pct, 2) + '%;min-height:4px;transition:height 0.3s;" title="$' + rev.toFixed(0) + '"></div><span style="font-size:0.6rem;color:var(--text-muted);margin-top:4px;">' + months[i] + '</span></div>';
      }
      html += '</div></div>';
    }

    // Booking Type Breakdown
    if (breakdown && breakdown.breakdown) {
      html += '<div class="card" style="padding:20px;"><h3 style="margin-bottom:12px;">📋 ' + (currentLang === 'ar' ? 'توزيع أنواع الحجوزات' : 'Booking Types') + '</h3>';
      const total = breakdown.breakdown.reduce((s, b) => s + parseInt(b.count), 0);
      for (const b of breakdown.breakdown) {
        const pct = total > 0 ? (parseInt(b.count) / total * 100) : 0;
        html += '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:0.85rem;"><span>' + (b.booking_type || '—') + '</span><span>' + b.count + ' ($' + (parseFloat(b.revenue).toFixed(0)) + ')</span></div><div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--gold-primary),var(--gold-dark));border-radius:4px;"></div></div></div>';
      }
      html += '</div>';
    }

    // Payment Methods
    if (paymentStats && paymentStats.payment_stats) {
      html += '<div class="card" style="padding:20px;"><h3 style="margin-bottom:12px;">💳 ' + (currentLang === 'ar' ? 'طرق الدفع' : 'Payment Methods') + '</h3>';
      for (const p of paymentStats.payment_stats) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);font-size:0.85rem;"><span>' + (p.payment_method || '—') + '</span><span style="font-weight:600;">' + p.count + ' ($' + (parseFloat(p.revenue).toFixed(0)) + ')</span></div>';
      }
      html += '</div>';
    }

    // Daily bookings
    if (daily && daily.daily) {
      const maxCount = Math.max(...daily.daily.map(d => parseInt(d.count)), 1);
      html += '<div class="card" style="grid-column:1/-1;padding:20px;"><h3 style="margin-bottom:16px;">📅 ' + (currentLang === 'ar' ? 'الحجوزات اليومية (آخر 30 يوم)' : 'Daily Bookings (Last 30 Days)') + '</h3><div style="display:flex;gap:2px;align-items:flex-end;height:120px;overflow-x:auto;padding:10px 0;">';
      for (const d of daily.daily) {
        const pct = maxCount > 0 ? (parseInt(d.count) / maxCount * 100) : 0;
        html += '<div style="display:flex;flex-direction:column;align-items:center;min-width:24px;"><div style="width:16px;background:var(--success);border-radius:2px 2px 0 0;height:' + Math.max(pct, 2) + '%;min-height:4px;" title="' + d.day + ': ' + d.count + '"></div></div>';
      }
      html += '</div></div>';
    }

    // Export button
    html += '<div class="card" style="padding:20px;grid-column:1/-1;"><h3 style="margin-bottom:12px;">📥 ' + (currentLang === 'ar' ? 'تصدير البيانات' : 'Export Data') + '</h3><div style="display:flex;gap:12px;flex-wrap:wrap;"><input type="date" id="export-start" class="admin-input" style="width:auto;" value="' + new Date(Date.now()-30*86400000).toISOString().split('T')[0] + '"><input type="date" id="export-end" class="admin-input" style="width:auto;" value="' + new Date().toISOString().split('T')[0] + '"><button class="admin-btn admin-btn--primary" onclick="exportBookingsCSV()">📥 CSV</button></div></div>';

    grid.innerHTML = html;
  } catch (err) { showMsg(err.message, true); }
}

function exportBookingsCSV() {
  const start = document.getElementById('export-start')?.value || '';
  const end = document.getElementById('export-end')?.value || '';
  if (!adminToken) return;
  fetch(api('/api/admin/reports/export-csv?start=' + start + '&end=' + end), {
    headers: { 'Authorization': 'Bearer ' + adminToken }
  }).then(r => r.blob()).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }).catch(() => showMsg(currentLang === 'ar' ? 'خطأ في التصدير' : 'Export error', true));
}

// ============ ADMIN: COUPONS ============
async function renderAdminCouponsList() {
  document.getElementById('admin-content').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;"><button class="admin-btn admin-btn--sm" onclick="renderAdminDashboard()">← ${tx('back')}</button><h2>🏷️ ${currentLang === 'ar' ? 'كوبونات الخصم' : 'Coupons'}</h2></div>
      <button class="admin-btn admin-btn--primary" onclick="renderAdminCouponForm()">+ ${currentLang === 'ar' ? 'إضافة' : 'Add'}</button></div>
    <div id="admin-coupons-list"><p style="color:var(--text-muted);">${tx('loading')}</p></div>`;
  try {
    const d = await adminRequest('GET', '/coupons-list');
    if (!d) return;
    const el = document.getElementById('admin-coupons-list');
    el.innerHTML = (d.coupons || []).map(c => `
      <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border-color);border-radius:8px;padding:12px 16px;margin-bottom:8px;">
        <div><strong style="color:var(--gold-primary);font-size:1.1rem;">${c.code}</strong>
          <span style="font-size:0.85rem;color:var(--text-muted);margin-right:12px;">${c.name_ar || c.name}</span>
          <span style="font-size:0.8rem;color:var(--text-muted);display:block;margin-top:4px;">${c.type === 'percent' ? c.value + '%' : '$' + c.value} ${currentLang === 'ar' ? 'خصم' : 'off'} | ${currentLang === 'ar' ? 'الحد الأدنى' : 'Min'}: $${c.min_total} | ${currentLang === 'ar' ? 'استخدام' : 'Used'}: ${c.used_count || 0}</span></div>
        <div style="display:flex;gap:8px;">
          <button class="admin-btn admin-btn--sm admin-btn--secondary" onclick="renderAdminCouponForm(${c.id})">${tx('edit')}</button>
          <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteCoupon(${c.id})">${tx('del')}</button></div>
      </div>`).join('') || '<p>' + (currentLang === 'ar' ? 'لا توجد كوبونات' : 'No coupons') + '</p>';
  } catch (err) { showMsg(err.message, true); }
}

async function renderAdminCouponForm(id = null) {
  let c = { code: '', name: '', name_ar: '', value: 10, type: 'percent', min_total: 0, active: 1, expires_at: '', usage_limit: 0 };
  if (id) {
    const d = await adminRequest('GET', '/coupons-list');
    if (d) c = (d.coupons || []).find(x => x.id === id) || c;
  }
  document.getElementById('admin-content').innerHTML = `<h2 style="margin-bottom:20px;">${id ? tx('edit') : tx('add')} ${currentLang === 'ar' ? 'كوبون' : 'Coupon'}</h2>
    <form id="admin-coupon-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;" onsubmit="saveCoupon(event, ${id || 'null'})">
      <div><label>${currentLang === 'ar' ? 'الكود' : 'Code'}</label><input class="admin-input" name="code" value="${c.code}" required></div>
      <div><label>${currentLang === 'ar' ? 'الاسم' : 'Name'}</label><input class="admin-input" name="name" value="${c.name}" required></div>
      <div><label>${currentLang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</label><input class="admin-input" name="name_ar" value="${c.name_ar || ''}"></div>
      <div><label>${currentLang === 'ar' ? 'القيمة' : 'Value'}</label><input class="admin-input" name="value" type="number" value="${c.value}" step="0.01" required></div>
      <div><label>${currentLang === 'ar' ? 'النوع' : 'Type'}</label><select class="admin-input" name="type"><option value="percent" ${c.type==='percent'?'selected':''}>%</option><option value="fixed" ${c.type==='fixed'?'selected':''}>$</option></select></div>
      <div><label>${currentLang === 'ar' ? 'الحد الأدنى' : 'Min Total'}</label><input class="admin-input" name="min_total" type="number" value="${c.min_total}"></div>
      <div><label>${currentLang === 'ar' ? 'الصلاحية حتى' : 'Expires'}</label><input class="admin-input" name="expires_at" type="date" value="${c.expires_at || ''}"></div>
      <div><label>${currentLang === 'ar' ? 'حد الاستخدام' : 'Usage Limit'}</label><input class="admin-input" name="usage_limit" type="number" value="${c.usage_limit || 0}"></div>
      <div style="display:flex;gap:12px;grid-column:1/-1;">
        <button class="admin-btn admin-btn--primary" type="submit">${tx('save')}</button>
        <button class="admin-btn" type="button" onclick="renderAdminCouponsList()">${tx('back')}</button></div>
    </form>`;
}

async function saveCoupon(e, id) {
  e.preventDefault();
  const f = e.target;
  try {
    await adminRequest('POST', '/coupons', { id, code: f.code.value, name: f.name.value, name_ar: f.name_ar.value, value: parseFloat(f.value.value), type: f.type.value, min_total: parseFloat(f.min_total.value) || 0, expires_at: f.expires_at.value, usage_limit: parseInt(f.usage_limit.value) || 0 });
    showMsg(tx('saved'));
    renderAdminCouponsList();
  } catch (err) { showMsg(err.message, true); }
}

async function deleteCoupon(id) {
  if (!confirm(currentLang === 'ar' ? 'حذف الكوبون؟' : 'Delete coupon?')) return;
  try { await adminRequest('DELETE', '/coupons/' + id); renderAdminCouponsList(); } catch (err) { showMsg(err.message, true); }
}

// Inject admin styles
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

window.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('syria_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('admin-theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  if (adminToken) renderAdminDashboard(); else renderAdminLogin();
});
