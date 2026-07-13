let currentLang = localStorage.getItem('syria_lang') || 'en';
let currentTheme = localStorage.getItem('syria_theme') || 'dark';
let currentUser = JSON.parse(localStorage.getItem('syria_user')) || null;
let currentToken = localStorage.getItem('syria_token') || null;
let siteSettings = {};
let countriesData = [];
let homepageSections = {};
let activeTripBookingId = null;

const API_BASE = (function() {
  var m = document.querySelector('meta[name="api-url"]');
  var metaUrl = m ? m.getAttribute('content') : '';
  if (metaUrl) return metaUrl;
  var stored = localStorage.getItem('syria_api_url');
  if (stored) return stored;
  return '';
})();

const TR = {
  en: {
    home: 'Home', destinations: 'Destinations', hotels: 'Hotels', tours: 'Tours',
    cars: 'Car Rental', gallery: 'Gallery', bookings: 'My Bookings', login: 'Login',
    signup: 'Sign Up', logout: 'Logout', contact: 'Contact', about: 'About',
    bookNow: 'Book Now via WhatsApp', viewDetails: 'View Details', perNight: '/ night',
    perDay: '/ day', amenities: 'Amenities', rooms: 'Rooms', overview: 'Overview',
    location: 'Location', reviews: 'Reviews', gallery_title: 'Gallery', price: 'Price',
    capacity: 'Capacity', size: 'Size', bedType: 'Bed Type', features: 'Features',
    included: 'What\'s Included', itinerary: 'Itinerary', duration: 'Duration',
    guests: 'Guests', checkIn: 'Check-In', checkOut: 'Check-Out', roomType: 'Room Type',
    specialRequests: 'Special Requests', fullName: 'Full Name', phone: 'Phone',
    whatsapp: 'WhatsApp Number', countryCode: 'Country Code', send: 'Send Message',
    noResults: 'No results found', loading: 'Loading...', search: 'Search',
    all: 'All', featured: 'Featured', starRating: 'Star Rating',
    ourHotels: 'Our Luxury Hotels', ourTours: 'Our Tour Packages',
    ourCars: 'Our Vehicle Fleet', ourGallery: 'Tourism Gallery',
    heroTitle: 'Discover Ancient Syria in Absolute Luxury',
    heroSubtitle: 'Explore Damascus, Palmyra, and Aleppo with tailored premium tours, 5-star heritage hotels, and elite private transport.',
    bookHotel: 'Book This Hotel', bookTour: 'Book This Tour', bookCar: 'Rent This Vehicle',
    submitReview: 'Submit Review', yourName: 'Your Name', yourReview: 'Your Review',
    travelDate: 'Travel Date', travelers: 'Number of Travelers',
    pickupDate: 'Pick-Up Date', returnDate: 'Return Date',
    pricing: 'Pricing', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
    specifications: 'Specifications', brand: 'Brand', model: 'Model', year: 'Year',
    transmission: 'Transmission', fuelType: 'Fuel Type', seats: 'Seats',
    luggage: 'Luggage Capacity', aircon: 'Air Conditioning', gps: 'GPS',
    bluetooth: 'Bluetooth', usb: 'USB', selectRoom: 'Select Room Category',
    viewRoom: 'View Room Details', roomDetails: 'Room Details',
    roomServices: 'Room Services', roomAmenities: 'Room Amenities',
    nearbyAttractions: 'Nearby Attractions', visitingTips: 'Visiting Tips',
    historicalInfo: 'Historical Information', tourismInfo: 'Tourism Information',
    availableActivities: 'Available Activities', sendInquiry: 'Send Inquiry',
    inquirySubject: 'Subject', inquiryMessage: 'Message', yourEmail: 'Email',
    privacyPolicy: 'Privacy Policy', termsConditions: 'Terms & Conditions',
    cancellationPolicy: 'Cancellation Policy', refundPolicy: 'Refund Policy',
    allRightsReserved: 'All Rights Reserved.', poweredBy: 'Powered by Syria Travel',
    whatsappNum: '963951564210',
    compareTitle: 'Compare', addToFavorites: 'Add to Favorites',
    removeFavorites: 'Remove from Favorites', bookSuccess: 'Thank you! Your booking request has been sent.',
    selectCountryCode: 'Select Country Code',
    required: 'Required',
    paymentMethod: 'Payment Method',
    bankTransfer: 'Bank Transfer',
    tripProgress: 'Trip Progress',
    overallProgress: 'Overall Progress',
    completedItems: 'Completed',
    remainingItems: 'Remaining',
    noItinerary: 'No trip itinerary available',
    viewTripProgress: 'View Trip Progress',
    day: 'Day',
    myTrip: 'My Trip',
  },
  ar: {
    home: 'الرئيسية', destinations: 'الوجهات', hotels: 'الفنادق', tours: 'الجولات',
    cars: 'تأجير السيارات', gallery: 'معرض الصور', bookings: 'حجوزاتي', login: 'تسجيل دخول',
    signup: 'إنشاء حساب', logout: 'تسجيل خروج', contact: 'اتصل بنا', about: 'من نحن',
    bookNow: 'احجز عبر واتساب', viewDetails: 'عرض التفاصيل', perNight: '/ ليلة',
    perDay: '/ يوم', amenities: 'وسائل الراحة', rooms: 'الغرف', overview: 'نظرة عامة',
    location: 'الموقع', reviews: 'التقييمات', gallery_title: 'معرض الصور', price: 'السعر',
    capacity: 'السعة', size: 'المساحة', bedType: 'نوع السرير', features: 'الميزات',
    included: 'يشمل', itinerary: 'برنامج الرحلة', duration: 'المدة',
    guests: 'الضيوف', checkIn: 'تاريخ الوصول', checkOut: 'تاريخ المغادرة', roomType: 'نوع الغرفة',
    specialRequests: 'طلبات خاصة', fullName: 'الاسم الكامل', phone: 'الهاتف',
    whatsapp: 'رقم واتساب', countryCode: 'رمز الدولة', send: 'إرسال',
    noResults: 'لا توجد نتائج', loading: 'جار التحميل...', search: 'بحث',
    all: 'الكل', featured: 'مميز', starRating: 'تصنيف نجوم',
    ourHotels: 'فنادقنا الفاخرة', ourTours: 'باقات الجولات السياحية',
    ourCars: 'أسطول السيارات', ourGallery: 'معرض السياحة',
    heroTitle: 'اكتشف عراقة سوريا في رفاهية مطلقة',
    heroSubtitle: 'استكشف دمشق، وتدمر، وحلب عبر جولات حصرية وفنادق تراثية ومواصفات فاخرة.',
    bookHotel: 'احجز هذا الفندق', bookTour: 'احجز هذه الجولة', bookCar: 'استأجر هذه السيارة',
    submitReview: 'أرسل تقييمك', yourName: 'اسمك', yourReview: 'تقييمك',
    travelDate: 'تاريخ السفر', travelers: 'عدد المسافرين',
    pickupDate: 'تاريخ الاستلام', returnDate: 'تاريخ التسليم',
    pricing: 'الأسعار', daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري',
    specifications: 'المواصفات', brand: 'العلامة التجارية', model: 'الموديل', year: 'السنة',
    transmission: 'ناقل الحركة', fuelType: 'نوع الوقود', seats: 'المقاعد',
    luggage: 'سعة الأمتعة', aircon: 'تكييف', gps: 'ملاحة', bluetooth: 'بلوتوث', usb: 'USB',
    selectRoom: 'اختر فئة الغرفة', viewRoom: 'عرض تفاصيل الغرفة',
    roomDetails: 'تفاصيل الغرفة', roomServices: 'خدمات الغرفة', roomAmenities: 'مستلزمات الغرفة',
    nearbyAttractions: 'المعالم القريبة', visitingTips: 'نصائح الزيارة',
    historicalInfo: 'معلومات تاريخية', tourismInfo: 'معلومات سياحية',
    availableActivities: 'الأنشطة المتاحة', sendInquiry: 'إرسال استفسار',
    inquirySubject: 'الموضوع', inquiryMessage: 'الرسالة', yourEmail: 'البريد الإلكتروني',
    privacyPolicy: 'سياسة الخصوصية', termsConditions: 'الشروط والأحكام',
    cancellationPolicy: 'سياسة الإلغاء', refundPolicy: 'سياسة الاسترداد',
    allRightsReserved: 'جميع الحقوق محفوظة.', poweredBy: 'مدعوم من سياحة سوريا',
    whatsappNum: '963951564210',
    compareTitle: 'مقارنة', addToFavorites: 'إضافة إلى المفضلة',
    removeFavorites: 'إزالة من المفضلة', bookSuccess: 'شكراً! تم إرسال طلب الحجز بنجاح.',
    selectCountryCode: 'اختر رمز الدولة',
    required: 'مطلوب',
    paymentMethod: 'طريقة الدفع',
    bankTransfer: 'تحويل بنكي',
    tripProgress: 'تقدم الرحلة',
    overallProgress: 'التقدم العام',
    completedItems: 'مكتمل',
    remainingItems: 'متبقي',
    noItinerary: 'لا يوجد برنامج رحلة متاح',
    viewTripProgress: 'عرض تقدم الرحلة',
    day: 'اليوم',
    myTrip: 'رحلتي',
  }
};

function t(key) { return TR[currentLang]?.[key] || TR['en'][key] || key; }

// Payment method card renderer
function renderPaymentMethodCards(containerId, selectName, selectedMethod) {
  const container = document.getElementById(containerId);
  if (!container) { console.log('PM: container not found', containerId); return; }
  container.innerHTML = `<div style="text-align:center;padding:8px;color:var(--text-muted);font-size:0.8rem;">${currentLang === 'ar' ? 'تحميل طرق الدفع...' : 'Loading payment methods...'}</div>`;
  const country = localStorage.getItem('syria_country') || 'SY';
  fetch('/api/payment-methods?country=' + country + '&currency=USD').then(r => r.json()).then(res => {
    if (res && res.methods && res.methods.length > 0) {
      container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;">${
        res.methods.map(m => {
          const sel = selectedMethod === m.code;
          return `<div onclick="selectPaymentMethod('${containerId}','${m.code}','${selectName}')" 
               id="pm-${containerId}-${m.code}"
               style="cursor:pointer;padding:10px 6px;border:2px solid ${sel ? '#C9A96E' : 'rgba(201,169,110,0.2)'};border-radius:8px;text-align:center;transition:all 0.2s;background:${sel ? 'rgba(201,169,110,0.1)' : 'transparent'};">
            <div style="font-size:1.4rem;margin-bottom:4px;">${m.icon || '💳'}</div>
            <div style="font-size:0.75rem;font-weight:600;line-height:1.3;">${currentLang === 'ar' ? (m.name_ar || m.name) : m.name}</div>
          </div>`;
        }).join('')
      }</div>`;
      const inp = document.querySelector('[name="' + selectName + '"]');
      if (inp && selectedMethod) inp.value = selectedMethod;
    } else {
      container.innerHTML = `<select class="booking-form__input" name="${selectName}">
        <option value="bank_transfer">${currentLang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
        <option value="cash_on_arrival">${currentLang === 'ar' ? 'الدفع عند الوصول' : 'Cash on Arrival'}</option>
        <option value="visa">Visa / Mastercard</option>
      </select>`;
    }
  }).catch(() => {
    container.innerHTML = `<select class="booking-form__input" name="${selectName}">
      <option value="bank_transfer">${currentLang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
      <option value="cash_on_arrival">${currentLang === 'ar' ? 'الدفع عند الوصول' : 'Cash on Arrival'}</option>
    </select>`;
  });
}

function selectPaymentMethod(containerId, code, selectName) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('[id^="pm-' + containerId + '-"]').forEach(el => {
    el.style.borderColor = 'var(--border-color)';
    el.style.background = 'var(--bg-card)';
  });
  const selected = document.getElementById(`pm-${containerId}-${code}`);
  if (selected) {
    selected.style.borderColor = 'var(--gold-primary)';
    selected.style.background = 'rgba(201,169,110,0.1)';
  }
  const hiddenInput = document.querySelector(`[name="${selectName}"]`);
  if (hiddenInput) hiddenInput.value = code;
}

function updateSEO(title, description, image = '') {
  document.title = `${title} | Syria Travel`;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.setAttribute('name', 'description'); document.head.appendChild(metaDesc); }
  metaDesc.setAttribute('content', description);
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
  ogTitle.setAttribute('content', `${title} | Syria Travel`);
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) { ogDesc = document.createElement('meta'); ogDesc.setAttribute('property', 'og:description'); document.head.appendChild(ogDesc); }
  ogDesc.setAttribute('content', description);
  if (image) {
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) { ogImage = document.createElement('meta'); ogImage.setAttribute('property', 'og:image'); document.head.appendChild(ogImage); }
    ogImage.setAttribute('content', image);
  }
}

const API = {
  async get(url) {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    const res = await fetch(API_BASE + url, { headers });
    if (!res.ok) {
      let msg = 'Request failed';
      try { const e = await res.json(); msg = e.error || msg; } catch (e2) {}
      throw new Error(msg);
    }
    return res.json();
  },
  async post(url, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    const res = await fetch(API_BASE + url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Request failed'); }
    return res.json();
  }
};

function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'toast--error' : ''}`;
  el.innerHTML = `<span>${type === 'error' ? '✕' : '✦'} ${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

async function loadSettings() {
  try {
    const data = await API.get('/api/settings');
    siteSettings = data;
    const wa = data.whatsapp_number;
    if (wa) TR.en.whatsappNum = wa;
  } catch (e) {}
}

async function loadHomepageSections() {
  try {
    const data = await API.get('/api/homepage');
    if (data) homepageSections = data;
  } catch (e) {}
}

async function loadActiveTrip() {
  if (!currentToken) { activeTripBookingId = null; return; }
  try {
    const data = await API.get('/api/bookings/active-trip');
    if (data && data.booking_id) activeTripBookingId = data.booking_id;
    else activeTripBookingId = null;
  } catch (e) { activeTripBookingId = null; }
}

async function loadCountries() {
  try {
    const data = await API.get('/api/countries');
    countriesData = data.countries || [];
  } catch (e) {}
}

function getWhatsAppNum() { var n = (siteSettings.whatsapp_number || TR[currentLang].whatsappNum || '963951564210').replace(/[^0-9]/g,'').replace(/^0+/,''); return n || '963951564210'; }
function getTelegramNum() { var n = (siteSettings.telegram_number || '963951564210').replace(/[^0-9]/g,'').replace(/^0+/,''); return n || '963951564210'; }

function openWhatsApp(text) {
  var num = getWhatsAppNum();
  var waUrl = 'https://web.whatsapp.com/send?phone=' + num + '&text=' + encodeURIComponent(text);
  var tgUrl = 'https://t.me/' + num + '?text=' + encodeURIComponent(text);

  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
  
  var box = document.createElement('div');
  box.style.cssText = 'background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:28px 32px;text-align:center;max-width:340px;width:90%;direction:rtl;box-shadow:0 16px 48px rgba(0,0,0,0.4);';
  
  box.innerHTML = '<div style="margin-bottom:16px;font-size:16px;font-weight:700;">' + (currentLang === 'ar' ? 'تم تأكيد الحجز ✅' : 'Booking Confirmed ✅') + '</div>' +
    '<div style="margin-bottom:20px;font-size:13px;color:var(--text-muted);">' + (currentLang === 'ar' ? 'اختر طريقة التواصل لإرسال التفاصيل' : 'Choose method to send details') + '</div>' +
    '<div style="display:flex;gap:12px;flex-direction:column;">' +
    '<button onclick="window.open(\'' + waUrl + '\',\'_blank\');this.closest(\'[data-wa-overlay]\').remove();" style="width:100%;padding:14px;background:#25D366;color:#FFF;border:none;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;">💬 WhatsApp' + (currentLang === 'ar' ? ' (قد يحتاج VPN)' : ' (may need VPN)') + '</button>' +
    '<button onclick="window.open(\'' + tgUrl + '\',\'_blank\');this.closest(\'[data-wa-overlay]\').remove();" style="width:100%;padding:14px;background:#0088cc;color:#FFF;border:none;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;">✈️ Telegram' + (currentLang === 'ar' ? ' (بدون VPN)' : ' (no VPN needed)') + '</button>' +
    '<button onclick="this.closest(\'[data-wa-overlay]\').remove();" style="width:100%;padding:10px;background:transparent;border:1px solid var(--border-color);color:var(--text-muted);border-radius:8px;font-size:12px;cursor:pointer;">' + (currentLang === 'ar' ? 'إغلاق' : 'Close') + '</button></div>';

  overlay.appendChild(box);
  overlay.setAttribute('data-wa-overlay', '1');
  document.body.appendChild(overlay);
}

function route() {
  const hash = window.location.hash || '#home';
  const app = document.getElementById('app');
  if (!app) return;
  const [base, qs] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  if (base.startsWith('#hotel/')) { const slug = base.replace('#hotel/', ''); renderHotelDetail(slug); return; }
  if (base.startsWith('#tour/')) { const slug = base.replace('#tour/', ''); renderTourDetail(slug); return; }
  if (base.startsWith('#car/')) { const slug = base.replace('#car/', ''); renderCarDetail(slug); return; }
  if (base.startsWith('#gallery/')) { const slug = base.replace('#gallery/', ''); renderGalleryDetail(slug); return; }
  if (base.startsWith('#offer/')) { const id = base.replace('#offer/', ''); renderOfferDetail(parseInt(id)); return; }
  if (base.startsWith('#room/')) {
    const parts = base.replace('#room/', '').split('/');
    if (parts.length === 2) { renderRoomDetail(parts[0], parts[1]); return; }
  }
  if (base.startsWith('#page/')) { const slug = base.replace('#page/', ''); renderPage(slug); return; }
  if (base.startsWith('#destination/')) { const id = base.replace('#destination/', ''); renderDestinationDetail(parseInt(id) || id); return; }
  if (base.startsWith('#trip-progress/')) { const id = base.replace('#trip-progress/', ''); renderTripProgress(parseInt(id)); return; }
  if (base === '#my-trip') { renderMyTrip(); return; }
  switch (base) {
    case '#home': renderHome(); break;
    case '#destinations': renderDestinations(); break;
    case '#hotels': renderHotels(params.city); break;
    case '#trips': renderTours(); break;
    case '#cars': renderCars(); break;
    case '#gallery': renderGallery(); break;
    case '#offers': renderOffers(); break;
    case '#bookings': renderBookings(); break;
    case '#auth': renderAuth(); break;
    case '#signup': renderSignup(); break;
    case '#contact': renderContact(); break;
    case '#about': renderPage('about'); break;
    case '#privacy': renderPage('privacy-policy'); break;
    case '#terms': renderPage('terms-conditions'); break;
    case '#cancellation': renderPage('cancellation-policy'); break;
    case '#refund': renderPage('refund-policy'); break;
    case '#search': renderSearch(); break;
    default: renderNotFound(); break;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (currentToken) loadActiveTrip().then(() => updateNavbarUI());
}

// ============== RENDER FUNCTIONS ==============

function renderHome() {
  updateSEO(t('heroTitle'), t('heroSubtitle'));
  document.getElementById('app').innerHTML = `
    <section class="hero">
      <div class="hero__slides" id="hero-slides">
        <div class="hero__slide" style="background-image:url('/uploads/1781019692396-7kc63h.jpg')"></div>
        <div class="hero__slide" style="background-image:url('/uploads/1781019587201-ini4h.jpg')"></div>
        <div class="hero__slide" style="background-image:url('/uploads/1781019485083-h2vl7o.webp')"></div>
        <div class="hero__slide" style="background-image:url('/uploads/1781019461281-i2lvnn.jpg')"></div>
      </div>
      <div class="hero__overlay"></div>
      <div class="hero__content container" style="text-align:center;">
        <h1 class="hero__title hero__title--gold">${siteSettings['hero_title_' + currentLang] || t('heroTitle')}</h1>
        <p class="hero__subtitle hero__subtitle--gold">${siteSettings['hero_subtitle_' + currentLang] || t('heroSubtitle')}</p>
        <p style="color:var(--text-muted);font-size:1rem;max-width:800px;margin:0 auto 24px;line-height:1.8;">${currentLang === 'ar' ? 'يقدم لكم موقعنا الالكتروني العديد من العروض السياحية من فنادق وجولات سياحية باسعار مناسبة ومنافسة' : 'Our website offers many tourist offers, hotels and tours at suitable and competitive prices'}</p>
          <div class="hero__stats">
          <div class="hero__stat-card"><span class="hero__stat-value">🛡️</span><span class="hero__stat-label">${currentLang === 'ar' ? 'ثقة وأمان' : 'Trust & Security'}</span></div>
          <div class="hero__stat-card"><span class="hero__stat-value">⭐</span><span class="hero__stat-label">${currentLang === 'ar' ? 'اعتمادية وراحة' : 'Reliability & Comfort'}</span></div>
          <div class="hero__stat-card"><span class="hero__stat-value">🌍</span><span class="hero__stat-label">${currentLang === 'ar' ? 'متعة واستكشاف' : 'Fun & Exploration'}</span></div>
        </div>
        <div class="hero-login" id="hero-login-panel">
          <div class="hero-login__icon">✦</div>
          <h2 class="hero-login__title">${currentLang === 'ar' ? 'تسجيل الدخول' : 'Login'}</h2>
          <p class="hero-login__subtitle">${currentLang === 'ar' ? 'قم بتسجيل الدخول للوصول إلى الحجوزات وإدارة رحلاتك' : 'Sign in to access your bookings and manage your trips'}</p>
          <form id="hero-login-form" onsubmit="handleHeroLogin(event)">
            <div class="hero-login__field">
              <span class="hero-login__input-icon">✉</span>
              <input type="email" class="hero-login__input" name="email" placeholder="${currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email'}" required>
            </div>
            <div class="hero-login__field">
              <span class="hero-login__input-icon">📞</span>
              <select class="hero-login__input hero-login__select-cc" name="country_code" id="hero-login-cc">
                <option value="">${currentLang === 'ar' ? 'رمز الدولة' : 'Country Code'}</option>
              </select>
              <input type="tel" class="hero-login__input hero-login__input-phone" name="phone" placeholder="${currentLang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}">
            </div>
            <div class="hero-login__field">
              <span class="hero-login__input-icon">🔒</span>
              <input type="password" class="hero-login__input" name="password" id="hero-login-pwd" placeholder="${currentLang === 'ar' ? 'كلمة المرور' : 'Password'}" required>
              <button type="button" class="hero-login__pwd-toggle" onclick="toggleHeroPwd()" tabindex="-1">👁</button>
            </div>
            <div class="hero-login__options">
              <label class="hero-login__remember"><input type="checkbox" name="remember" checked><span>${currentLang === 'ar' ? 'تذكرني' : 'Remember Me'}</span></label>
              <a href="#auth" class="hero-login__forgot">${currentLang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</a>
            </div>
            <button class="hero-login__btn hero-login__btn--primary" type="submit" id="hero-login-submit">${currentLang === 'ar' ? 'تسجيل الدخول' : 'Login'}</button>
            <button class="hero-login__btn hero-login__btn--secondary" type="button" onclick="window.location.hash='#signup'">${currentLang === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}</button>
          </form>
        </div>
        <button onclick="var el=document.getElementById('home-offers-section')||document.getElementById('featured-hotels-section');if(el)el.scrollIntoView({behavior:'smooth'})" style="background:linear-gradient(135deg,var(--gold-primary),var(--gold-dark));color:var(--luxury-navy);border:none;padding:12px 36px;border-radius:50px;font-weight:700;font-size:1rem;cursor:pointer;margin-top:20px;box-shadow:0 4px 20px rgba(201,169,110,0.3);transition:all var(--transition-fast);">${currentLang === 'ar' ? 'للمزيد' : 'More'}</button>
      </div>
    </section>
    ${homepageSections.offers_visible !== false ? `
    <section class="section container" id="home-offers-section">
      <div class="section__header"><div><h2 class="section__title">${currentLang === 'ar' ? 'العروض' : 'Offers'}</h2><p class="section__subtitle">${currentLang === 'ar' ? 'عروض حصرية' : 'Exclusive deals'}</p></div><a href="#offers" class="btn btn--secondary btn--sm">${currentLang === 'ar' ? 'عرض الكل' : 'View All'} →</a></div>
      <div class="grid grid--auto" id="home-offers-grid"><p class="loading-text">${t('loading')}</p></div>
    </section>
    ` : ''}
    <section class="section container" id="featured-hotels-section">
      <div class="section__header"><div><h2 class="section__title">${t('ourHotels')}</h2><p class="section__subtitle">${currentLang === 'ar' ? 'أفخم الفنادق في سوريا' : 'The most luxurious hotels in Syria'}</p></div><a href="#hotels" class="btn btn--secondary btn--sm">${currentLang === 'ar' ? 'عرض الكل' : 'View All'} →</a></div>
      <div class="grid grid--auto" id="home-hotels-grid"><p class="loading-text">${t('loading')}</p></div>
    </section>
    <section class="section container">
      <div class="section__header"><div><h2 class="section__title">${t('ourTours')}</h2><p class="section__subtitle">${currentLang === 'ar' ? 'جولات سياحية مميزة' : 'Featured tour packages'}</p></div><a href="#trips" class="btn btn--secondary btn--sm">${currentLang === 'ar' ? 'عرض الكل' : 'View All'} →</a></div>
      <div class="grid grid--auto" id="home-tours-grid"><p class="loading-text">${t('loading')}</p></div>
    </section>
    <section class="section container">
      <div class="section__header"><div><h2 class="section__title">${t('ourCars')}</h2><p class="section__subtitle">${currentLang === 'ar' ? 'أسطول سيارات فاخرة' : 'Premium vehicle fleet'}</p></div><a href="#cars" class="btn btn--secondary btn--sm">${currentLang === 'ar' ? 'عرض الكل' : 'View All'} →</a></div>
      <div class="grid grid--auto" id="home-cars-grid"><p class="loading-text">${t('loading')}</p></div>
    </section>
    <section class="section container" id="home-gallery-section">
      <div class="section__header"><div><h2 class="section__title">${currentLang === 'ar' ? 'معرض الصور' : 'Gallery'}</h2><p class="section__subtitle">${currentLang === 'ar' ? 'صور الوجهات السياحية' : 'Tourist destination photos'}</p></div><a href="#gallery" class="btn btn--secondary btn--sm">${currentLang === 'ar' ? 'عرض الكل' : 'View All'} →</a></div>
      <div class="grid grid--auto" id="home-gallery-grid"><p class="loading-text">${t('loading')}</p></div>
    </section>`;
  API.get('/api/gallery').then(d => {
    const g = document.getElementById('home-gallery-grid');
    if (g) g.innerHTML = (d.gallery || []).map(item => galleryHomeCard(item)).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
  API.get('/api/offers').then(d => {
    const g = document.getElementById('home-offers-grid');
    if (g) g.innerHTML = (d.offers || []).map(o => offerCard(o)).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
  API.get('/api/hotels?featured=1').then(d => {
    const g = document.getElementById('home-hotels-grid');
    if (g) g.innerHTML = (d.hotels || []).map(h => hotelCard(h)).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
  API.get('/api/tours?featured=1').then(d => {
    const g = document.getElementById('home-tours-grid');
    if (g) g.innerHTML = (d.tours || []).map(t => tourCard(t)).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
  API.get('/api/vehicles?featured=1').then(d => {
    const g = document.getElementById('home-cars-grid');
    if (g) g.innerHTML = (d.vehicles || []).map(v => carCard(v)).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
  populateCountryCodes('hero-login-cc');
  if (currentToken) { const el = document.getElementById('hero-login-panel'); if (el) el.style.display = 'none'; }
}

function galleryHomeCard(item) {
  const name = currentLang === 'ar' && item.name_ar ? item.name_ar : item.name;
  const cover = item.cover_image || (item.images && item.images[0] ? item.images[0].image : '');
  return `<div class="card" onclick="window.location.hash='#gallery/${item.slug}'">
    <div class="card__image" style="background-image: url('${cover}')"></div>
    <div class="card__body"><h3 class="card__title">${name}</h3>
    <button class="btn btn--primary btn--sm" style="margin-top:12px;width:100%">${t('viewDetails')}</button></div></div>`;
}

function offerCard(o) {
  const title = currentLang === 'ar' && o.title_ar ? o.title_ar : o.title;
  const desc = currentLang === 'ar' && o.description_ar ? o.description_ar : o.description;
  const hasDisc = o.discount_value > 0;
  const disc = hasDisc ? (o.discount_type === 'percentage' ? o.discount_value + '%' : '$' + o.discount_value) : '';
  return `<div class="card" style="border:2px solid var(--gold-primary);cursor:pointer;" onclick="window.location.hash='#offer/${o.id}'">
    ${o.image ? `<div class="card__image" style="background-image: url('${o.image}')">${hasDisc ? `<div class="card__badge" style="background:var(--gold-primary);color:#000;">-${disc}</div>` : ''}</div>` : (hasDisc ? `<div class="card__badge" style="position:static;margin:12px 12px 0;background:var(--gold-primary);color:#000;display:inline-block;">-${disc}</div>` : '')}
    <div class="card__body"><h3 class="card__title">${title}</h3>${desc ? `<p class="card__text">${desc}</p>` : ''}
    <button class="btn btn--primary btn--sm" style="margin-top:12px;width:100%" onclick="event.stopPropagation();window.location.hash='#offer/${o.id}'">${currentLang === 'ar' ? 'احجز الآن' : 'Book Now'}</button></div></div>`;
}

function hotelCard(h) {
  const name = currentLang === 'ar' && h.name_ar ? h.name_ar : h.name;
  const city = currentLang === 'ar' && h.city_ar ? h.city_ar : h.city;
  const desc = currentLang === 'ar' && h.desc_ar ? h.desc_ar : h.desc;
  return `<div class="card" onclick="window.location.hash='#hotel/${h.slug}'">
    <div class="card__image" style="background-image: url('${h.cover_image || ''}')"><div class="card__badge">${'★'.repeat(h.rating)}</div></div>
    <div class="card__body"><h3 class="card__title">${name}</h3><p class="card__text">${desc || ''}</p>
    <div class="card__meta"><span>📍 ${city || ''}</span><span class="card__price">$${h.price} <small>${t('perNight')}</small></span></div>
    <button class="btn btn--primary btn--sm" style="margin-top:12px;width:100%">${t('viewDetails')}</button></div></div>`;
}

function tourCard(item) {
  const name = currentLang === 'ar' && item.name_ar ? item.name_ar : item.name;
  const dur = currentLang === 'ar' && item.duration_ar ? item.duration_ar : item.duration;
  const desc = currentLang === 'ar' && item.description_ar ? item.description_ar : item.description;
  return `<div class="card" onclick="window.location.hash='#tour/${item.slug}'">
    <div class="card__image" style="background-image: url('${item.image || ''}')"></div>
    <div class="card__body"><h3 class="card__title">${name}</h3><p class="card__text">${desc || ''}</p>
    <div class="card__meta"><span>⏱ ${dur || ''}</span><span class="card__price">$${item.price} <small>/ ${currentLang === 'ar' ? 'شخص' : 'person'}</small></span></div>
    <button class="btn btn--primary btn--sm" style="margin-top:12px;width:100%">${t('viewDetails')}</button></div></div>`;
}

function carCard(v) {
  const name = currentLang === 'ar' && v.name_ar ? v.name_ar : v.name;
  return `<div class="card" onclick="window.location.hash='#car/${v.slug}'">
    <div class="card__image" style="background-image: url('${v.image || ''}')"></div>
    <div class="card__body"><h3 class="card__title">${name}</h3><p class="card__text">${v.brand || ''} ${v.model || ''} (${v.year || ''})</p>
    <div class="card__meta"><span>👥 ${v.seats} ${t('seats')}</span><span class="card__price">$${v.price_per_day} <small>${t('perDay')}</small></span></div>
    <button class="btn btn--primary btn--sm" style="margin-top:12px;width:100%">${t('viewDetails')}</button></div></div>`;
}

function renderDestinations() {
  updateSEO(t('destinations'), 'Explore Syrian tourism destinations');
  document.getElementById('app').innerHTML = `<div class="container section"><div class="section__header"><div><h1 class="section__title">${t('destinations')}</h1><p class="section__subtitle">${currentLang === 'ar' ? 'استكشف أجمل الوجهات السياحية في سوريا' : 'Explore the most beautiful tourist destinations in Syria'}</p></div></div>
    <div class="grid grid--auto" id="destinations-grid"><p class="loading-text">${t('loading')}</p></div></div>`;
  API.get('/api/cities').then(d => {
    const g = document.getElementById('destinations-grid');
    if (!g) return;
    const cities = d.cities || [];
    if (cities.length === 0) { g.innerHTML = '<p>' + t('noResults') + '</p>'; return; }
    g.innerHTML = cities.map(c => {
      const name = currentLang === 'ar' && c.name_ar ? c.name_ar : c.name;
      const desc = currentLang === 'ar' && c.description_ar ? c.description_ar : c.description;
      const img = c.image || '';
      return `<div class="card" onclick="window.location.hash='#destination/${c.id}'">
        <div class="card__image" style="background-image: url('${img}');background-size:cover;background-position:center;"><div class="card__badge">✦ ${c.hotel_count || 0} ${currentLang === 'ar' ? 'فندق' : 'Hotels'}</div></div>
        <div class="card__body"><h3 class="card__title">${name}</h3><p class="card__text">${desc || ''}</p>
        <button class="btn btn--primary btn--sm" style="margin-top:12px;width:100%">${t('viewDetails')}</button></div></div>`;
    }).join('');
  }).catch(() => {});
}

function renderDestinationDetail(id) {
  updateSEO('Destination', '');
  document.getElementById('app').innerHTML = `<div class="container section"><p class="loading-text">${t('loading')}</p></div>`;
  API.get(`/api/cities/${id}`).then(d => {
    const c = Array.isArray(d.city) ? d.city[0] : d.city;
    if (!c) { renderNotFound(); return; }
    const name = currentLang === 'ar' && c.name_ar ? c.name_ar : c.name;
    const desc = currentLang === 'ar' && c.description_ar ? c.description_ar : c.description;
    const activities = currentLang === 'ar' && c.activities_ar && c.activities_ar.length ? c.activities_ar : (c.activities || []);
    const images = c.images || [];
    updateSEO(name, desc || '');
    const galleryId = 'dest-' + c.id;
    const mainImg = images.length > 0 ? images[0].image : (c.image || '');
    const galleryHtml = images.length > 0 ? `
      <div class="detail-card">
        <h2>${currentLang === 'ar' ? 'معرض الصور' : 'Gallery'}</h2>
        <div class="rg" id="rg-${galleryId}" style="margin-top:15px;">
          <div class="rg__main">
            <button class="rg__arrow rg__arrow--prev" onclick="prevRoomImage('${galleryId}')" aria-label="${currentLang === 'ar' ? 'السابق' : 'Previous'}">‹</button>
            <div class="rg__wrap" id="rg-wrap-${galleryId}">
              <img id="rg-img-${galleryId}" class="rg__img" src="${images[0].image}" alt="${name}">
            </div>
            <button class="rg__arrow rg__arrow--next" onclick="nextRoomImage('${galleryId}')" aria-label="${currentLang === 'ar' ? 'التالي' : 'Next'}">›</button>
            <div class="rg__counter" id="rg-counter-${galleryId}">1 / ${images.length}</div>
            <button class="rg__fs" onclick="fullscreenRoomGallery('${galleryId}')" aria-label="Fullscreen">⛶</button>
          </div>
          <div class="rg__thumbs">${images.map((img, i) => `
            <img src="${img.image}" class="rg-thumb" data-rg-thumb="${galleryId}" onclick="goToRoomImage('${galleryId}', ${i})" alt="${img.title || ''}" loading="lazy">`).join('')}
          </div>
        </div>
      </div>` : '';
    const hotelsHtml = (c.hotels || []).map(h => hotelCard(h)).join('');
    const actsHtml = activities.length > 0 ? activities.map(a =>
      `<div class="amenity-item"><span class="amenity-icon">✦</span><span>${a}</span></div>`
    ).join('') : '';
    document.getElementById('app').innerHTML = `
      <div class="container section">
        <div class="detail__hero" style="height:350px;">
          <img src="${mainImg}" class="detail__hero-img" alt="${name}" loading="lazy">
          <div class="detail__hero-overlay"></div>
          <div class="detail__hero-content">
            <h1 style="font-size:2.5rem;margin-bottom:10px;">${name}</h1>
          </div>
        </div>
        <div class="detail-layout">
          <div>
            ${desc ? `<div class="detail-card"><h2>${currentLang === 'ar' ? 'عن الوجهة' : 'About'}</h2><p style="line-height:1.8;">${desc}</p></div>` : ''}
            ${actsHtml ? `<div class="detail-card"><h2>${currentLang === 'ar' ? 'الأنشطة المتاحة' : 'Available Activities'}</h2><div class="amenity-grid">${actsHtml}</div></div>` : ''}
            ${galleryHtml}
          </div>
          <div>
            <div class="booking-sidebar">
              <h3 style="border-bottom:1px solid var(--border-color);padding-bottom:12px;margin-bottom:20px;">${currentLang === 'ar' ? 'فنادق الوجهة' : 'Hotels in ' + name}</h3>
              <div class="grid grid--auto">${hotelsHtml || '<p style="color:var(--text-muted);font-size:0.9rem;">' + (currentLang === 'ar' ? 'لا توجد فنادق متاحة' : 'No hotels available') + '</p>'}</div>
            </div>
          </div>
        </div>
      </div>`;
    if (images.length > 0) initRoomGallery(galleryId, images.map(img => ({ image: img.image })), 0);
  }).catch(() => renderNotFound());
}

function renderHotels(cityId) {
  updateSEO(t('ourHotels'), 'Browse our curated selection of luxury hotels in Syria');
  document.getElementById('app').innerHTML = `<div class="container section"><div class="section__header"><div><h1 class="section__title">${t('ourHotels')}</h1><p class="section__subtitle">${currentLang === 'ar' ? 'تصفح مجموعة مختارة من أفخم الفنادق في سوريا' : 'Browse our curated selection of luxury hotels in Syria'}</p>${cityId ? '<a href="#hotels" class="btn btn--secondary btn--sm">← ' + (currentLang === 'ar' ? 'جميع الفنادق' : 'All Hotels') + '</a>' : ''}</div></div>
    <div class="grid grid--auto" id="hotels-grid"><p class="loading-text">${t('loading')}</p></div></div>`;
  API.get('/api/hotels' + (cityId ? `?city_id=${cityId}` : '')).then(d => {
    const g = document.getElementById('hotels-grid');
    if (g) g.innerHTML = (d.hotels || []).map(h => hotelCard(h)).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
}

function renderHotelDetail(slug) {
  updateSEO('Hotel', 'Loading...');
  document.getElementById('app').innerHTML = `<div class="container section"><p class="loading-text">${t('loading')}</p></div>`;
  API.get(`/api/hotels/${slug}`).then(d => {
    const h = d.hotel;
    if (!h) { renderNotFound(); return; }
    const name = currentLang === 'ar' && h.name_ar ? h.name_ar : h.name;
    const city = currentLang === 'ar' && h.city_ar ? h.city_ar : h.city;
    const addr = currentLang === 'ar' && h.address_ar ? h.address_ar : h.address;
    const desc = currentLang === 'ar' && h.long_desc_ar ? h.long_desc_ar : h.long_desc;
    const amenities = h.amenities || [];
    updateSEO(name, desc, h.cover_image);
    const galleryHtml = (h.images || []).map(img => `
      <div class="gallery__item" onclick="openLightbox('${img.image}')">
        <img src="${img.image}" class="gallery__img" alt="${img.title || name}" loading="lazy">
      </div>`).join('');
    const amHtml = amenities.map(a => `
      <div class="amenity-item"><span class="amenity-icon">✦</span><span>${a}</span></div>`).join('');
    const roomsHtml = (h.rooms || []).map(r => {
      const rn = currentLang === 'ar' && r.name_ar ? r.name_ar : r.name;
      const rd = currentLang === 'ar' && r.description_ar ? r.description_ar : r.description;
      const bt = currentLang === 'ar' && r.bed_type_ar ? r.bed_type_ar : r.bed_type;
      return `<div class="room-card" onclick="window.location.hash='#room/${h.slug}/${r.slug}'">
        <img src="${(r.images && r.images[0]) ? r.images[0].image : ''}" class="room-card__img" alt="${rn}" loading="lazy">
        <div class="room-card__info"><div><h3>${rn}</h3><p style="font-size:0.85rem;color:var(--text-muted);margin-top:5px;">${rd || ''}</p>
        <div class="room-card__specs"><span>📐 ${r.size || ''}</span><span>👥 ${r.capacity || ''}</span><span>🛏 ${bt || ''}</span></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
          <span style="font-weight:700;color:var(--gold-primary);font-size:1.15rem;">$${r.price} ${t('perNight')}</span>
          <button class="btn btn--primary btn--sm">${t('viewRoom')}</button></div></div></div>`;
    }).join('');
    document.getElementById('app').innerHTML = `
      <div class="container section">
        <div class="detail__hero"><img src="${h.cover_image}" class="detail__hero-img" alt="${name}" loading="lazy">
          <div class="detail__hero-overlay"></div>
          <div class="detail__hero-content"><div class="detail__star-rating">${'★'.repeat(h.rating)}</div>
            <h1 style="font-size:2.5rem;margin-bottom:10px;">${name}</h1>
            <p style="color:rgba(255,255,255,0.85);">📍 ${addr || city || ''}</p></div></div>
        <div class="detail-layout">
          <div>
            <div class="detail-card"><h2>${t('overview')}</h2><p style="margin:15px 0;line-height:1.8;">${desc || ''}</p>
              <h3 style="margin-top:30px;">${t('amenities')}</h3><div class="amenity-grid">${amHtml}</div></div>
            ${galleryHtml ? `<div class="detail-card"><h2>${t('gallery_title')}</h2><div class="gallery">${galleryHtml}</div></div>` : ''}
            <div class="detail-card"><h2>${t('rooms')}</h2><div>${roomsHtml || '<p>' + t('noResults') + '</p>'}</div></div>
            ${h.lat && h.lng ? `<div class="detail-card"><h2>${t('location')}</h2>
              <div id="map-container" style="height:300px;border-radius:var(--radius-md);overflow:hidden;margin-top:15px;">
                <iframe width="100%" height="100%" frameborder="0" style="border:0" src="https://www.openstreetmap.org/export/embed.html?bbox=${h.lng-0.05},${h.lat-0.05},${h.lng+0.05},${h.lat+0.05}&layer=mapnik" allowfullscreen></iframe>
              </div></div>` : ''}
          </div>
          <div><div class="booking-sidebar">
            <h3 style="font-family:var(--font-display);border-bottom:1px solid var(--border-color);padding-bottom:12px;margin-bottom:20px;">${t('bookNow')}</h3>
            <form id="hotel-booking-form" onsubmit="handleHotelBooking(event, '${h.id}', '${name.replace(/'/g, "\\'")}')">
              <div class="booking-form__group"><label class="booking-form__label">${t('fullName')} *</label>
                <input type="text" class="booking-form__input" name="customer_name" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('countryCode')}</label>
                <select class="booking-form__input" name="country_code" id="country-code-select"></select></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('phone')} *</label>
                <input type="tel" class="booking-form__input" name="customer_phone" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('whatsapp')} *</label>
                <input type="tel" class="booking-form__input" name="customer_whatsapp" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('roomType')}</label>
                <select class="booking-form__input" name="room_id" id="bf-room">
                  ${(h.rooms || []).map(r => `<option value="${r.id}|${(currentLang === 'ar' && r.name_ar ? r.name_ar : r.name)}">${currentLang === 'ar' && r.name_ar ? r.name_ar : r.name} - $${r.price}</option>`).join('')}
                </select></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('checkIn')}</label>
                <input type="date" class="booking-form__input" name="check_in" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('checkOut')}</label>
                <input type="date" class="booking-form__input" name="check_out" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('guests')}</label>
                <input type="number" class="booking-form__input" name="guests" min="1" max="10" value="2" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('specialRequests')}</label>
                <textarea class="booking-form__input" name="special_requests" rows="3"></textarea></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('paymentMethod')}</label>
                <input type="hidden" name="payment_method" value="bank_transfer">
                <div id="pm-hotel-${h.id}"></div></div>
              <div class="booking-form__group">
                <label class="booking-form__label" id="avail-label-hotel-${h.id}">${currentLang==='ar'?'التحقق من التوفر':'Check Availability'}</label>
                <div id="avail-indicator-hotel-${h.id}"></div>
              </div>
              <button class="btn btn--primary btn--block btn--lg" type="submit">💬 ${t('bookNow')}</button>
              <button class="btn btn--secondary btn--block btn--lg" type="button" onclick="saveHotelBooking(this.form, '${h.id}', '${name.replace(/'/g, "\\'")}')" style="margin-top:8px;">📋 ${currentLang === 'ar' ? 'حجز' : 'Save Booking'}</button>
            </form></div>
          </div>
        </div>
      </div>
      <div id="lightbox" class="lightbox" onclick="closeLightbox()">
        <div class="lightbox__content"><button class="lightbox__close">✕</button><img id="lightbox-img" class="lightbox__img" src="" alt=""></div>
      </div>`;
    populateCountryCodes();
    renderPaymentMethodCards('pm-hotel-' + h.id, 'payment_method', 'bank_transfer');
  // Load availability indicator
  (function checkAvail() {
    var checkIn = document.querySelector('#hotel-booking-form [name="check_in"]');
    var checkOut = document.querySelector('#hotel-booking-form [name="check_out"]');
    var availEl = document.getElementById('avail-indicator-hotel-${h.id}');
    if (!checkIn || !checkOut || !availEl) return;
    function updateAvail() {
      if (!checkIn.value || !checkOut.value) { availEl.innerHTML = ''; return; }
      availEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;">' + (currentLang==='ar'?'جاري التحقق...':'Checking...') + '</span>';
      fetch('/api/availability?item_type=room&item_id=${h.id}&start_date='+checkIn.value+'&end_date='+checkOut.value)
        .then(function(r){return r.json()}).then(function(d){
          if (d && d.dates) {
            var booked = d.dates.filter(function(x){return !x.available});
            if (booked.length > 0) {
              availEl.innerHTML = '<span style="color:var(--danger);font-size:0.8rem;">⚠ ' + (currentLang==='ar'?'غير متوفر في بعض الأيام':'Not available on some dates') + '</span>';
            } else {
              availEl.innerHTML = '<span style="color:var(--success);font-size:0.8rem;">✅ ' + (currentLang==='ar'?'متوفر':'Available') + '</span>';
            }
          }
        }).catch(function(){});
    }
    checkIn.addEventListener('change', updateAvail);
    checkOut.addEventListener('change', updateAvail);
    updateAvail();
  })();
  }).catch(() => renderNotFound());
}

function requireAuth() {
  if (!currentToken) { showToast(currentLang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first', 'error'); window.location.hash = '#auth'; return false; }
  return true;
}

function validateBookingForm(form, fields) {
  const missing = [];
  for (const f of fields) {
    const el = form.querySelector(`[name="${f}"]`);
    if (!el || !el.value.trim()) missing.push(f);
  }
  if (missing.length > 0) {
    showToast(currentLang === 'ar' ? `يرجى ملء جميع الحقول المطلوبة: ${missing.join(', ')}` : `Please fill all required fields: ${missing.join(', ')}`, 'error');
    return false;
  }
  return true;
}

async function saveBookingToAdmin(data) {
  if (!requireAuth()) return null;
  if (!data.customer_name || !data.customer_phone || !data.customer_whatsapp) {
    showToast(currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', 'error'); return null;
  }
  try {
    const res = await API.post('/api/bookings', data);
    showToast(t('bookSuccess'));
    return res.booking || null;
  } catch (err) { showToast(t('bookSuccess'), 'success'); return null; }
}

function redirectToPayment(booking, payMethod) {
  if (!booking || !booking.id) return;
  const name = encodeURIComponent(booking.customer_name || '');
  const amt = booking.total || 0;
  const base = '/payment/';
  let page = null;
  if (payMethod === 'bank_transfer') page = 'bank-transfer';
  else if (payMethod === 'deposit') page = 'deposit';
  else if (payMethod === 'agent_payment') page = 'agent';
  if (page) {
    setTimeout(() => { window.location.href = `${base}${page}?booking_id=${booking.id}&customer_name=${name}&amount=${amt}`; }, 1500);
  }
}

async function saveHotelBooking(form, hotelId, hotelName) {
  if (!validateBookingForm(form, ['customer_name', 'customer_phone', 'customer_whatsapp', 'check_in', 'check_out'])) return;
  const f = form;
  const roomVal = f.room_id.value;
  const payMethod = f.payment_method?.value || 'bank_transfer';
  const roomPrice = document.querySelector(`#bf-room option[value="${f.room_id.value}"]`)?.textContent?.match(/\$(\d+)/);
  const pricePerNight = roomPrice ? parseFloat(roomPrice[1]) : 0;
  const nights = f.check_in.value && f.check_out.value ? Math.max(1, Math.round((new Date(f.check_out.value) - new Date(f.check_in.value)) / (86400000))) : 1;
  const total = pricePerNight * nights;
  const booking = await saveBookingToAdmin({
    customer_name: f.customer_name.value, customer_phone: f.customer_phone.value,
    customer_whatsapp: f.customer_whatsapp.value, country_code: f.country_code.value,
    booking_type: 'hotel', item_id: parseInt(hotelId), item_name: hotelName,
    room_id: parseInt(roomVal ? roomVal.split('|')[0] : 0) || 0,
    room_name: roomVal ? roomVal.split('|')[1] : '',
    check_in: f.check_in.value, check_out: f.check_out.value,
    guests: parseInt(f.guests.value) || 1, total: total, special_requests: f.special_requests.value,
    payment_method: payMethod
  });
  redirectToPayment(booking, payMethod);
}

async function handleHotelBooking(e, hotelId, hotelName) {
  if (!requireAuth()) return;
  e.preventDefault();
  const f = e.target;
  if (!validateBookingForm(f, ['customer_name', 'customer_phone', 'customer_whatsapp', 'check_in', 'check_out'])) return;
  const name = f.customer_name.value;
  const phone = f.customer_phone.value;
  const whatsapp = f.customer_whatsapp.value;
  const countryCode = f.country_code.value;
  if (!phone) { showToast(t('phone') + ' ' + t('required'), 'error'); return; }
  if (!whatsapp) { showToast(t('whatsapp') + ' ' + t('required'), 'error'); return; }
  const roomVal = f.room_id.value;
  const roomId = roomVal ? roomVal.split('|')[0] : '';
  const roomName = roomVal ? roomVal.split('|')[1] : '';
  const checkIn = f.check_in.value;
  const checkOut = f.check_out.value;
  const guests = f.guests.value;
  const requests = f.special_requests.value;
  const payMethod = f.payment_method?.value || 'bank_transfer';
  const msg = `طلب حجز جديد - Syria Travel:
👤 الاسم: ${name}
📞 الهاتف: ${countryCode} ${phone}
💬 واتساب: ${whatsapp}
🏨 الفندق: ${hotelName}
🛏 الغرفة: ${roomName}
📅 من: ${checkIn}
📅 إلى: ${checkOut}
👥 الضيوف: ${guests}
💳 الدفع: ${payMethod}
📝 ملاحظات: ${requests}`;
  const roomPrice = document.querySelector(`#bf-room option[value="${f.room_id.value}"]`)?.textContent?.match(/\$(\d+)/);
  const pricePerNight = roomPrice ? parseFloat(roomPrice[1]) : 0;
  const nights = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / (86400000))) : 1;
  const total = pricePerNight * nights;
  try {
    const res = await API.post('/api/bookings', {
      customer_name: name, customer_phone: phone, customer_whatsapp: whatsapp, country_code: countryCode,
      booking_type: 'hotel', item_id: parseInt(hotelId), item_name: hotelName,
      room_id: parseInt(roomId) || 0, room_name: roomName,
      check_in: checkIn, check_out: checkOut, guests: parseInt(guests), total: total, special_requests: requests,
      payment_method: payMethod
    });
    showToast(t('bookSuccess'));
    openWhatsApp(msg);
  } catch (err) { showToast(t('bookSuccess'), 'success'); }
}

function renderRoomDetail(hotelSlug, roomSlug) {
  updateSEO('Room Details', '');
  document.getElementById('app').innerHTML = `<div class="container section"><p class="loading-text">${t('loading')}</p></div>`;
  API.get(`/api/hotels/${hotelSlug}`).then(hd => {
    const hotel = hd.hotel;
    if (!hotel) { renderNotFound(); return; }
    const room = (hotel.rooms || []).find(r => r.slug === roomSlug);
    if (!room) { renderNotFound(); return; }
    const rn = currentLang === 'ar' && room.name_ar ? room.name_ar : room.name;
    const rd = currentLang === 'ar' && room.description_ar ? room.description_ar : room.description;
    const bt = currentLang === 'ar' && room.bed_type_ar ? room.bed_type_ar : room.bed_type;
    const services = room.services || [];
    const amenities = room.amenities || [];
    updateSEO(rn, rd);
    const images = room.images || [];
    const mainImg = images.length > 0 ? images[0].image : '';
    const galleryId = roomSlug;
    const galleryHtml = images.length > 0 ? `
      <div class="detail-card">
        <div class="rg" id="rg-${galleryId}">
          <div class="rg__main">
            <button class="rg__arrow rg__arrow--prev" onclick="prevRoomImage('${galleryId}')" aria-label="${currentLang === 'ar' ? 'السابق' : 'Previous'}">‹</button>
            <div class="rg__wrap" id="rg-wrap-${galleryId}">
              <img id="rg-img-${galleryId}" class="rg__img" src="${images[0].image}" alt="${rn}">
            </div>
            <button class="rg__arrow rg__arrow--next" onclick="nextRoomImage('${galleryId}')" aria-label="${currentLang === 'ar' ? 'التالي' : 'Next'}">›</button>
            <div class="rg__counter" id="rg-counter-${galleryId}">1 / ${images.length}</div>
            <button class="rg__fs" onclick="fullscreenRoomGallery('${galleryId}')" aria-label="${currentLang === 'ar' ? 'ملء الشاشة' : 'Fullscreen'}">⛶</button>
          </div>
          <div class="rg__thumbs">${images.map((img, i) => `
            <img src="${img.image}" class="rg-thumb" data-rg-thumb="${galleryId}" onclick="goToRoomImage('${galleryId}', ${i})" alt="${img.title || ''}" loading="lazy">`).join('')}
          </div>
        </div>
      </div>
      </div>` : '';
    const hotelName = currentLang === 'ar' && hotel.name_ar ? hotel.name_ar : hotel.name;
    document.getElementById('app').innerHTML = `
      <div class="container section">
        <a href="#hotel/${hotelSlug}" class="btn btn--secondary btn--sm" style="margin-bottom:20px;">← ${currentLang === 'ar' ? 'العودة للفندق' : 'Back to Hotel'}</a>
        <div class="detail__hero" style="height:400px;">
          <img src="${mainImg || hotel.cover_image}" class="detail__hero-img" alt="${rn}" loading="lazy">
          <div class="detail__hero-overlay"></div>
          <div class="detail__hero-content">
            <h1 style="font-size:2.5rem;margin-bottom:10px;">${rn}</h1>
            <p style="color:rgba(255,255,255,0.85);">${hotelName} - ${hotel.city || ''}</p>
          </div>
        </div>
        <div class="detail-layout">
          <div>
            <div class="detail-card"><h2>${t('roomDetails')}</h2>
              <p style="margin:15px 0;line-height:1.8;">${rd || ''}</p>
              <div class="room-specs-grid">
                <div class="room-spec-item"><span class="room-spec-label">${t('capacity')}</span><span class="room-spec-value">👥 ${room.capacity || ''}</span></div>
                <div class="room-spec-item"><span class="room-spec-label">${t('size')}</span><span class="room-spec-value">📐 ${room.size || ''}</span></div>
                <div class="room-spec-item"><span class="room-spec-label">${t('bedType')}</span><span class="room-spec-value">🛏 ${bt || ''}</span></div>
                <div class="room-spec-item"><span class="room-spec-label">${t('price')}</span><span class="room-spec-value" style="color:var(--gold-primary);font-weight:700;">$${room.price} ${t('perNight')}</span></div>
              </div>
            </div>
            ${services.length > 0 ? `<div class="detail-card"><h3>${t('roomServices')}</h3><div class="amenity-grid">${services.map(s => `<div class="amenity-item"><span class="amenity-icon">✦</span><span>${s}</span></div>`).join('')}</div></div>` : ''}
            ${amenities.length > 0 ? `<div class="detail-card"><h3>${t('roomAmenities')}</h3><div class="amenity-grid">${amenities.map(a => `<div class="amenity-item"><span class="amenity-icon">✦</span><span>${a}</span></div>`).join('')}</div></div>` : ''}
            ${galleryHtml}
          </div>
          <div><div class="booking-sidebar">
            <h3 style="font-family:var(--font-display);border-bottom:1px solid var(--border-color);padding-bottom:12px;margin-bottom:20px;">${t('bookNow')}</h3>
            <form id="room-booking-form" onsubmit="handleRoomBooking(event, '${hotel.id}', '${hotelName.replace(/'/g, "\\'")}', '${room.id}', '${rn.replace(/'/g, "\\'")}')">
              <div class="booking-form__group"><label class="booking-form__label">${t('fullName')} *</label><input type="text" class="booking-form__input" name="customer_name" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('countryCode')}</label><select class="booking-form__input" name="country_code" id="country-code-select-r"></select></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('phone')} *</label><input type="tel" class="booking-form__input" name="customer_phone" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('whatsapp')} *</label><input type="tel" class="booking-form__input" name="customer_whatsapp" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('checkIn')}</label><input type="date" class="booking-form__input" name="check_in" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('checkOut')}</label><input type="date" class="booking-form__input" name="check_out" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('guests')}</label><input type="number" class="booking-form__input" name="guests" min="1" value="2" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('specialRequests')}</label><textarea class="booking-form__input" name="special_requests" rows="3"></textarea></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('paymentMethod')}</label>
                <input type="hidden" name="payment_method" value="bank_transfer">
                <div id="pm-room-${room.id}"></div></div>
              <div style="display:flex;gap:10px;margin-top:16px;">
                <button class="btn btn--primary" type="submit">💬 ${t('bookNow')}</button>
                <button class="btn btn--secondary" type="button" onclick="saveRoomBooking(this.form, '${hotel.id}', '${hotelName.replace(/'/g, "\\'")}', '${room.id}', '${rn.replace(/'/g, "\\'")}')">📋 ${currentLang === 'ar' ? 'حجز' : 'Save Booking'}</button>
              </div>
            </form></div>
          </div>
        </div>
      </div>
      <div id="lightbox" class="lightbox" onclick="closeLightbox()">
        <div class="lightbox__content"><button class="lightbox__close">✕</button><img id="lightbox-img" class="lightbox__img" src="" alt=""></div>
      </div>`;
    populateCountryCodes();
    renderPaymentMethodCards('pm-room-' + room.id, 'payment_method', 'bank_transfer');
    if (images.length > 0) initRoomGallery(galleryId, images.map(i => ({ image: i.image })), 0);
  }).catch(() => renderNotFound());
}

function saveRoomBooking(form, hotelId, hotelName, roomId, roomName) {
  if (!validateBookingForm(form, ['customer_name', 'customer_phone', 'customer_whatsapp', 'check_in', 'check_out'])) return;
  const f = form;
  saveBookingToAdmin({
    customer_name: f.customer_name.value, customer_phone: f.customer_phone.value,
    customer_whatsapp: f.customer_whatsapp.value, country_code: f.country_code.value,
    booking_type: 'room', item_id: parseInt(hotelId), item_name: hotelName,
    room_id: parseInt(roomId), room_name: roomName,
    check_in: f.check_in.value, check_out: f.check_out.value,
    guests: parseInt(f.guests.value) || 1, special_requests: f.special_requests.value,
    payment_method: f.payment_method?.value || 'bank_transfer'
  });
}

function handleRoomBooking(e, hotelId, hotelName, roomId, roomName) {
  if (!requireAuth()) return;
  e.preventDefault();
  const f = e.target;
  if (!validateBookingForm(f, ['customer_name', 'customer_phone', 'customer_whatsapp', 'check_in', 'check_out'])) return;
  const name = f.customer_name.value;
  const phone = f.customer_phone.value;
  const whatsapp = f.customer_whatsapp.value;
  const cc = f.country_code.value;
  if (!phone) { showToast(t('phone') + ' ' + t('required'), 'error'); return; }
  if (!whatsapp) { showToast(t('whatsapp') + ' ' + t('required'), 'error'); return; }
  const checkIn = f.check_in.value;
  const checkOut = f.check_out.value;
  const guests = f.guests.value;
  const reqs = f.special_requests.value;
  const payMethod = f.payment_method?.value || 'bank_transfer';
  const msg = `حجز غرفة - Syria Travel:
👤 الاسم: ${name}
📞 الهاتف: ${cc} ${phone}
💬 واتساب: ${whatsapp}
🏨 الفندق: ${hotelName}
🛏 الغرفة: ${roomName}
📅 من: ${checkIn}
📅 إلى: ${checkOut}
👥 الضيوف: ${guests}
💳 الدفع: ${payMethod}
📝 ملاحظات: ${reqs}`;
  API.post('/api/bookings', { customer_name: name, customer_phone: phone, customer_whatsapp: whatsapp, country_code: cc, booking_type: 'room', item_id: parseInt(hotelId), item_name: hotelName, room_id: parseInt(roomId), room_name: roomName, check_in: checkIn, check_out: checkOut, guests: parseInt(guests), special_requests: reqs, payment_method: payMethod }).then(() => { showToast(t('bookSuccess')); openWhatsApp(msg); }).catch(() => showToast(t('bookSuccess'), 'success'));
}

function renderTours() {
  updateSEO(t('ourTours'), 'Explore our premium tour packages across Syria');
  document.getElementById('app').innerHTML = `<div class="container section"><div class="section__header"><div><h1 class="section__title">${t('ourTours')}</h1><p class="section__subtitle">${currentLang === 'ar' ? 'اكتشف باقات الجولات السياحية المميزة' : 'Discover our premium tour packages'}</p></div></div>
    <div class="grid grid--auto" id="tours-grid"><p class="loading-text">${t('loading')}</p></div></div>`;
  API.get('/api/tours').then(d => {
    const g = document.getElementById('tours-grid');
    if (g) g.innerHTML = (d.tours || []).map(item => tourCard(item)).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
}

function renderTourDetail(slug) {
  updateSEO('Tour', 'Loading...');
  document.getElementById('app').innerHTML = `<div class="container section"><p class="loading-text">${t('loading')}</p></div>`;
  API.get(`/api/tours/${slug}`).then(d => {
    const tour = d.tour;
    if (!tour) { renderNotFound(); return; }
    const name = currentLang === 'ar' && tour.name_ar ? tour.name_ar : tour.name;
    const desc = currentLang === 'ar' && tour.description_ar ? tour.description_ar : tour.description;
    const dur = currentLang === 'ar' && tour.duration_ar ? tour.duration_ar : tour.duration;
    const included = currentLang === 'ar' && tour.included_ar && tour.included_ar.length ? tour.included_ar : (tour.included || []);
    updateSEO(name, desc, tour.image);
    const itineraryByDay = {};
    (tour.itinerary || []).forEach(it => {
      if (!itineraryByDay[it.day]) itineraryByDay[it.day] = [];
      itineraryByDay[it.day].push(it);
    });
    const dayKeys = Object.keys(itineraryByDay).sort((a, b) => parseInt(a) - parseInt(b));
    const itineraryHtml = dayKeys.map(day => `
      <div style="margin-bottom:24px;">
        <h3 style="color:var(--gold-primary);margin-bottom:12px;font-family:var(--font-display);">${currentLang === 'ar' ? 'اليوم' : 'Day'} ${day}</h3>
        ${itineraryByDay[day].map(it => `
          <div class="timeline__item"><div class="timeline__dot"></div>
            <h4>${currentLang === 'ar' && it.title_ar ? it.title_ar : it.title}</h4>
            ${it.description ? `<p>${currentLang === 'ar' && it.description_ar ? it.description_ar : it.description}</p>` : ''}
          </div>`).join('')}
      </div>`).join('');
    const includedHtml = included.map(i => `<div style="display:flex;align-items:center;gap:8px;"><span style="color:var(--gold-primary);">✔</span><span>${i}</span></div>`).join('');
    const galleryHtml = (tour.images || []).map(img =>
      `<div class="gallery__item" onclick="openLightbox('${img.image}')"><img src="${img.image}" class="gallery__img" alt="${img.title || name}" loading="lazy"></div>`
    ).join('');
    document.getElementById('app').innerHTML = `
      <div class="container section">
        <div class="detail__hero" style="height:350px;"><img src="${tour.image}" class="detail__hero-img" alt="${name}" loading="lazy">
          <div class="detail__hero-overlay"></div><div class="detail__hero-content"><span class="card__badge" style="position:static;">✦ ${dur || ''}</span>
          <h1 style="font-size:2.4rem;margin-top:12px;">${name}</h1></div></div>
        <div class="detail-layout">
          <div>
            <div class="detail-card"><h2>${t('overview')}</h2><p style="margin:15px 0;line-height:1.8;">${desc || ''}</p>
              <h3 style="margin-top:30px;margin-bottom:15px;">${t('included')}</h3><div class="grid grid--2">${includedHtml}</div></div>
            ${galleryHtml ? `<div class="detail-card"><h2>${t('gallery_title')}</h2><div class="gallery">${galleryHtml}</div></div>` : ''}
            ${itineraryHtml ? `<div class="detail-card"><h2 style="margin-bottom:20px;">${t('itinerary')}</h2><div class="timeline">${itineraryHtml}</div></div>` : ''}
          </div>
          <div><div class="booking-sidebar">
            <h3 style="border-bottom:1px solid var(--border-color);padding-bottom:12px;margin-bottom:20px;">${t('bookTour')}</h3>
            <form id="tour-booking-form" onsubmit="handleTourBooking(event, '${tour.id}', '${name.replace(/'/g, "\\'")}')">
              <div class="booking-form__group"><label class="booking-form__label">${t('fullName')} *</label><input type="text" class="booking-form__input" name="customer_name" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('countryCode')}</label><select class="booking-form__input" name="country_code" id="country-code-select-t"></select></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('phone')} *</label><input type="tel" class="booking-form__input" name="customer_phone" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('whatsapp')} *</label><input type="tel" class="booking-form__input" name="customer_whatsapp" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('travelDate')}</label><input type="date" class="booking-form__input" name="travel_date" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('travelers')}</label><input type="number" class="booking-form__input" name="travelers" min="1" max="20" value="1" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('paymentMethod')}</label>
                <input type="hidden" name="payment_method" value="bank_transfer">
                <div id="pm-tour-${tour.id}"></div></div>
              <div style="display:flex;gap:10px;margin-top:16px;">
                <button class="btn btn--primary" type="submit">💬 ${t('bookNow')}</button>
                <button class="btn btn--secondary" type="button" onclick="saveTourBooking(this.form)">📋 ${currentLang === 'ar' ? 'حجز' : 'Save Booking'}</button>
              </div>
            </form></div>
          </div>
        </div>
      </div>
      <div id="lightbox" class="lightbox" onclick="closeLightbox()"><div class="lightbox__content"><button class="lightbox__close">✕</button><img id="lightbox-img" class="lightbox__img" src="" alt=""></div></div>`;
    populateCountryCodes();
    renderPaymentMethodCards('pm-tour-' + tour.id, 'payment_method', 'bank_transfer');
  }).catch(() => renderNotFound());
}

async function saveTourBooking(form, tourId, tourName) {
  if (!validateBookingForm(form, ['customer_name', 'customer_phone', 'customer_whatsapp', 'travel_date'])) return;
  const f = form;
  const payMethod = f.payment_method?.value || 'bank_transfer';
  const booking = await saveBookingToAdmin({
    customer_name: f.customer_name.value, customer_phone: f.customer_phone.value,
    customer_whatsapp: f.customer_whatsapp.value, country_code: f.country_code.value,
    booking_type: 'tour', item_id: parseInt(tourId), item_name: tourName,
    check_in: f.travel_date.value,
    guests: parseInt(f.travelers.value) || 1,
    payment_method: payMethod
  });
  redirectToPayment(booking, payMethod);
}

function handleTourBooking(e, tourId, tourName) {
  if (!requireAuth()) return;
  e.preventDefault();
  const f = e.target;
  if (!validateBookingForm(f, ['customer_name', 'customer_phone', 'customer_whatsapp', 'travel_date'])) return;
  const name = f.customer_name.value;
  const phone = f.customer_phone.value;
  const whatsapp = f.customer_whatsapp.value;
  const cc = f.country_code.value;
  if (!phone || !whatsapp) { showToast(t('phone') + ' ' + t('required'), 'error'); return; }
  const date = f.travel_date.value;
  const travelers = f.travelers.value;
  const payMethod = f.payment_method?.value || 'bank_transfer';
  const msg = `حجز جولة - Syria Travel:
👤 الاسم: ${name}
📞 الهاتف: ${cc} ${phone}
💬 واتساب: ${whatsapp}
🗺 الجولة: ${tourName}
📅 التاريخ: ${date}
👥 المسافرون: ${travelers}
💳 الدفع: ${payMethod}`;
  API.post('/api/bookings', { customer_name: name, customer_phone: phone, customer_whatsapp: whatsapp, country_code: cc, booking_type: 'tour', item_id: parseInt(tourId), item_name: tourName, check_in: date, guests: parseInt(travelers), payment_method: payMethod }).then(res => { showToast(t('bookSuccess')); openWhatsApp(msg); }).catch(() => {});
}

function renderCars() {
  updateSEO(t('ourCars'), 'Browse our luxury vehicle rental fleet');
  document.getElementById('app').innerHTML = `<div class="container section"><div class="section__header"><div><h1 class="section__title">${t('ourCars')}</h1><p class="section__subtitle">${currentLang === 'ar' ? 'تصفح أسطول سياراتنا الفاخرة' : 'Browse our luxury vehicle fleet'}</p></div></div>
    <div class="grid grid--auto" id="cars-grid"><p class="loading-text">${t('loading')}</p></div></div>`;
  API.get('/api/vehicles').then(d => {
    const g = document.getElementById('cars-grid');
    if (g) g.innerHTML = (d.vehicles || []).map(v => carCard(v)).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
}

function renderCarDetail(slug) {
  updateSEO('Vehicle', 'Loading...');
  document.getElementById('app').innerHTML = `<div class="container section"><p class="loading-text">${t('loading')}</p></div>`;
  API.get(`/api/vehicles/${slug}`).then(d => {
    const v = d.vehicle;
    if (!v) { renderNotFound(); return; }
    const name = currentLang === 'ar' && v.name_ar ? v.name_ar : v.name;
    const features = currentLang === 'ar' && v.features_ar && v.features_ar.length ? v.features_ar : (v.features || []);
    updateSEO(name, `Rent ${name}`, v.image);
    const galleryHtml = (v.images || []).map(img =>
      `<div class="gallery__item" onclick="openLightbox('${img.image}')"><img src="${img.image}" class="gallery__img" alt="${img.title || name}" loading="lazy"></div>`
    ).join('');
    document.getElementById('app').innerHTML = `
      <div class="container section">
        <div class="detail__hero" style="height:350px;"><img src="${v.image}" class="detail__hero-img" alt="${name}" loading="lazy">
          <div class="detail__hero-overlay"></div><div class="detail__hero-content"><h1 style="font-size:2.4rem;">${name}</h1></div></div>
        <div class="detail-layout">
          <div>
            <div class="detail-card"><h2>${t('specifications')}</h2>
              <div style="margin:20px 0;"><table class="spec-table">
                <tr><th>${t('brand')}</th><td>${v.brand || ''}</td></tr>
                <tr><th>${t('model')}</th><td>${v.model || ''}</td></tr>
                <tr><th>${t('year')}</th><td>${v.year || ''}</td></tr>
                <tr><th>${t('transmission')}</th><td>${v.transmission || ''}</td></tr>
                <tr><th>${t('fuelType')}</th><td>${v.fuel_type || ''}</td></tr>
                <tr><th>${t('seats')}</th><td>${v.seats || ''}</td></tr>
                <tr><th>${t('luggage')}</th><td>${v.luggage || ''}</td></tr>
              </table></div>
              <h3 style="margin-top:30px;margin-bottom:15px;">${t('features')}</h3><div class="grid grid--2">${features.map(f => `<div style="display:flex;align-items:center;gap:8px;"><span style="color:var(--gold-primary);">✔</span><span>${f}</span></div>`).join('')}</div>
              <h3 style="margin-top:30px;margin-bottom:15px;">${t('pricing')}</h3>
              <div class="pricing-grid"><div class="pricing-card"><h4>${t('daily')}</h4><span class="pricing-value">$${v.price_per_day || 0}</span></div>
                <div class="pricing-card"><h4>${t('weekly')}</h4><span class="pricing-value">$${v.price_per_week || 0}</span></div>
                <div class="pricing-card"><h4>${t('monthly')}</h4><span class="pricing-value">$${v.price_per_month || 0}</span></div></div>
            </div>
            ${galleryHtml ? `<div class="detail-card"><h2>${t('gallery_title')}</h2><div class="gallery">${galleryHtml}</div></div>` : ''}
          </div>
          <div><div class="booking-sidebar">
            <h3 style="border-bottom:1px solid var(--border-color);padding-bottom:12px;margin-bottom:20px;">${t('bookCar')}</h3>
            <form id="car-booking-form" onsubmit="handleCarBooking(event, '${v.id}', '${name.replace(/'/g, "\\'")}')">
              <div class="booking-form__group"><label class="booking-form__label">${t('fullName')} *</label><input type="text" class="booking-form__input" name="customer_name" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('countryCode')}</label><select class="booking-form__input" name="country_code" id="country-code-select-c"></select></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('phone')} *</label><input type="tel" class="booking-form__input" name="customer_phone" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('whatsapp')} *</label><input type="tel" class="booking-form__input" name="customer_whatsapp" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('pickupDate')}</label><input type="date" class="booking-form__input" name="pickup_date" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('returnDate')}</label><input type="date" class="booking-form__input" name="return_date" required></div>
              <div class="booking-form__group"><label class="booking-form__label">${t('paymentMethod')}</label>
                <input type="hidden" name="payment_method" value="bank_transfer">
                <div id="pm-car-${v.id}"></div></div>
              <div style="display:flex;gap:10px;margin-top:16px;">
                <button class="btn btn--primary" type="submit">💬 ${t('bookNow')}</button>
                <button class="btn btn--secondary" type="button" onclick="saveCarBooking(this.form, '${v.id}', '${name.replace(/'/g, "\\'")}')">📋 ${currentLang === 'ar' ? 'حجز' : 'Save Booking'}</button>
              </div>
            </form></div>
          </div>
        </div>
      </div>
      <div id="lightbox" class="lightbox" onclick="closeLightbox()"><div class="lightbox__content"><button class="lightbox__close">✕</button><img id="lightbox-img" class="lightbox__img" src="" alt=""></div></div>`;
    populateCountryCodes();
    renderPaymentMethodCards('pm-car-' + v.id, 'payment_method', 'bank_transfer');
  }).catch(() => renderNotFound());
}

async function saveCarBooking(form, carId, carName) {
  if (!validateBookingForm(form, ['customer_name', 'customer_phone', 'customer_whatsapp', 'pickup_date', 'return_date'])) return;
  const f = form;
  const payMethod = f.payment_method?.value || 'bank_transfer';
  const booking = await saveBookingToAdmin({
    customer_name: f.customer_name.value, customer_phone: f.customer_phone.value,
    customer_whatsapp: f.customer_whatsapp.value, country_code: f.country_code.value,
    booking_type: 'car', item_id: parseInt(carId), item_name: carName,
    check_in: f.pickup_date.value, check_out: f.return_date.value,
    payment_method: payMethod
  });
  redirectToPayment(booking, payMethod);
}

function handleCarBooking(e, carId, carName) {
  if (!requireAuth()) return;
  e.preventDefault();
  const f = e.target;
  if (!validateBookingForm(f, ['customer_name', 'customer_phone', 'customer_whatsapp', 'pickup_date', 'return_date'])) return;
  const name = f.customer_name.value;
  const phone = f.customer_phone.value;
  const whatsapp = f.customer_whatsapp.value;
  const cc = f.country_code.value;
  if (!phone || !whatsapp) { showToast(t('phone') + ' ' + t('required'), 'error'); return; }
  const pickup = f.pickup_date.value;
  const ret = f.return_date.value;
  const payMethod = f.payment_method?.value || 'bank_transfer';
  const msg = `حجز سيارة - Syria Travel:
👤 الاسم: ${name}
📞 الهاتف: ${cc} ${phone}
💬 واتساب: ${whatsapp}
🚗 السيارة: ${carName}
📅 الاستلام: ${pickup}
📅 التسليم: ${ret}
💳 الدفع: ${payMethod}`;
  API.post('/api/bookings', { customer_name: name, customer_phone: phone, customer_whatsapp: whatsapp, country_code: cc, booking_type: 'car', item_id: parseInt(carId), item_name: carName, check_in: pickup, check_out: ret, payment_method: payMethod }).then(res => { showToast(t('bookSuccess')); openWhatsApp(msg); }).catch(() => {});
}

function renderGallery() {
  updateSEO(t('ourGallery'), 'Explore Syrian tourism gallery');
  document.getElementById('app').innerHTML = `<div class="container section"><div class="section__header"><div><h1 class="section__title">${t('ourGallery')}</h1><p class="section__subtitle">${currentLang === 'ar' ? 'اكتشف صور الوجهات السياحية السورية' : 'Discover Syrian tourist destinations'}</p></div></div>
    <div class="grid grid--auto" id="gallery-grid"><p class="loading-text">${t('loading')}</p></div></div>`;
  API.get('/api/gallery').then(d => {
    const g = document.getElementById('gallery-grid');
    if (g) g.innerHTML = (d.gallery || []).map(item => {
      const name = currentLang === 'ar' && item.name_ar ? item.name_ar : item.name;
      const dsc = currentLang === 'ar' && item.description_ar ? item.description_ar : item.description;
      return `<div class="card" onclick="window.location.hash='#gallery/${item.slug}'">
        <div class="card__image" style="background-image: url('${item.cover_image || (item.images && item.images[0] ? item.images[0].image : '')}')"></div>
        <div class="card__body"><h3 class="card__title">${name}</h3><p class="card__text">${dsc || ''}</p>
        <button class="btn btn--primary btn--sm" style="margin-top:12px;width:100%">${t('viewDetails')}</button></div></div>`;
    }).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
}

function renderGalleryDetail(slug) {
  updateSEO('Gallery', 'Loading...');
  document.getElementById('app').innerHTML = `<div class="container section"><p class="loading-text">${t('loading')}</p></div>`;
  API.get(`/api/gallery/${slug}`).then(d => {
    const item = d.item;
    if (!item) { renderNotFound(); return; }
    const name = currentLang === 'ar' && item.name_ar ? item.name_ar : item.name;
    const desc = currentLang === 'ar' && item.description_ar ? item.description_ar : item.description;
    const hist = currentLang === 'ar' && item.historical_info_ar ? item.historical_info_ar : item.historical_info;
    const tourInfo = currentLang === 'ar' && item.tourism_info_ar ? item.tourism_info_ar : item.tourism_info;
    const tips = currentLang === 'ar' && item.visiting_tips_ar ? item.visiting_tips_ar : item.visiting_tips;
    const nearby = currentLang === 'ar' && item.nearby_attractions_ar ? item.nearby_attractions_ar : item.nearby_attractions;
    const activities = currentLang === 'ar' && item.activities_ar && item.activities_ar.length ? item.activities_ar : (item.activities || []);
    updateSEO(name, desc, item.cover_image);
    const images = item.images || [];
    const galleryHtml = images.map((img, i) =>
      `<div class="gallery__item ${i === 0 ? 'gallery__item--main' : ''}" onclick="openLightbox('${img.image}')">
        <img src="${img.image}" class="gallery__img" alt="${img.title || name}" loading="lazy">
        ${img.title ? `<div class="gallery__caption">${currentLang === 'ar' && img.title_ar ? img.title_ar : img.title}</div>` : ''}
      </div>`).join('');
    document.getElementById('app').innerHTML = `
      <div class="container section">
        <div class="detail__hero" style="height:400px;"><img src="${item.cover_image || (images[0] ? images[0].image : '')}" class="detail__hero-img" alt="${name}" loading="lazy">
          <div class="detail__hero-overlay"></div><div class="detail__hero-content"><h1 style="font-size:2.5rem;">${name}</h1></div></div>
        <div class="detail-layout">
          <div>
            ${desc ? `<div class="detail-card"><h2>${t('overview')}</h2><p style="line-height:1.8;">${desc}</p></div>` : ''}
            ${hist ? `<div class="detail-card"><h2>${t('historicalInfo')}</h2><p style="line-height:1.8;">${hist}</p></div>` : ''}
            ${tourInfo ? `<div class="detail-card"><h2>${t('tourismInfo')}</h2><p style="line-height:1.8;">${tourInfo}</p></div>` : ''}
            ${activities.length > 0 ? `<div class="detail-card"><h2>${t('availableActivities')}</h2><div class="amenity-grid">${activities.map(a => `<div class="amenity-item"><span class="amenity-icon">✦</span><span>${a}</span></div>`).join('')}</div></div>` : ''}
            ${tips ? `<div class="detail-card"><h2>${t('visitingTips')}</h2><p style="line-height:1.8;">${tips}</p></div>` : ''}
            ${nearby ? `<div class="detail-card"><h2>${t('nearbyAttractions')}</h2><p style="line-height:1.8;">${nearby}</p></div>` : ''}
            ${galleryHtml ? `<div class="detail-card"><h2>${t('gallery_title')}</h2><div class="gallery gallery--room">${galleryHtml}</div></div>` : ''}
          </div>
          <div>${item.lat && item.lng ? `<div class="detail-card"><h3>${t('location')}</h3>
            <div style="height:250px;border-radius:var(--radius-md);overflow:hidden;margin-top:15px;">
              <iframe width="100%" height="100%" frameborder="0" style="border:0" src="https://www.openstreetmap.org/export/embed.html?bbox=${item.lng-0.05},${item.lat-0.05},${item.lng+0.05},${item.lat+0.05}&layer=mapnik" allowfullscreen></iframe>
            </div></div>` : ''}</div>
        </div>
      </div>
      <div id="lightbox" class="lightbox" onclick="closeLightbox()"><div class="lightbox__content"><button class="lightbox__close">✕</button><img id="lightbox-img" class="lightbox__img" src="" alt=""></div></div>`;
  }).catch(() => renderNotFound());
}

function renderOffers() {
  updateSEO(currentLang === 'ar' ? 'العروض' : 'Offers', currentLang === 'ar' ? 'عروض حصرية' : 'Exclusive deals');
  document.getElementById('app').innerHTML = `<div class="container section">
    <div class="section__header"><div><h1 class="section__title">${currentLang === 'ar' ? 'العروض' : 'Offers'}</h1><p class="section__subtitle">${currentLang === 'ar' ? 'عروض حصرية' : 'Exclusive deals'}</p></div></div>
    <div class="grid grid--auto" id="offers-grid"><p class="loading-text">${t('loading')}</p></div></div>`;
  API.get('/api/offers').then(d => {
    const g = document.getElementById('offers-grid');
    if (g) g.innerHTML = (d.offers || []).map(o => offerCard(o)).join('') || '<p>' + t('noResults') + '</p>';
  }).catch(() => {});
}

function renderOfferDetail(id) {
  updateSEO('Offer', t('loading'));
  document.getElementById('app').innerHTML = `<div class="container section"><p class="loading-text">${t('loading')}</p></div>`;
  Promise.all([
    API.get(`/api/offers/${id}`),
    API.get('/api/hotels?featured=1'),
    API.get('/api/tours?featured=1'),
    API.get('/api/vehicles?featured=1')
  ]).then(([offerRes, hotelsRes, toursRes, vehiclesRes]) => {
    const offer = offerRes?.offer;
    if (!offer) { renderNotFound(); return; }
    const title = currentLang === 'ar' && offer.title_ar ? offer.title_ar : offer.title;
    const desc = currentLang === 'ar' && offer.description_ar ? offer.description_ar : offer.description;
    const sections = offer.sections || [];
    const disc = offer.discount_value > 0 ? (offer.discount_type === 'percentage' ? offer.discount_value + '%' : '$' + offer.discount_value) : '';
    updateSEO(title, desc, offer.image);
    let sectionHtml = '';
    if (sections.includes('hotels')) {
      const items = (hotelsRes?.hotels || []).slice(0, 6);
      sectionHtml += `<div class="detail-card"><h2>${t('ourHotels')}</h2><div class="grid grid--auto">${items.map(h => hotelCard(h)).join('') || '<p>' + t('noResults') + '</p>'}</div><a href="#hotels" class="btn btn--secondary btn--sm" style="margin-top:12px">${currentLang === 'ar' ? 'عرض الكل' : 'View All'} →</a></div>`;
    }
    if (sections.includes('tours')) {
      const items = (toursRes?.tours || []).slice(0, 6);
      sectionHtml += `<div class="detail-card"><h2>${t('ourTours')}</h2><div class="grid grid--auto">${items.map(t => tourCard(t)).join('') || '<p>' + t('noResults') + '</p>'}</div><a href="#trips" class="btn btn--secondary btn--sm" style="margin-top:12px">${currentLang === 'ar' ? 'عرض الكل' : 'View All'} →</a></div>`;
    }
    if (sections.includes('vehicles')) {
      const items = (vehiclesRes?.vehicles || []).slice(0, 6);
      sectionHtml += `<div class="detail-card"><h2>${t('ourCars')}</h2><div class="grid grid--auto">${items.map(v => carCard(v)).join('') || '<p>' + t('noResults') + '</p>'}</div><a href="#cars" class="btn btn--secondary btn--sm" style="margin-top:12px">${currentLang === 'ar' ? 'عرض الكل' : 'View All'} →</a></div>`;
    }
    document.getElementById('app').innerHTML = `
      <div class="container section">
        <div class="detail__hero" style="height:350px;">
          <img src="${offer.image || '/uploads/default.jpg'}" class="detail__hero-img" alt="${title}" loading="lazy">
          <div class="detail__hero-overlay"></div>
          <div class="detail__hero-content">
            <h1 style="font-size:2.5rem;">${title}</h1>
            ${disc ? `<div style="margin-top:12px;display:inline-block;padding:8px 24px;background:var(--gold-primary);color:#000;border-radius:var(--radius-md);font-size:1.3rem;font-weight:700;">-${disc}</div>` : ''}
          </div>
        </div>
        <div class="detail-layout">
          <div>
            ${desc ? `<div class="detail-card"><h2>${t('overview')}</h2><p style="line-height:1.8;">${desc}</p></div>` : ''}
            ${sectionHtml}
          </div>
          <div>
            <div class="detail-card">
              <h3>${currentLang === 'ar' ? 'تفاصيل العرض' : 'Offer Details'}</h3>
              <p>${currentLang === 'ar' ? 'تاريخ البداية' : 'Start Date'}: ${offer.start_date || '—'}</p>
              <p>${currentLang === 'ar' ? 'تاريخ النهاية' : 'End Date'}: ${offer.end_date || '—'}</p>
              ${disc ? `<p style="font-size:1.2rem;font-weight:700;color:var(--gold-primary);margin-top:12px;">${currentLang === 'ar' ? 'الخصم' : 'Discount'}: -${disc}</p>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }).catch(() => renderNotFound());
}

function renderPage(slug) {
  const pageNames = { 'privacy-policy': t('privacyPolicy'), 'terms-conditions': t('termsConditions'), 'cancellation-policy': t('cancellationPolicy'), 'refund-policy': t('refundPolicy'), 'about': t('about'), 'contact': t('contact') };
  updateSEO(pageNames[slug] || slug, '');
  if (slug === 'contact') { renderContact(); return; }
  document.getElementById('app').innerHTML = `<div class="container section"><p class="loading-text">${t('loading')}</p></div>`;
  API.get(`/api/pages/${slug}`).then(d => {
    const p = d.page;
    if (!p) { renderNotFound(); return; }
    const title = currentLang === 'ar' && p.title_ar ? p.title_ar : p.title;
    const content = currentLang === 'ar' && p.content_ar ? p.content_ar : p.content;
    document.getElementById('app').innerHTML = `<div class="container section page-content"><h1 class="section__title">${title}</h1><div style="margin-top:30px;line-height:1.8;">${content}</div></div>`;
  }).catch(() => renderNotFound());
}

function renderContact() {
  updateSEO(t('contact'), 'Contact Syria Travel');
  document.getElementById('app').innerHTML = `
    <div class="container section"><div class="section__header"><div><h1 class="section__title">${t('contact')}</h1></div></div>
      <div class="detail-layout">
        <div><div class="detail-card">
          <h2>${t('sendInquiry')}</h2>
          <form id="contact-form" onsubmit="handleContactSubmit(event)">
            <div class="booking-form__group"><label class="booking-form__label">${t('fullName')} *</label><input type="text" class="booking-form__input" name="name" required></div>
            <div class="booking-form__group"><label class="booking-form__label">${t('phone')}</label><input type="tel" class="booking-form__input" name="phone"></div>
            <div class="booking-form__group"><label class="booking-form__label">${t('whatsapp')}</label><input type="tel" class="booking-form__input" name="whatsapp"></div>
            <div class="booking-form__group"><label class="booking-form__label">${t('yourEmail')}</label><input type="email" class="booking-form__input" name="email"></div>
            <div class="booking-form__group"><label class="booking-form__label">${t('inquirySubject')}</label><input type="text" class="booking-form__input" name="subject"></div>
            <div class="booking-form__group"><label class="booking-form__label">${t('inquiryMessage')} *</label><textarea class="booking-form__input" name="message" rows="5" required></textarea></div>
            <button class="btn btn--primary btn--block btn--lg" type="submit">${t('sendInquiry')}</button>
          </form></div></div>
        <div><div class="detail-card"><h3>${currentLang === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</h3>
          <div class="contact-info"><p>📞 ${siteSettings.contact_phone || '+963951564210'}</p>
          <p>✉️ ${siteSettings.contact_email || 'concierge@syria-travel.com'}</p>
          <p>📍 ${siteSettings['company_address_' + currentLang] || siteSettings.company_address || 'Damascus, Syria'}</p></div></div></div>
      </div></div>`;
}

async function handleFooterInquiry(e) {
  e.preventDefault();
  const f = e.target;
  try {
    await API.post('/api/contact', { name: f.name.value, phone: f.phone.value, message: f.message.value });
    showToast(currentLang === 'ar' ? 'تم إرسال الاستفسار بنجاح!' : 'Inquiry sent!');
    f.reset();
  } catch (err) { showToast(err.message, 'error'); }
  return false;
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const f = e.target;
  try {
    await API.post('/api/contact', { name: f.name.value, phone: f.phone.value, whatsapp: f.whatsapp.value, email: f.email.value, subject: f.subject.value, message: f.message.value });
    showToast('Message sent successfully!');
    f.reset();
  } catch (err) { showToast(err.message, 'error'); }
}

function renderAuth() {
  updateSEO(t('login'), 'Sign in to your account');
  document.getElementById('app').innerHTML = `
    <div class="container section" style="max-width:500px;margin:0 auto;">
      <div class="detail-card"><h2 style="text-align:center;margin-bottom:24px;font-family:var(--font-display);">${t('login')}</h2>
        <form id="auth-login-form" onsubmit="handleLogin(event)">
          <div class="booking-form__group"><label class="booking-form__label">Email</label><input type="email" class="booking-form__input" name="email" required></div>
          <div class="booking-form__group"><label class="booking-form__label">Password</label><input type="password" class="booking-form__input" name="password" required></div>
          <button class="btn btn--primary btn--block btn--lg" type="submit">${t('login')}</button>
        </form>
        <p style="text-align:center;font-size:0.85rem;color:var(--text-muted);margin-top:15px;">
          ${currentLang === 'ar' ? 'ليس لديك حساب؟' : 'Don\'t have an account?'} <a href="#signup" style="color:var(--gold-primary);">${t('signup')}</a></p>
        
      </div></div>`;
}

async function handleLogin(e) {
  e.preventDefault();
  const f = e.target;
  try {
    const data = await API.post('/api/auth/login', { email: f.email.value, password: f.password.value });
    currentUser = data.user;
    currentToken = data.token;
    localStorage.setItem('syria_user', JSON.stringify(currentUser));
    localStorage.setItem('syria_token', currentToken);
    showToast('Welcome!');
    await loadActiveTrip();
    updateNavbarUI();
    window.location.hash = '#home';
  } catch (err) { showToast(err.message, 'error'); }
}

function toggleHeroPwd() {
  const pwd = document.getElementById('hero-login-pwd');
  if (!pwd) return;
  pwd.type = pwd.type === 'password' ? 'text' : 'password';
}

async function handleHeroLogin(e) {
  e.preventDefault();
  const f = e.target;
  const btn = document.getElementById('hero-login-submit');
  const origText = btn.textContent;
  btn.textContent = currentLang === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...';
  btn.disabled = true;
  try {
    const data = await API.post('/api/auth/login', { email: f.email.value, password: f.password.value, phone: f.phone.value, country_code: f.country_code.value });
    currentUser = data.user;
    currentToken = data.token;
    localStorage.setItem('syria_user', JSON.stringify(currentUser));
    localStorage.setItem('syria_token', currentToken);
    showToast(currentLang === 'ar' ? 'مرحباً بعودتك!' : 'Welcome back!');
    await loadActiveTrip();
    updateNavbarUI();
    const panel = document.getElementById('hero-login-panel');
    if (panel) panel.style.display = 'none';
  } catch (err) { showToast(err.message, 'error'); }
  btn.textContent = origText;
  btn.disabled = false;
}

function renderSignup() {
  updateSEO(t('signup'), 'Create your account');
  document.getElementById('app').innerHTML = `
    <div class="container section" style="max-width:500px;margin:0 auto;">
      <div class="detail-card"><h2 style="text-align:center;margin-bottom:24px;font-family:var(--font-display);">${t('signup')}</h2>
        <form id="auth-signup-form" onsubmit="handleSignup(event)">
          <div class="booking-form__group"><label class="booking-form__label">${t('fullName')}</label><input type="text" class="booking-form__input" name="name" required></div>
          <div class="booking-form__group"><label class="booking-form__label">Email</label><input type="email" class="booking-form__input" name="email" required></div>
          <div class="booking-form__group"><label class="booking-form__label">${t('phone')}</label><input type="tel" class="booking-form__input" name="phone"></div>
          <div class="booking-form__group"><label class="booking-form__label">Password</label><input type="password" class="booking-form__input" name="password" required></div>
          <button class="btn btn--primary btn--block btn--lg" type="submit">${t('signup')}</button>
        </form>
        <p style="text-align:center;font-size:0.85rem;color:var(--text-muted);margin-top:15px;">
          ${currentLang === 'ar' ? 'لديك حساب؟' : 'Have an account?'} <a href="#auth" style="color:var(--gold-primary);">${t('login')}</a></p>
      </div></div>`;
}

async function handleSignup(e) {
  e.preventDefault();
  const f = e.target;
  try {
    const data = await API.post('/api/auth/signup', { name: f.name.value, email: f.email.value, phone: f.phone.value, password: f.password.value });
    currentUser = data.user;
    currentToken = data.token;
    localStorage.setItem('syria_user', JSON.stringify(currentUser));
    localStorage.setItem('syria_token', currentToken);
    showToast('Account created!');
    updateNavbarUI();
    window.location.hash = '#home';
  } catch (err) { showToast(err.message, 'error'); }
}

function renderTripProgress(bookingId) {
  if (!currentToken) { window.location.hash = '#auth'; return; }
  updateSEO(t('tripProgress'), '');
  document.getElementById('app').innerHTML = `<div class="container section">
    <div id="trip-progress-content"><p class="loading-text">${t('loading')}</p></div></div>`;
  API.get(`/api/trip-progress/${bookingId}`).then(d => {
    const el = document.getElementById('trip-progress-content');
    if (!el) return;
    renderInlineTripProgress(el, d);
  }).catch(() => {
    const el = document.getElementById('trip-progress-content');
    if (el) el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${t('noItinerary')}</p>`;
  });
}

function renderBookings() {
  if (!currentToken) { window.location.hash = '#auth'; return; }
  updateSEO(t('bookings'), 'My bookings');
  document.getElementById('app').innerHTML = `<div class="container section">
    <div class="section__header"><div><h1 class="section__title">${t('bookings')}</h1></div></div>
    <div id="booking-list" class="grid grid--auto"><p class="loading-text">${t('loading')}</p></div></div>`;
  API.get('/api/bookings').then(d => {
    const g = document.getElementById('booking-list');
    if (!g) return;
    if (!d.bookings || d.bookings.length === 0) {
      g.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;"><p style="color:var(--text-muted);margin-bottom:20px;">${currentLang === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}</p>
        <a href="#hotels" class="btn btn--primary">${currentLang === 'ar' ? 'تصفح الفنادق' : 'Browse Hotels'}</a></div>`;
      return;
    }
    g.innerHTML = d.bookings.map(b => `
      <div class="booking-item"><div class="booking-item__info">
        <div class="booking-item__title">${b.item_name || b.booking_type}</div>
        <div class="booking-item__detail">${b.booking_type} | ${b.check_in || ''}${b.check_out ? ' → ' + b.check_out : ''} | ${b.guests || ''}</div>
        <div style="margin-top:8px;"><span class="booking-item__status status--${(b.status||'').toLowerCase()}">${b.status}</span></div>
        ${b.booking_type === 'tour' ? `<button class="btn btn--secondary btn--sm" style="margin-top:8px;" onclick="window.location.hash='#trip-progress/${b.id}'">📋 ${t('viewTripProgress')}</button>` : ''}
      </div><div class="booking-item__ref">#${b.booking_ref || b.id}</div></div>
    `).join('');
  }).catch(() => {});
}

function renderSearch() {
  updateSEO('Search', 'Search hotels, tours, and vehicles');
  document.getElementById('app').innerHTML = `<div class="container section">
    <div class="section__header"><div><h1 class="section__title">${currentLang === 'ar' ? 'بحث' : 'Search'}</h1></div></div>
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <input type="text" id="search-input" class="booking-form__input" placeholder="${currentLang === 'ar' ? 'ابحث عن فنادق، جولات، سيارات...' : 'Search hotels, tours, vehicles...'}" style="flex:1;padding:14px;" onkeydown="if(event.key==='Enter')doSearch()">
      <button class="btn btn--primary" onclick="doSearch()">🔍 ${currentLang === 'ar' ? 'بحث' : 'Search'}</button>
    </div>
    <div id="search-results"><p class="loading-text">${t('loading')}</p></div></div>`;
  doSearch();
}

async function doSearch() {
  const q = document.getElementById('search-input')?.value.trim();
  const el = document.getElementById('search-results');
  if (!el) return;
  if (!el) return;
  el.innerHTML = `<p class="loading-text">${t('loading')}</p>`;
  try {
    const url = '/api/search?q=' + encodeURIComponent(q);
    const data = await API.get(url);
    const results = data.results || [];
    const hotels = results.filter(r => r.item_type === 'hotel');
    const tours = results.filter(r => r.item_type === 'tour');
    const cars = results.filter(r => r.item_type === 'car');
    let html = '';
    if (hotels.length) {
      html += `<div style="margin-bottom:24px;"><h3 style="font-family:var(--font-display);margin-bottom:12px;color:var(--gold-primary);">🏨 ${t('hotels')}</h3><div class="grid grid--auto">${hotels.map(h => searchResultCard(h)).join('')}</div></div>`;
    }
    if (tours.length) {
      html += `<div style="margin-bottom:24px;"><h3 style="font-family:var(--font-display);margin-bottom:12px;color:var(--gold-primary);">🗺️ ${t('tours')}</h3><div class="grid grid--auto">${tours.map(t => searchResultCard(t)).join('')}</div></div>`;
    }
    if (cars.length) {
      html += `<div style="margin-bottom:24px;"><h3 style="font-family:var(--font-display);margin-bottom:12px;color:var(--gold-primary);">🚗 ${t('cars')}</h3><div class="grid grid--auto">${cars.map(v => searchResultCard(v)).join('')}</div></div>`;
    }
    const gallery = results.filter(r => r.item_type === 'gallery');
    if (gallery.length) {
      html += `<div style="margin-bottom:24px;"><h3 style="font-family:var(--font-display);margin-bottom:12px;color:var(--gold-primary);">🖼️ ${currentLang === 'ar' ? 'معرض الصور' : 'Gallery'}</h3><div class="grid grid--auto">${gallery.map(g => searchResultCard(g)).join('')}</div></div>`;
    }
    el.innerHTML = html || `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'لا توجد نتائج لـ "' + q + '"' : 'No results for "' + q + '"'}</p>`;
  } catch (e) {
    el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${currentLang === 'ar' ? 'خطأ: ' + e.message : 'Error: ' + e.message}</p>`;
  }
}

function searchResultCard(item) {
  const name = currentLang === 'ar' && item.name_ar ? item.name_ar : item.name;
  const img = item.main_image || item.cover_image || item.image || '';
  const price = item.price || item.min_price || item.price_per_day || 0;
  let link = '#';
  if (item.item_type === 'car') link = `#car/${item.slug || item.id}`;
  else if (item.item_type === 'gallery') link = `#gallery/${item.slug || item.id}`;
  else link = `#${item.item_type}s/${item.slug || item.id}`;
  return `<div class="card" onclick="window.location.hash='${link}'">
    <div class="card__image" style="background-image: url('${img}')"></div>
    <div class="card__body"><h3 class="card__title">${name}</h3>
    <div class="card__meta"><span>${item.city || item.city_ar || ''}</span>${price ? `<span class="card__price">$${price}</span>` : ''}</div>
    <button class="btn btn--primary btn--sm" style="margin-top:12px;width:100%">${t('viewDetails')}</button></div></div>`;
}

function renderMyTrip() {
  if (!currentToken) { window.location.hash = '#auth'; return; }
  updateSEO(t('myTrip'), '');
  document.getElementById('app').innerHTML = `<div class="container section"><p class="loading-text">${t('loading')}</p></div>`;
  renderMyTripFromActive();
}

async function renderMyTripFromActive() {
  const appEl = document.getElementById('app');
  try {
    const d = await API.get('/api/bookings/active-trip');
    if (!d || !d.booking_id) {
      appEl.innerHTML = `<div class="container section" style="text-align:center;padding:60px 24px;">
        <div style="font-size:3rem;margin-bottom:16px;">🧳</div>
        <h2 style="font-family:var(--font-display);margin-bottom:12px;">${currentLang === 'ar' ? 'لا توجد رحلة نشطة' : 'No Active Trip'}</h2>
        <p style="color:var(--text-muted);margin-bottom:24px;">${currentLang === 'ar' ? 'احجز جولة سياحية وابدأ مغامرتك في سوريا' : 'Book a tour and start your adventure in Syria'}</p>
        <a href="#trips" class="btn btn--primary">${currentLang === 'ar' ? 'تصفح الجولات السياحية' : 'Browse Tours'}</a>
      </div>`;
      return;
    }
    const prog = await API.get(`/api/trip-progress/${d.booking_id}`);
    renderInlineTripProgress(appEl, prog || { progress: [], booking: d.booking });
  } catch (e) {
    appEl.innerHTML = `<div class="container section" style="text-align:center;padding:60px 24px;">
      <div style="font-size:3rem;margin-bottom:16px;">🧳</div>
      <h2 style="font-family:var(--font-display);margin-bottom:12px;">${currentLang === 'ar' ? 'لا توجد رحلة نشطة' : 'No Active Trip'}</h2>
      <a href="#trips" class="btn btn--primary">${currentLang === 'ar' ? 'تصفح الجولات السياحية' : 'Browse Tours'}</a>
    </div>`;
  }
}

function renderInlineTripProgress(el, d) {
  const isAr = currentLang === 'ar';
  if (!d.progress || d.progress.length === 0) {
    el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">${t('noItinerary')}</p>`;
    return;
  }
  const total = d.progress.length;
  const done = d.progress.filter(p => p.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  let html = `<div class="detail-card">
    <h2>${isAr ? 'رحلتي' : 'My Trip'}${d.booking?.item_name ? ': ' + d.booking.item_name : ''}</h2>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin:12px 0 20px;padding:12px;background:var(--bg-secondary);border-radius:8px;font-size:0.85rem;color:var(--text-muted);">
      <span><strong>${isAr ? 'البريد' : 'Email'}:</strong> ${d.booking?.user_email || d.booking?.customer_email || '-'}</span>
      <span><strong>${isAr ? 'الاسم' : 'Name'}:</strong> ${d.booking?.user_name || d.booking?.customer_name || '-'}</span>
      <span><strong>${isAr ? 'رقم الحجز' : 'Booking'}:</strong> #${d.booking?.booking_ref || d.booking?.id}</span>
    </div>
    <div style="margin:16px 0;">
      <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:var(--text-muted);margin-bottom:6px;">
        <span>${t('overallProgress')}: ${pct}%</span>
        <span>${done}/${total} ${t('completedItems')}</span>
      </div>
      <div style="height:10px;background:var(--border-color);border-radius:5px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:var(--gold-primary);border-radius:5px;transition:width 0.5s;"></div>
      </div>
    </div>`;
  let curDay = 0;
  for (const p of d.progress) {
    if (p.day !== curDay) {
      if (curDay > 0) html += `</div>`;
      curDay = p.day;
      html += `<div style="margin-top:20px;">
        <h3 style="color:var(--gold-primary);margin-bottom:12px;">${t('day')} ${p.day}</h3>`;
    }
    const title = isAr && p.title_ar ? p.title_ar : p.title;
    html += `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-color);">
      <span style="font-size:1.2rem;">${p.completed ? '✅' : '⏳'}</span>
      <span style="${p.completed ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${title}</span>
      ${p.completed_at ? `<span style="font-size:0.75rem;color:var(--text-muted);margin-left:auto;">${p.completed_at}</span>` : ''}
    </div>`;
  }
  if (curDay > 0) html += `</div>`;
  html += `<a href="#bookings" class="btn btn--secondary btn--sm" style="margin-top:20px;">← ${isAr ? 'العودة للحجوزات' : 'Back to Bookings'}</a>`;
  html += `</div>`;
  el.innerHTML = html;
}

function renderNotFound() {
  updateSEO('404', 'Page not found');
  document.getElementById('app').innerHTML = `<div class="container section" style="text-align:center;padding:100px 0;">
    <h1 style="font-size:6rem;color:var(--gold-primary);font-family:var(--font-display);">404</h1>
    <p style="font-size:1.2rem;color:var(--text-muted);margin:20px 0;">${currentLang === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}</p>
    <a href="#home" class="btn btn--primary">${currentLang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</a></div>`;
}

function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (lb && img) { img.src = src; lb.classList.add('open'); }
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
}

function populateCountryCodes(extraId) {
  const selects = document.querySelectorAll('[id^="country-code-select"]');
  const codes = countriesData.length > 0 ? countriesData : [
    { code: 'SY', name: 'Syria', dial_code: '+963' }, { code: 'SA', name: 'Saudi Arabia', dial_code: '+966' },
    { code: 'AE', name: 'UAE', dial_code: '+971' }, { code: 'QA', name: 'Qatar', dial_code: '+974' },
    { code: 'KW', name: 'Kuwait', dial_code: '+965' }, { code: 'JO', name: 'Jordan', dial_code: '+962' },
    { code: 'LB', name: 'Lebanon', dial_code: '+961' }, { code: 'EG', name: 'Egypt', dial_code: '+20' },
    { code: 'IQ', name: 'Iraq', dial_code: '+964' }, { code: 'TR', name: 'Turkey', dial_code: '+90' },
    { code: 'US', name: 'United States', dial_code: '+1' }, { code: 'GB', name: 'United Kingdom', dial_code: '+44' },
    { code: 'FR', name: 'France', dial_code: '+33' }, { code: 'DE', name: 'Germany', dial_code: '+49' },
    { code: 'CA', name: 'Canada', dial_code: '+1' }, { code: 'AU', name: 'Australia', dial_code: '+61' },
  ];
  const opts = codes.map(c => `<option value="${c.dial_code}">${c.dial_code} ${c.name}</option>`).join('');
  selects.forEach(s => { if (s) s.innerHTML = '<option value="">' + t('selectCountryCode') + '</option>' + opts; });
  if (extraId) { const extra = document.getElementById(extraId); if (extra) extra.innerHTML = '<option value="">' + t('selectCountryCode') + '</option>' + opts; }
}

function updateFooterLang() {
  const isAr = currentLang === 'ar';
  const title = document.getElementById('footer-inquiry-title');
  const name = document.getElementById('fi-name');
  const phone = document.getElementById('fi-phone');
  const msg = document.getElementById('fi-msg');
  const btn = document.getElementById('fi-btn');
  if (title) title.textContent = isAr ? 'استفسار' : 'Inquiry';
  if (name) name.placeholder = isAr ? 'الاسم' : 'Your Name';
  if (phone) phone.placeholder = isAr ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp';
  if (msg) msg.placeholder = isAr ? 'رسالتك' : 'Your message';
  if (btn) btn.textContent = isAr ? 'إرسال' : 'Send';
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'ar' : 'en';
  localStorage.setItem('syria_lang', currentLang);
  document.documentElement.setAttribute('lang', currentLang);
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  updateNavbarUI();
  updateFooterLang();
  route();
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('syria_theme', currentTheme);
  document.documentElement.setAttribute('data-theme', currentTheme);
}

function updateNavbarUI() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  document.documentElement.setAttribute('lang', currentLang);
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  const navbar = document.querySelector('.header__nav');
  if (!navbar) return;
  navbar.innerHTML = `
    <a href="#search" class="nav__link nav__link--search">${currentLang === 'ar' ? '🔍 بحث' : '🔍 Search'}</a>
    <a href="#home" class="nav__link">${t('home')}</a>
    <a href="#destinations" class="nav__link">${t('destinations')}</a>
    <a href="#hotels" class="nav__link">${t('hotels')}</a>
    <a href="#trips" class="nav__link">${t('tours')}</a>
    <a href="#cars" class="nav__link">${t('cars')}</a>
    <a href="#gallery" class="nav__link">${t('gallery')}</a>
    ${currentToken ? `<a href="#bookings" class="nav__link">${t('bookings')}</a>` : ''}
    ${currentToken ? `<a href="#my-trip" class="nav__link" style="color:var(--gold-primary);font-weight:700;">✦ ${t('myTrip')}</a>` : ''}
    ${currentToken
      ? `<button class="nav__link nav__link--auth" style="border:none;cursor:pointer;" onclick="handleLogOut()">${t('logout')}</button>`
      : `<a href="#auth" class="nav__link nav__link--auth">${t('login')}</a>`}
    <button class="lang-toggle" onclick="toggleLang()">🌐 <span class="lang-label">${currentLang === 'en' ? 'عربي' : 'English'}</span></button>
    <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>`;
}

function handleLogOut() {
  currentUser = null;
  currentToken = null;
  localStorage.removeItem('syria_user');
  localStorage.removeItem('syria_token');
  showToast('Logged out');
  updateNavbarUI();
  window.location.hash = '#home';
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadHomepageSections();
  await loadCountries();
  await loadActiveTrip();
  updateNavbarUI();
  updateFooterLang();
  route();
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  const header = document.querySelector('.header');
  if (header) {
    header.addEventListener('click', (e) => {
      const burger = e.target.closest('.header__hamburger');
      const nav = header.querySelector('.header__nav');
      if (burger && nav) nav.classList.toggle('header__nav--active');
      else if (e.target.closest('.nav__link') && nav) nav.classList.remove('header__nav--active');
    });
  }
});

// ============ ROOM IMAGE GALLERY ============
window.__rg = {};

function initRoomGallery(galleryId, images, startIndex) {
  const state = window.__rg[galleryId] = { images, current: startIndex || 0, touchStartX: 0, touchEndX: 0 };
  updateRoomGallery(galleryId);
  const wrap = document.getElementById(`rg-wrap-${galleryId}`);
  if (wrap) {
    wrap.addEventListener('touchstart', e => { state.touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    wrap.addEventListener('touchend', e => {
      state.touchEndX = e.changedTouches[0].screenX;
      const diff = state.touchStartX - state.touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextRoomImage(galleryId);
        else prevRoomImage(galleryId);
      }
    }, { passive: true });
  }
  const keyHandler = e => {
    const rg = document.getElementById(`rg-${galleryId}`);
    if (!rg) return;
    const rect = rg.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;
    if (e.key === 'ArrowLeft') { if (currentLang === 'ar') nextRoomImage(galleryId); else prevRoomImage(galleryId); }
    if (e.key === 'ArrowRight') { if (currentLang === 'ar') prevRoomImage(galleryId); else nextRoomImage(galleryId); }
  };
  document.addEventListener('keydown', keyHandler);
  window.__rg[galleryId]._cleanup = () => document.removeEventListener('keydown', keyHandler);
}

function prevRoomImage(id) {
  const state = window.__rg[id];
  if (!state || !state.images.length) return;
  state.current = (state.current - 1 + state.images.length) % state.images.length;
  updateRoomGallery(id);
}

function nextRoomImage(id) {
  const state = window.__rg[id];
  if (!state || !state.images.length) return;
  state.current = (state.current + 1) % state.images.length;
  updateRoomGallery(id);
}

function goToRoomImage(id, idx) {
  const state = window.__rg[id];
  if (!state || !state.images.length) return;
  state.current = idx;
  updateRoomGallery(id);
}

function updateRoomGallery(id) {
  const state = window.__rg[id];
  if (!state || !state.images.length) return;
  const img = document.getElementById(`rg-img-${id}`);
  const counter = document.getElementById(`rg-counter-${id}`);
  if (img) {
    img.style.opacity = '0';
    setTimeout(() => { img.src = state.images[state.current].image; }, 180);
    setTimeout(() => { img.style.opacity = '1'; }, 200);
  }
  if (counter) counter.textContent = `${state.current + 1} / ${state.images.length}`;
  const thumbs = document.querySelectorAll(`[data-rg-thumb="${id}"]`);
  thumbs.forEach((el, i) => el.classList.toggle('rg-thumb--active', i === state.current));
}

function fullscreenRoomGallery(id) {
  const el = document.getElementById(`rg-${id}`);
  if (!el) return;
  if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  else if (el.msRequestFullscreen) el.msRequestFullscreen();
}
