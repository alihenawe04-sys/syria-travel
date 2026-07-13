require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const config = require('./config');

const { all, get, run, init, backup, restore, logActivity, addNotification, getMissedNotifications, markNotificationRead, markAllNotificationsRead, countUnreadNotifications } = require('./db');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const isProd = config.isProd;
function safeError(res, err) {
  const msg = isProd ? 'Internal server error' : err.message;
  console.error(err);
  res.status(500).json({ error: msg });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.cors.origin === '*' ? true : config.cors.origin.split(',').map(s => s.trim()),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
const PORT = config.port;

function sendEmail(to, subject, html, bookingId = 0) {
  try {
    const host = get("SELECT value FROM site_settings WHERE key = 'smtp_host'")?.value || '';
    const port = parseInt(get("SELECT value FROM site_settings WHERE key = 'smtp_port'")?.value || '587');
    const user = get("SELECT value FROM site_settings WHERE key = 'smtp_user'")?.value || '';
    const pass = get("SELECT value FROM site_settings WHERE key = 'smtp_pass'")?.value || '';
    const fromEmail = get("SELECT value FROM site_settings WHERE key = 'smtp_from_email'")?.value || 'noreply@syria-travel.com';
    const fromName = get("SELECT value FROM site_settings WHERE key = 'smtp_from_name'")?.value || 'Syria Travel';
    if (!host || !user || !pass) { run("INSERT INTO email_logs (recipient, subject, template, booking_id, status, error) VALUES (?, ?, 'smtp_not_configured', ?, 'failed', 'SMTP not configured')", [to, subject, bookingId]); return; }
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    transporter.sendMail({ from: `"${fromName}" <${fromEmail}>`, to, subject, html }).then(() => {
      run("INSERT INTO email_logs (recipient, subject, template, booking_id, status) VALUES (?, ?, 'email', ?, 'sent')", [to, subject, bookingId]);
    }).catch(err => {
      run("INSERT INTO email_logs (recipient, subject, template, booking_id, status, error) VALUES (?, ?, 'email', ?, 'failed', ?)", [to, subject, bookingId, err.message]);
    });
  } catch (err) { console.error('Email error:', err.message); }
}

function sendTemplateEmail(to, templateName, vars, lang = 'ar', bookingId = 0) {
  try {
    const tmpl = get("SELECT * FROM email_templates WHERE name = ?", [templateName]);
    if (!tmpl) return;
    const subject = lang === 'ar' ? tmpl.subject_ar : tmpl.subject;
    let body = lang === 'ar' ? tmpl.body_ar : tmpl.body;
    for (const [k, v] of Object.entries(vars)) body = body.replace(new RegExp('{{' + k + '}}', 'g'), v || '');
    if (body.includes('<')) {
      sendEmail(to, subject, body, bookingId);
    } else {
      sendEmail(to, subject, '<div style="font-family:Arial;padding:20px;max-width:600px;margin:auto;">' + body + '</div>', bookingId);
    }
  } catch (err) { console.error('Template email error:', err.message); }
}

function generateInvoicePDF(invoiceId, booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(24).fillColor('#C9A96E').text('✦ Syria Travel', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#333').text('INVOICE', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).fillColor('#666');
      doc.text(`Invoice #: INV-${String(invoiceId).padStart(5, '0')}`, { align: 'right' });
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, { align: 'right' });
      doc.moveDown();

      doc.fontSize(12).fillColor('#333').text('Bill To:', { underline: true });
      doc.fontSize(10).fillColor('#666');
      if (booking) {
        doc.text(`Name: ${booking.customer_name || 'N/A'}`);
        doc.text(`Email: ${booking.customer_email || 'N/A'}`);
        doc.text(`Phone: ${booking.customer_phone || 'N/A'}`);
      }
      doc.moveDown();

      doc.fontSize(12).fillColor('#333').text('Booking Details:', { underline: true });
      doc.fontSize(10).fillColor('#666');
      if (booking) {
        doc.text(`Reference: ${booking.booking_ref || 'N/A'}`);
        doc.text(`Item: ${booking.item_name || 'N/A'} (${booking.booking_type || 'N/A'})`);
        doc.text(`Check-in: ${booking.check_in || 'N/A'}`);
        doc.text(`Check-out: ${booking.check_out || 'N/A'}`);
      }
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#C9A96E');
      doc.moveDown();
      doc.fontSize(16).fillColor('#C9A96E').text(`Total: $${(booking?.total || 0).toFixed(2)}`, { align: 'right' });
      doc.moveDown(2);

      doc.fontSize(8).fillColor('#999').text('Syria Travel - Luxury Heritage Tourism', { align: 'center' });
      doc.text('Thank you for choosing Syria Travel!', { align: 'center' });

      doc.end();
    } catch (err) { reject(err); }
  });
}

const adminSockets = new Map(); // adminId -> Set<socketId>
const notificationQueue = [];

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Auth required'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!['super_admin', 'admin', 'booking_manager', 'content_manager'].includes(decoded.role)) {
      return next(new Error('Insufficient permissions'));
    }
    socket.adminId = decoded.id;
    socket.adminRole = decoded.role;
    socket.adminName = decoded.name || 'Admin';
    next();
  } catch { next(new Error('Invalid token')); }
});

io.on('connection', (socket) => {
  const adminId = socket.adminId;
  if (!adminSockets.has(adminId)) adminSockets.set(adminId, new Set());
  adminSockets.get(adminId).add(socket.id);
  // Send missed notifications
  const missed = getMissedNotifications(adminId, 0);
  if (missed && missed.length) socket.emit('notifications:missed', missed);
  socket.emit('notifications:count', countUnreadNotifications(adminId));
  socket.on('notifications:markRead', (notifId) => {
    markNotificationRead(notifId);
    socket.emit('notifications:count', countUnreadNotifications(adminId));
  });
  socket.on('notifications:markAllRead', () => {
    markAllNotificationsRead(adminId);
    socket.emit('notifications:count', 0);
  });
  socket.on('disconnect', () => {
    const set = adminSockets.get(adminId);
    if (set) { set.delete(socket.id); if (!set.size) adminSockets.delete(adminId); }
  });
});

function broadcastToAdmins(event, data) {
  let adminCount = 0;
  for (const [adminId, sockets] of adminSockets) {
    for (const sid of sockets) {
      io.to(sid).emit(event, data);
      adminCount++;
    }
  }
  return adminCount;
}

function notifyAdmins(type, title, message, data = {}, adminId = 0) {
  const id = addNotification(adminId, type, title, message, data);
  if (adminId > 0) {
    const sockets = adminSockets.get(adminId);
    if (sockets) for (const sid of sockets) io.to(sid).emit('notification', { id, type, title, message, data, created_at: new Date().toISOString() });
  } else {
    broadcastToAdmins('notification', { id, type, title, message, data, created_at: new Date().toISOString() });
  }
  // Also update stats
  broadcastToAdmins('stats:update', { _ts: Date.now() });
}
const JWT_SECRET = config.jwt.secret;

// Trust proxy (for HTTPS behind reverse proxy)
app.set('trust proxy', 1);
app.set('etag', false);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Compression
app.use(compression());

// Request logging
app.use(morgan(config.logLevel, {
  skip: (req) => req.url === '/api/health' || req.url.startsWith('/socket.io'),
}));

// Redirect HTTP to HTTPS behind reverse proxy
if (isProd) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') return res.redirect('https://' + req.get('host') + req.originalUrl);
    next();
  });
}

// CORS
const corsOrigins = config.cors.origin === '*' ? '*' : config.cors.origin.split(',').map(s => s.trim());
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Country-Code'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname), {
  maxAge: isProd ? '1d' : 0,
  etag: false,
}));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: isProd ? '30d' : 0,
}));

// Helper: Serve HTML with API URL injection
function serveHTML(res, filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const apiUrl = config.apiUrl || '';
  const injected = content.replace(
    '<meta name="api-url" content="">',
    `<meta name="api-url" content="${apiUrl}">`
  );
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(injected);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  message: { error: 'Too many login attempts.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '3.0.0',
  });
});

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WebP, and GIF images are allowed.'), false);
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(config.upload.dir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
  }
});
const upload = multer({ storage, fileFilter, limits: { fileSize: config.upload.maxFileSize } });

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Authorization required.' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: 'Invalid token.' }); }
}

function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Authorization required.' });
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    if (!['super_admin', 'admin', 'booking_manager', 'content_manager'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    req.admin = decoded;
    next();
  } catch { return res.status(401).json({ error: 'Invalid token.' }); }
}

function superAdminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Authorization required.' });
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    if (decoded.role !== 'super_admin') return res.status(403).json({ error: 'Super admin only.' });
    req.admin = decoded;
    next();
  } catch { return res.status(401).json({ error: 'Invalid token.' }); }
}

// ==================== AUTH ====================
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required.' });
    const existing = get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const hash = bcrypt.hashSync(password, 10);
    run('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)', [name, email, phone || '', hash]);
    const user = get('SELECT id, name, email, phone, role, created_at FROM users WHERE email = ?', [email]);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
    notifyAdmins('user', `مستخدم جديد: ${name}`, `البريد: ${email}`, { user_id: user.id, name, email, phone });
  } catch (err) { safeError(res, err); }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, phone, country_code } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    const user = get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials.' });
    if (phone) run('UPDATE users SET phone = ?, country_code = ? WHERE id = ?', [phone, country_code || '', user.id]);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userData } = user;
    if (phone) userData.phone = phone;
    res.json({ token, user: userData });
  } catch (err) { safeError(res, err); }
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = get('SELECT id, name, email, phone, role, avatar, country, city, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

// ==================== SETTINGS ====================
app.get('/api/settings', (req, res) => {
  try {
    const settings = all('SELECT key, value FROM site_settings');
    const obj = {};
    settings.forEach(s => obj[s.key] = s.value);
    res.json(obj);
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/settings', adminAuth, (req, res) => {
  try {
    const settings = all('SELECT key, value FROM site_settings');
    res.json({ settings });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/settings', adminAuth, (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Settings object required.' });
    for (const [key, value] of Object.entries(settings)) {
      const existing = get('SELECT id FROM site_settings WHERE key = ?', [key]);
      if (existing) run('UPDATE site_settings SET value = ? WHERE key = ?', [String(value), key]);
      else run('INSERT INTO site_settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }
    logActivity(req.admin.id || 0, req.admin.email, 'Settings Updated', 'Site settings updated');
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== COUNTRIES ====================
app.get('/api/countries', (req, res) => {
  try {
    const countries = all('SELECT * FROM country_codes ORDER BY name');
    res.json({ countries });
  } catch (err) { safeError(res, err); }
});

// ==================== UPLOAD ====================
const uploadSingle = (req, res, next) => { const u = upload.single('file'); u(req, res, (err) => { if (err instanceof multer.MulterError) { if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 5MB.' }); return res.status(400).json({ error: 'Upload error.' }); } if (err) return res.status(400).json({ error: 'Upload error.' }); next(); }); };
const uploadMultiple = (req, res, next) => { const u = upload.array('files', 20); u(req, res, (err) => { if (err instanceof multer.MulterError) { if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 5MB.' }); if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'Too many files. Max 20.' }); return res.status(400).json({ error: 'Upload error.' }); } if (err) return res.status(400).json({ error: 'Upload error.' }); next(); }); };

app.post('/api/admin/upload', adminAuth, uploadSingle, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

app.post('/api/admin/upload-multiple', adminAuth, uploadMultiple, (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded.' });
  const urls = req.files.map(f => ({ url: `/uploads/${f.filename}`, filename: f.filename }));
  res.json({ files: urls });
});

// ==================== HOTELS ====================
app.get('/api/hotels', (req, res) => {
  try {
    let sql = 'SELECT * FROM hotels WHERE status = ?';
    const params = ['active'];
    if (req.query.featured === '1') { sql += ' AND featured = 1'; }
    if (req.query.city_id) { sql += ' AND city_id = ?'; params.push(req.query.city_id); }
    sql += ' ORDER BY featured DESC, id DESC';
    const hotels = all(sql, params);
    const result = hotels.map(h => ({
      ...h,
      amenities: JSON.parse(h.amenities || '[]')
    }));
    res.json({ hotels: result });
  } catch (err) { safeError(res, err); }
});

app.get('/api/hotels/:slug', (req, res) => {
  try {
    const hotel = get('SELECT * FROM hotels WHERE slug = ?', [req.params.slug]);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found.' });
    hotel.amenities = JSON.parse(hotel.amenities || '[]');
    hotel.images = all('SELECT * FROM hotel_images WHERE hotel_id = ? ORDER BY sort_order', [hotel.id]);
    hotel.rooms = all('SELECT * FROM rooms WHERE hotel_id = ? AND status = ? ORDER BY price', [hotel.id, 'active']);
    hotel.rooms = hotel.rooms.map(r => ({
      ...r,
      services: JSON.parse(r.services || '[]'),
      amenities: JSON.parse(r.amenities || '[]'),
      images: all('SELECT * FROM room_images WHERE room_id = ? ORDER BY sort_order', [r.id])
    }));
    res.json({ hotel });
  } catch (err) { safeError(res, err); }
});

// ==================== ROOMS ====================
app.get('/api/rooms/:slug', (req, res) => {
  try {
    const room = get('SELECT * FROM rooms WHERE slug = ?', [req.params.slug]);
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    room.services = JSON.parse(room.services || '[]');
    room.amenities = JSON.parse(room.amenities || '[]');
    room.availability = JSON.parse(room.availability || '[]');
    room.images = all('SELECT * FROM room_images WHERE room_id = ? ORDER BY sort_order', [room.id]);
    const hotel = get('SELECT * FROM hotels WHERE id = ?', [room.hotel_id]);
    res.json({ room, hotel });
  } catch (err) { safeError(res, err); }
});

// ==================== TOURS ====================
app.get('/api/tours', (req, res) => {
  try {
    let sql = 'SELECT * FROM tours WHERE status = ?';
    const params = ['active'];
    if (req.query.featured === '1') sql += ' AND featured = 1';
    sql += ' ORDER BY featured DESC, id DESC';
    const tours = all(sql, params);
    const result = tours.map(t => ({
      ...t,
      included: JSON.parse(t.included || '[]'),
      included_ar: JSON.parse(t.included_ar || '[]')
    }));
    res.json({ tours: result });
  } catch (err) { safeError(res, err); }
});

app.get('/api/tours/:slug', (req, res) => {
  try {
    const tour = get('SELECT * FROM tours WHERE slug = ?', [req.params.slug]);
    if (!tour) return res.status(404).json({ error: 'Tour not found.' });
    tour.included = JSON.parse(tour.included || '[]');
    tour.included_ar = JSON.parse(tour.included_ar || '[]');
    tour.images = all('SELECT * FROM tour_images WHERE tour_id = ? ORDER BY sort_order', [tour.id]);
    tour.itinerary = all('SELECT * FROM tour_itinerary WHERE tour_id = ? ORDER BY day, sort_order', [tour.id]);
    res.json({ tour });
  } catch (err) { safeError(res, err); }
});

// ==================== VEHICLES ====================
app.get('/api/vehicles', (req, res) => {
  try {
    let sql = 'SELECT * FROM vehicles WHERE status = ?';
    const params = ['active'];
    if (req.query.featured === '1') sql += ' AND featured = 1';
    sql += ' ORDER BY featured DESC, id DESC';
    const vehicles = all(sql, params);
    const result = vehicles.map(v => ({
      ...v,
      features: JSON.parse(v.features || '[]'),
      features_ar: JSON.parse(v.features_ar || '[]')
    }));
    res.json({ vehicles: result });
  } catch (err) { safeError(res, err); }
});

app.get('/api/vehicles/:slug', (req, res) => {
  try {
    const vehicle = get('SELECT * FROM vehicles WHERE slug = ?', [req.params.slug]);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
    vehicle.features = JSON.parse(vehicle.features || '[]');
    vehicle.features_ar = JSON.parse(vehicle.features_ar || '[]');
    vehicle.images = all('SELECT * FROM vehicle_images WHERE vehicle_id = ? ORDER BY sort_order', [vehicle.id]);
    res.json({ vehicle });
  } catch (err) { safeError(res, err); }
});

// ==================== GALLERY ====================
app.get('/api/gallery', (req, res) => {
  try {
    const items = all('SELECT * FROM gallery WHERE status = ? ORDER BY featured DESC, id DESC', ['active']);
    const result = items.map(g => ({
      ...g,
      activities: JSON.parse(g.activities || '[]'),
      activities_ar: JSON.parse(g.activities_ar || '[]'),
      images: all('SELECT * FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order LIMIT 1', [g.id])
    }));
    res.json({ gallery: result });
  } catch (err) { safeError(res, err); }
});

app.get('/api/gallery/:slug', (req, res) => {
  try {
    const item = get('SELECT * FROM gallery WHERE slug = ?', [req.params.slug]);
    if (!item) return res.status(404).json({ error: 'Gallery item not found.' });
    item.activities = JSON.parse(item.activities || '[]');
    item.activities_ar = JSON.parse(item.activities_ar || '[]');
    item.images = all('SELECT * FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order', [item.id]);
    res.json({ item });
  } catch (err) { safeError(res, err); }
});

// ==================== BOOKINGS ====================
app.post('/api/bookings', auth, (req, res) => {
  try {
    const { customer_name, customer_phone, customer_whatsapp, country_code, booking_type, item_id, item_name, room_id, room_name, check_in, check_out, guests, nights, days, rooms_count, total, special_requests, payment_method, customer_email, nationality } = req.body;
    if (!customer_name || !customer_phone) return res.status(400).json({ error: 'Name and phone required.' });
    const ref = 'BK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    run(`INSERT INTO bookings (booking_ref, user_id, customer_name, customer_phone, customer_whatsapp, country_code, booking_type, item_id, item_name, room_id, room_name, check_in, check_out, guests, nights, days, rooms_count, total, special_requests, payment_method, customer_email, nationality, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
      [ref, req.user.id, customer_name, customer_phone, customer_whatsapp || customer_phone, country_code || '', booking_type, item_id || 0, item_name || '', room_id || 0, room_name || '', check_in || '', check_out || '', guests || 1, nights || 0, days || 0, rooms_count || 1, total || 0, special_requests || '', payment_method || 'bank_transfer', customer_email || '', nationality || '']);
    const booking = get("SELECT * FROM bookings WHERE booking_ref = ?", [ref]);
    // Apply coupon if provided
    if (req.body.coupon_code) {
      const coupon = get("SELECT * FROM coupons WHERE code = ? AND active = 1", [req.body.coupon_code.toUpperCase()]);
      if (coupon) {
        const discount = coupon.type === 'percent' ? ((total||0) * coupon.value / 100) : Math.min(coupon.value, total||0);
        run("UPDATE bookings SET coupon_code = ?, discount_amount = ? WHERE id = ?", [coupon.code, Math.round(discount*100)/100, booking.id]);
      }
    }
    // Award loyalty points
    const pts = Math.floor((total||0) * 0.5);
    if (pts > 0) {
      run("UPDATE users SET loyalty_points = COALESCE(loyalty_points,0) + ? WHERE id = ?", [pts, req.user.id]);
      run("INSERT INTO loyalty_points (user_id, points, type, reference, booking_id) VALUES (?, ?, 'earned', 'booking', ?)", [req.user.id, pts, booking.id]);
    }
    notifyAdmins('booking', `حجز جديد: ${customer_name}`, `نوع: ${booking_type} | ${item_name}`, { booking_id: booking.id, ref, customer_name, booking_type, item_name, total });
    res.status(201).json({ booking });
    const customer = get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (customer && customer.email) {
      const lang = req.body.lang || 'ar';
      sendTemplateEmail(customer.email, 'booking_confirmation', {
        name: customer_name || customer.name,
        ref: ref,
        item: item_name || '',
        check_in: check_in || '',
        check_out: check_out || '',
        total: String(total || 0)
      }, lang, booking.id);
    }
  } catch (err) { safeError(res, err); }
});

app.get('/api/bookings', auth, (req, res) => {
  try {
    const bookings = all('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ bookings });
  } catch (err) { safeError(res, err); }
});

app.get('/api/bookings/active-trip', auth, (req, res) => {
  try {
    const booking = get("SELECT b.*, u.email as user_email, u.name as user_name FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.user_id = ? AND b.booking_type = 'tour' AND b.status NOT IN ('cancelled','completed') ORDER BY b.created_at DESC LIMIT 1", [req.user.id]);
    if (!booking) return res.json({ booking_id: null });
    const prog = get('SELECT COUNT(*) as total, SUM(CASE WHEN completed=1 THEN 1 ELSE 0 END) as done FROM trip_progress WHERE booking_id = ?', [booking.id]);
    res.json({ booking_id: booking.id, total: prog ? prog.total : 0, done: prog ? prog.done : 0, booking });
  } catch (err) { safeError(res, err); }
});

// ==================== TRIP PROGRESS ====================
app.get('/api/trip-progress/:bookingId', auth, (req, res) => {
  try {
    const booking = get("SELECT b.*, u.email as user_email, u.name as user_name FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = ? AND b.user_id = ?", [req.params.bookingId, req.user.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    let progress = all('SELECT * FROM trip_progress WHERE booking_id = ? ORDER BY day, id', [req.params.bookingId]);
    if (progress.length === 0) {
      const itinerary = all('SELECT * FROM tour_itinerary WHERE tour_id = ? ORDER BY day, sort_order', [booking.item_id]);
      if (itinerary.length > 0) {
        for (const it of itinerary) {
          run("INSERT INTO trip_progress (booking_id, itinerary_id, day, title, title_ar) VALUES (?, ?, ?, ?, ?)",
            [req.params.bookingId, it.id, it.day, it.title, it.title_ar]);
        }
        progress = all('SELECT * FROM trip_progress WHERE booking_id = ? ORDER BY day, id', [req.params.bookingId]);
      }
    }
    res.json({ progress, booking });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/trip-progress/:bookingId', adminAuth, (req, res) => {
  try {
    const booking = get("SELECT b.*, u.email as user_email, u.name as user_name FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = ?", [req.params.bookingId]);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    let progress = all('SELECT * FROM trip_progress WHERE booking_id = ? ORDER BY day, id', [req.params.bookingId]);
    if (progress.length === 0) {
      const itinerary = all('SELECT * FROM tour_itinerary WHERE tour_id = ? ORDER BY day, sort_order', [booking.item_id]);
      if (itinerary.length > 0) {
        for (const it of itinerary) {
          run("INSERT INTO trip_progress (booking_id, itinerary_id, day, title, title_ar) VALUES (?, ?, ?, ?, ?)",
            [req.params.bookingId, it.id, it.day, it.title, it.title_ar]);
        }
        progress = all('SELECT * FROM trip_progress WHERE booking_id = ? ORDER BY day, id', [req.params.bookingId]);
      }
    }
    res.json({ progress, booking });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/trip-progress/:bookingId', adminAuth, (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Items array required.' });
    for (const item of items) {
      run("UPDATE trip_progress SET completed = ?, completed_at = CASE WHEN ? THEN datetime('now') ELSE '' END WHERE id = ? AND booking_id = ?",
        [item.completed ? 1 : 0, item.completed ? 1 : 0, item.id, req.params.bookingId]);
    }
    logActivity(req.admin.id || 0, req.admin.email, 'Trip Progress Updated', `Booking #${req.params.bookingId}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== CONTACT ====================
app.post('/api/contact', (req, res) => {
  try {
    const { name, phone, whatsapp, email, subject, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'Name and message required.' });
    run('INSERT INTO contact_inquiries (name, phone, whatsapp, email, subject, message) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone || '', whatsapp || '', email || '', subject || '', message]);
    notifyAdmins('contact', `استفسار جديد من ${name}`, subject || message.substring(0, 100), { name, phone, email, subject, message });
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== REVIEWS ====================
app.get('/api/reviews', (req, res) => {
  try {
    const reviews = all("SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC");
    res.json({ reviews });
  } catch (err) { safeError(res, err); }
});

app.post('/api/reviews', (req, res) => {
  try {
    const { item_type, item_id, user_name, user_country, rating, text, text_ar } = req.body;
    if (!item_type || !item_id || !user_name || !text) return res.status(400).json({ error: 'Required fields missing.' });
    run('INSERT INTO reviews (item_type, item_id, user_name, user_country, rating, text, text_ar) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [item_type, item_id, user_name, user_country || '', rating || 5, text, text_ar || '']);
    notifyAdmins('review', `تقييم جديد من ${user_name}`, `${item_type} #${item_id} - ${rating}⭐`, { item_type, item_id, user_name, rating });
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== OFFERS ====================
app.get('/api/offers', (req, res) => {
  try {
    const offers = all("SELECT * FROM offers WHERE status = 'active' AND (end_date = '' OR end_date >= date('now')) ORDER BY id DESC");
    offers.forEach(o => { try { o.sections = JSON.parse(o.sections || '[]'); } catch(e) { o.sections = []; } });
    res.json({ offers });
  } catch (err) { safeError(res, err); }
});

app.get('/api/offers/:id', (req, res) => {
  try {
    const o = get('SELECT * FROM offers WHERE id = ? AND status = ?', [req.params.id, 'active']);
    if (!o) return res.status(404).json({ error: 'Not found' });
    try { o.sections = JSON.parse(o.sections || '[]'); } catch(e) { o.sections = []; }
    res.json({ offer: o });
  } catch (err) { safeError(res, err); }
});

// ==================== PAGES ====================
app.get('/api/pages/:slug', (req, res) => {
  try {
    const page = get('SELECT * FROM pages WHERE slug = ?', [req.params.slug]);
    if (!page) return res.status(404).json({ error: 'Page not found.' });
    res.json({ page });
  } catch (err) { safeError(res, err); }
});

// ==================== CITIES ====================
app.get('/api/cities', (req, res) => {
  try {
    const cities = all('SELECT c.*, (SELECT COUNT(*) FROM hotels WHERE city_id = c.id AND status = ?) as hotel_count FROM cities c ORDER BY c.name', ['active']);
    res.json({ cities });
  } catch (err) { safeError(res, err); }
});

app.get('/api/cities/:id', (req, res) => {
  try {
    const city = all('SELECT c.*, (SELECT COUNT(*) FROM hotels WHERE city_id = c.id AND status = ?) as hotel_count FROM cities c WHERE c.id = ?', ['active', req.params.id]);
    if (!city || city.length === 0) return res.status(404).json({ error: 'City not found.' });
    const c = city[0];
    c.activities = JSON.parse(c.activities || '[]');
    c.activities_ar = JSON.parse(c.activities_ar || '[]');
    c.images = all('SELECT * FROM city_images WHERE city_id = ? ORDER BY sort_order', [c.id]);
    const hotels = all('SELECT * FROM hotels WHERE city_id = ? AND status = ? ORDER BY featured DESC, id DESC', [c.id, 'active']);
    c.hotels = hotels.map(h => ({
      ...h,
      amenities: JSON.parse(h.amenities || '[]')
    }));
    res.json({ city: c });
  } catch (err) { safeError(res, err); }
});

// ==================== HOMEPAGE ====================
app.get('/api/homepage', (req, res) => {
  try {
    const sections = all('SELECT * FROM homepage_sections');
    const data = {};
    sections.forEach(s => {
      try { data[s.section_key] = JSON.parse(s.content); } catch { data[s.section_key] = s.content; }
    });
    res.json(data);
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN ====================
app.post('/api/admin/login', authLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Credentials required.' });
    const user = get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials.' });
    if (!['super_admin', 'admin', 'booking_manager', 'content_manager'].includes(user.role)) {
      return res.status(403).json({ error: 'Not authorized as admin.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    logActivity(user.id, user.name, 'Admin Login', 'Admin panel login');
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/stats', adminAuth, (req, res) => {
  try {
    const total_bookings = get("SELECT COUNT(*) as count FROM bookings");
    const new_bookings = get("SELECT COUNT(*) as count FROM bookings WHERE status = 'new'");
    const pending = get("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'");
    const confirmed = get("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'");
    const completed = get("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'");
    const cancelled = get("SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'");
    const revenue = get("SELECT COALESCE(SUM(total), 0) as total FROM bookings WHERE status IN ('confirmed', 'completed')");
    const total_hotels = get("SELECT COUNT(*) as count FROM hotels");
    const total_tours = get("SELECT COUNT(*) as count FROM tours");
    const total_vehicles = get("SELECT COUNT(*) as count FROM vehicles");
    const total_inquiries = get("SELECT COUNT(*) as count FROM contact_inquiries");
    const total_reviews = get("SELECT COUNT(*) as count FROM reviews");
    const pending_reviews = get("SELECT COUNT(*) as count FROM reviews WHERE status = 'pending'");
    const total_users = get("SELECT COUNT(*) as count FROM users");
    res.json({ total_bookings: total_bookings.count, new_bookings: new_bookings.count, pending: pending.count, confirmed: confirmed.count, completed: completed.count, cancelled: cancelled.count, revenue: revenue.total, total_hotels: total_hotels.count, total_tours: total_tours.count, total_vehicles: total_vehicles.count, total_inquiries: total_inquiries.count, total_reviews: total_reviews.count, pending_reviews: pending_reviews.count, total_users: total_users.count });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN STATS EXTENDED ====================
app.get('/api/admin/hotels-stats', adminAuth, (req, res) => {
  try {
    const hotels = all(`SELECT h.*, 
      (SELECT COUNT(*) FROM rooms WHERE hotel_id = h.id) as total_rooms,
      (SELECT COUNT(*) FROM rooms WHERE hotel_id = h.id AND status = 'active') as available_rooms,
      (SELECT COUNT(*) FROM bookings WHERE item_id = h.id AND booking_type = 'hotel') as total_bookings,
      (SELECT COALESCE(SUM(total), 0) FROM bookings WHERE item_id = h.id AND booking_type = 'hotel' AND status IN ('confirmed','completed')) as revenue
    FROM hotels h ORDER BY h.id DESC`);
    res.json({ hotels });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/tours-stats', adminAuth, (req, res) => {
  try {
    const tours = all(`SELECT t.*,
      (SELECT COUNT(*) FROM bookings WHERE item_id = t.id AND booking_type = 'tour') as bookings_count
    FROM tours t ORDER BY t.id DESC`);
    res.json({ tours });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/vehicles-stats', adminAuth, (req, res) => {
  try {
    const vehicles = all(`SELECT v.*,
      (SELECT COUNT(*) FROM bookings WHERE item_id = v.id AND booking_type = 'car') as reservations_count
    FROM vehicles v ORDER BY v.id DESC`);
    res.json({ vehicles });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/revenue', adminAuth, (req, res) => {
  try {
    const total = get("SELECT COALESCE(SUM(total), 0) as total FROM bookings WHERE status IN ('confirmed','completed')");
    const hotels = get("SELECT COALESCE(SUM(total), 0) as total FROM bookings WHERE booking_type = 'hotel' AND status IN ('confirmed','completed')");
    const tours = get("SELECT COALESCE(SUM(total), 0) as total FROM bookings WHERE booking_type = 'tour' AND status IN ('confirmed','completed')");
    const cars = get("SELECT COALESCE(SUM(total), 0) as total FROM bookings WHERE booking_type = 'car' AND status IN ('confirmed','completed')");
    const monthly = all(`SELECT strftime('%Y-%m', created_at) as month, SUM(total) as total FROM bookings WHERE status IN ('confirmed','completed') AND created_at >= date('now', '-12 months') GROUP BY month ORDER BY month`);
    res.json({ total: total.total, hotels: hotels.total, tours: tours.total, cars: cars.total, monthly });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    let countSql = 'SELECT COUNT(*) as total FROM users';
    let sql = 'SELECT id, name, email, phone, role, country, total_bookings, status, created_at FROM users';
    const params = [];
    if (search) {
      const where = " WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      countSql += where;
      sql += where;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    const countResult = get(countSql, params);
    const users = all(sql, [...params, limit, offset]);
    res.json({ users, total: countResult.total, page, limit });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/new-users', adminAuth, (req, res) => {
  try {
    const users = all("SELECT id, name, email, phone, role, country, total_bookings, status, created_at FROM users WHERE created_at >= datetime('now', '-30 days') ORDER BY id DESC");
    res.json({ users });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/pending-items', adminAuth, (req, res) => {
  try {
    const pending_bookings = all("SELECT * FROM bookings WHERE status = 'pending' ORDER BY created_at DESC");
    const pending_reviews = all("SELECT * FROM reviews WHERE status = 'pending' ORDER BY created_at DESC");
    const pending_hotels = all("SELECT * FROM hotels WHERE status = 'pending' OR status IS NULL ORDER BY id DESC");
    const pending_tours = all("SELECT * FROM tours WHERE status = 'pending' OR status IS NULL ORDER BY id DESC");
    res.json({ pending_bookings, pending_reviews, pending_hotels, pending_tours });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/users/:id', adminAuth, (req, res) => {
  try {
    const user = get('SELECT id, name, email, phone, role, country, city, total_bookings, status, created_at, notes FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const bookings_count = get("SELECT COUNT(*) as count FROM bookings WHERE user_id = ?", [req.params.id]);
    user.bookings_count = bookings_count.count;
    res.json({ user });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/users/:id', adminAuth, (req, res) => {
  try {
    const { role, name, phone, country, status, notes } = req.body;
    run('UPDATE users SET role = COALESCE(?, role), name = COALESCE(?, name), phone = COALESCE(?, phone), country = COALESCE(?, country), status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?',
      [role || null, name || null, phone || null, country || null, status || null, notes || null, req.params.id]);
    logActivity(req.admin.id || 0, req.admin.email, 'User Updated', `User ID: ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/users/:id', adminAuth, (req, res) => {
  try {
    run('DELETE FROM bookings WHERE user_id = ?', [req.params.id]);
    run('DELETE FROM users WHERE id = ?', [req.params.id]);
    logActivity(req.admin.id || 0, req.admin.email, 'User Deleted', `User ID: ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/bookings/:id/status', adminAuth, (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled', 'completed'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    run('UPDATE bookings SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, req.params.id]);
    logActivity(req.admin.id || 0, req.admin.email, 'Booking Status Changed', `Booking #${req.params.id} -> ${status}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/bookings', adminAuth, (req, res) => {
  try {
    let sql = 'SELECT * FROM bookings';
    const params = [];
    const conditions = [];
    if (req.query.status) { conditions.push('status = ?'); params.push(req.query.status); }
    if (req.query.search) { conditions.push('(customer_name LIKE ? OR booking_ref LIKE ? OR customer_phone LIKE ?)'); params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`); }
    if (req.query.booking_type) { conditions.push('booking_type = ?'); params.push(req.query.booking_type); }
    if (req.query.item_id) { conditions.push('item_id = ?'); params.push(req.query.item_id); }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    if (req.query.limit) { sql += ' LIMIT ?'; params.push(parseInt(req.query.limit)); }
    const bookings = all(sql, params);
    res.json({ bookings });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/bookings/:id', adminAuth, (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required.' });
    run('UPDATE bookings SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, req.params.id]);
    logActivity(req.admin.id || 0, req.admin.email, 'Booking Status Changed', `Booking #${req.params.id} -> ${status}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/bookings/:id', adminAuth, (req, res) => {
  try { run('DELETE FROM bookings WHERE id = ?', [req.params.id]); res.json({ ok: true }); } catch (err) { safeError(res, err); }
});

// Admin: Hotels CRUD
app.get('/api/admin/hotels', adminAuth, (req, res) => {
  try {
    const hotels = all('SELECT * FROM hotels ORDER BY id DESC');
    res.json({ hotels });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/hotels', adminAuth, (req, res) => {
  try {
    const data = req.body;
    const slug = data.slug || uuidv4();
    const result = run(`INSERT INTO hotels (slug, name, name_ar, city_id, city, city_ar, address, address_ar, rating, price, cover_image, desc, desc_ar, long_desc, long_desc_ar, amenities, policies, policies_ar, lat, lng, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, data.name, data.name_ar || '', data.city_id || 0, data.city || '', data.city_ar || '', data.address || '', data.address_ar || '', data.rating || 5, data.price || 0, data.cover_image || '', data.desc || '', data.desc_ar || '', data.long_desc || '', data.long_desc_ar || '', JSON.stringify(data.amenities || []), data.policies || '', data.policies_ar || '', data.lat || 0, data.lng || 0, data.featured || 0]);
    logActivity(req.admin.id || 0, req.admin.email, 'Hotel Created', `Hotel: ${data.name}`);
    res.status(201).json({ id: result.lastInsertRowid, slug });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/hotels/:id', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run(`UPDATE hotels SET name=?, name_ar=?, city_id=?, city=?, city_ar=?, address=?, address_ar=?, rating=?, price=?, cover_image=?, desc=?, desc_ar=?, long_desc=?, long_desc_ar=?, amenities=?, policies=?, policies_ar=?, lat=?, lng=?, featured=?, status=?, updated_at=datetime('now') WHERE id=?`,
      [data.name, data.name_ar || '', data.city_id || 0, data.city || '', data.city_ar || '', data.address || '', data.address_ar || '', data.rating || 5, data.price || 0, data.cover_image || '', data.desc || '', data.desc_ar || '', data.long_desc || '', data.long_desc_ar || '', JSON.stringify(data.amenities || []), data.policies || '', data.policies_ar || '', data.lat || 0, data.lng || 0, data.featured || 0, data.status || 'active', req.params.id]);
    logActivity(req.admin.id || 0, req.admin.email, 'Hotel Updated', `Hotel ID: ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/hotels/:id', adminAuth, (req, res) => {
  try {
    run('DELETE FROM hotel_images WHERE hotel_id = ?', [req.params.id]);
    const rooms = all('SELECT id FROM rooms WHERE hotel_id = ?', [req.params.id]);
    for (const r of rooms) { run('DELETE FROM room_images WHERE room_id = ?', [r.id]); }
    run('DELETE FROM rooms WHERE hotel_id = ?', [req.params.id]);
    run('DELETE FROM hotels WHERE id = ?', [req.params.id]);
    logActivity(req.admin.id || 0, req.admin.email, 'Hotel Deleted', `Hotel ID: ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Hotel Images
app.get('/api/admin/hotels/:id/images', adminAuth, (req, res) => {
  try {
    const images = all('SELECT * FROM hotel_images WHERE hotel_id = ? ORDER BY sort_order', [req.params.id]);
    res.json({ images });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/hotels/:id/images', adminAuth, (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) return res.status(400).json({ error: 'Images array required.' });
    for (const img of images) {
      run('INSERT INTO hotel_images (hotel_id, image, title, title_ar, sort_order) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, img.image, img.title || '', img.title_ar || '', img.sort_order || 0]);
    }
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/hotel-images/:id', adminAuth, (req, res) => {
  try { run('DELETE FROM hotel_images WHERE id = ?', [req.params.id]); res.json({ ok: true }); } catch (err) { safeError(res, err); }
});

// Admin: Rooms CRUD
app.get('/api/admin/rooms', adminAuth, (req, res) => {
  try {
    let sql = 'SELECT r.*, h.name as hotel_name FROM rooms r LEFT JOIN hotels h ON r.hotel_id = h.id';
    const params = [];
    if (req.query.hotel_id) { sql += ' WHERE r.hotel_id = ?'; params.push(req.query.hotel_id); }
    sql += ' ORDER BY r.id DESC';
    const rooms = all(sql, params);
    res.json({ rooms });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/rooms', adminAuth, (req, res) => {
  try {
    const data = req.body;
    const slug = data.slug || `room-${uuidv4().substring(0, 8)}`;
    const result = run(`INSERT INTO rooms (hotel_id, slug, name, name_ar, category, category_ar, capacity, size, bed_type, bed_type_ar, price, description, description_ar, services, amenities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.hotel_id, slug, data.name, data.name_ar || '', data.category || '', data.category_ar || '', data.capacity || 2, data.size || '', data.bed_type || '', data.bed_type_ar || '', data.price || 0, data.description || '', data.description_ar || '', JSON.stringify(data.services || []), JSON.stringify(data.amenities || [])]);
    logActivity(req.admin.id || 0, req.admin.email, 'Room Created', `Room: ${data.name}`);
    res.status(201).json({ id: result.lastInsertRowid, slug });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/rooms/:id', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run(`UPDATE rooms SET name=?, name_ar=?, category=?, category_ar=?, capacity=?, size=?, bed_type=?, bed_type_ar=?, price=?, description=?, description_ar=?, services=?, amenities=?, status=?, updated_at=datetime('now') WHERE id=?`,
      [data.name, data.name_ar || '', data.category || '', data.category_ar || '', data.capacity || 2, data.size || '', data.bed_type || '', data.bed_type_ar || '', data.price || 0, data.description || '', data.description_ar || '', JSON.stringify(data.services || []), JSON.stringify(data.amenities || []), data.status || 'active', req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/rooms/:id', adminAuth, (req, res) => {
  try {
    run('DELETE FROM room_images WHERE room_id = ?', [req.params.id]);
    run('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Room Images
app.get('/api/admin/rooms/:id/images', adminAuth, (req, res) => {
  try {
    const images = all('SELECT * FROM room_images WHERE room_id = ? ORDER BY sort_order', [req.params.id]);
    res.json({ images });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/rooms/:id/images', adminAuth, (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) return res.status(400).json({ error: 'Images array required.' });
    for (const img of images) {
      run('INSERT INTO room_images (room_id, image, title, title_ar, description, description_ar, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, img.image, img.title || '', img.title_ar || '', img.description || '', img.description_ar || '', img.sort_order || 0]);
    }
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/room-images/:id', adminAuth, (req, res) => {
  try { run('DELETE FROM room_images WHERE id = ?', [req.params.id]); res.json({ ok: true }); } catch (err) { safeError(res, err); }
});

// Admin: Tours CRUD
app.get('/api/admin/tours', adminAuth, (req, res) => {
  try {
    const tours = all('SELECT * FROM tours ORDER BY id DESC');
    res.json({ tours });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/tours', adminAuth, (req, res) => {
  try {
    const data = req.body;
    const slug = data.slug || uuidv4();
    const result = run(`INSERT INTO tours (slug, name, name_ar, city_id, duration, duration_ar, price, image, description, description_ar, included, included_ar, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, data.name, data.name_ar || '', data.city_id || 0, data.duration || '', data.duration_ar || '', data.price || 0, data.image || '', data.description || '', data.description_ar || '', JSON.stringify(data.included || []), JSON.stringify(data.included_ar || []), data.featured || 0]);
    logActivity(req.admin.id || 0, req.admin.email, 'Tour Created', `Tour: ${data.name}`);
    res.status(201).json({ id: result.lastInsertRowid, slug });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/tours/:id', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run(`UPDATE tours SET name=?, name_ar=?, city_id=?, duration=?, duration_ar=?, price=?, image=?, description=?, description_ar=?, included=?, included_ar=?, featured=?, status=?, updated_at=datetime('now') WHERE id=?`,
      [data.name, data.name_ar || '', data.city_id || 0, data.duration || '', data.duration_ar || '', data.price || 0, data.image || '', data.description || '', data.description_ar || '', JSON.stringify(data.included || []), JSON.stringify(data.included_ar || []), data.featured || 0, data.status || 'active', req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/tours/:id', adminAuth, (req, res) => {
  try {
    run('DELETE FROM tour_images WHERE tour_id = ?', [req.params.id]);
    run('DELETE FROM tour_itinerary WHERE tour_id = ?', [req.params.id]);
    run('DELETE FROM tours WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Tour Itinerary
app.post('/api/admin/tours/:id/itinerary', adminAuth, (req, res) => {
  try {
    const { itinerary } = req.body;
    if (!Array.isArray(itinerary)) return res.status(400).json({ error: 'Itinerary array required.' });
    run('DELETE FROM tour_itinerary WHERE tour_id = ?', [req.params.id]);
    for (const item of itinerary) {
      run('INSERT INTO tour_itinerary (tour_id, day, title, title_ar, description, description_ar, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, item.day || 1, item.title || '', item.title_ar || '', item.description || '', item.description_ar || '', item.sort_order || 0]);
    }
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Tour Images
app.post('/api/admin/tours/:id/images', adminAuth, (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) return res.status(400).json({ error: 'Images array required.' });
    for (const img of images) {
      run('INSERT INTO tour_images (tour_id, image, title, sort_order) VALUES (?, ?, ?, ?)',
        [req.params.id, img.image, img.title || '', img.sort_order || 0]);
    }
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Vehicles CRUD
app.get('/api/admin/vehicles', adminAuth, (req, res) => {
  try {
    const vehicles = all('SELECT * FROM vehicles ORDER BY id DESC');
    res.json({ vehicles });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/vehicles', adminAuth, (req, res) => {
  try {
    const data = req.body;
    const slug = data.slug || uuidv4();
    const result = run(`INSERT INTO vehicles (slug, name, name_ar, brand, model, year, transmission, fuel_type, seats, luggage, price_per_day, price_per_week, price_per_month, image, features, features_ar, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, data.name, data.name_ar || '', data.brand || '', data.model || '', data.year || 2024, data.transmission || '', data.fuel_type || '', data.seats || 5, data.luggage || 3, data.price_per_day || 0, data.price_per_week || 0, data.price_per_month || 0, data.image || '', JSON.stringify(data.features || []), JSON.stringify(data.features_ar || []), data.featured || 0]);
    logActivity(req.admin.id || 0, req.admin.email, 'Vehicle Created', `Vehicle: ${data.name}`);
    res.status(201).json({ id: result.lastInsertRowid, slug });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/vehicles/:id', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run(`UPDATE vehicles SET name=?, name_ar=?, brand=?, model=?, year=?, transmission=?, fuel_type=?, seats=?, luggage=?, price_per_day=?, price_per_week=?, price_per_month=?, image=?, features=?, features_ar=?, featured=?, status=?, updated_at=datetime('now') WHERE id=?`,
      [data.name, data.name_ar || '', data.brand || '', data.model || '', data.year || 2024, data.transmission || '', data.fuel_type || '', data.seats || 5, data.luggage || 3, data.price_per_day || 0, data.price_per_week || 0, data.price_per_month || 0, data.image || '', JSON.stringify(data.features || []), JSON.stringify(data.features_ar || []), data.featured || 0, data.status || 'active', req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/vehicles/:id', adminAuth, (req, res) => {
  try {
    run('DELETE FROM vehicle_images WHERE vehicle_id = ?', [req.params.id]);
    run('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Vehicle Images
app.post('/api/admin/vehicles/:id/images', adminAuth, (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) return res.status(400).json({ error: 'Images array required.' });
    for (const img of images) {
      run('INSERT INTO vehicle_images (vehicle_id, image, title, sort_order) VALUES (?, ?, ?, ?)',
        [req.params.id, img.image, img.title || '', img.sort_order || 0]);
    }
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Gallery CRUD
app.get('/api/admin/gallery', adminAuth, (req, res) => {
  try {
    const items = all('SELECT * FROM gallery ORDER BY id DESC');
    res.json({ gallery: items });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/gallery', adminAuth, (req, res) => {
  try {
    const data = req.body;
    const slug = data.slug || uuidv4();
    const result = run(`INSERT INTO gallery (slug, name, name_ar, cover_image, description, description_ar, historical_info, historical_info_ar, tourism_info, tourism_info_ar, activities, activities_ar, visiting_tips, visiting_tips_ar, nearby_attractions, nearby_attractions_ar, lat, lng, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, data.name, data.name_ar || '', data.cover_image || '', data.description || '', data.description_ar || '', data.historical_info || '', data.historical_info_ar || '', data.tourism_info || '', data.tourism_info_ar || '', JSON.stringify(data.activities || []), JSON.stringify(data.activities_ar || []), data.visiting_tips || '', data.visiting_tips_ar || '', data.nearby_attractions || '', data.nearby_attractions_ar || '', data.lat || 0, data.lng || 0, data.featured || 0]);
    logActivity(req.admin.id || 0, req.admin.email, 'Gallery Created', `Gallery: ${data.name}`);
    res.status(201).json({ id: result.lastInsertRowid, slug });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/gallery/:id', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run(`UPDATE gallery SET name=?, name_ar=?, cover_image=?, description=?, description_ar=?, historical_info=?, historical_info_ar=?, tourism_info=?, tourism_info_ar=?, activities=?, activities_ar=?, visiting_tips=?, visiting_tips_ar=?, nearby_attractions=?, nearby_attractions_ar=?, lat=?, lng=?, featured=?, status=?, updated_at=datetime('now') WHERE id=?`,
      [data.name, data.name_ar || '', data.cover_image || '', data.description || '', data.description_ar || '', data.historical_info || '', data.historical_info_ar || '', data.tourism_info || '', data.tourism_info_ar || '', JSON.stringify(data.activities || []), JSON.stringify(data.activities_ar || []), data.visiting_tips || '', data.visiting_tips_ar || '', data.nearby_attractions || '', data.nearby_attractions_ar || '', data.lat || 0, data.lng || 0, data.featured || 0, data.status || 'active', req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/gallery/:id', adminAuth, (req, res) => {
  try {
    run('DELETE FROM gallery_images WHERE gallery_id = ?', [req.params.id]);
    run('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Gallery Images
app.get('/api/admin/gallery/:id/images', adminAuth, (req, res) => {
  try {
    const images = all('SELECT * FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order', [req.params.id]);
    res.json({ images });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/gallery-images/:id', adminAuth, (req, res) => {
  try { run('DELETE FROM gallery_images WHERE id = ?', [req.params.id]); res.json({ ok: true }); } catch (err) { safeError(res, err); }
});

app.post('/api/admin/gallery/:id/images', adminAuth, (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) return res.status(400).json({ error: 'Images array required.' });
    for (const img of images) {
      run('INSERT INTO gallery_images (gallery_id, image, title, title_ar, description, description_ar, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, img.image, img.title || '', img.title_ar || '', img.description || '', img.description_ar || '', img.sort_order || 0]);
    }
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Reviews
app.get('/api/admin/reviews', adminAuth, (req, res) => {
  try {
    const reviews = all('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json({ reviews });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/reviews/:id', adminAuth, (req, res) => {
  try {
    const { status, text, text_ar, rating } = req.body;
    if (status) run('UPDATE reviews SET status = ? WHERE id = ?', [status, req.params.id]);
    if (text || text_ar || rating) {
      run('UPDATE reviews SET text = COALESCE(?, text), text_ar = COALESCE(?, text_ar), rating = COALESCE(?, rating) WHERE id = ?',
        [text || null, text_ar || null, rating || null, req.params.id]);
    }
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/reviews/:id', adminAuth, (req, res) => {
  try { run('DELETE FROM reviews WHERE id = ?', [req.params.id]); res.json({ ok: true }); } catch (err) { safeError(res, err); }
});

// Admin: Contacts
app.get('/api/admin/contacts', adminAuth, (req, res) => {
  try {
    let sql = 'SELECT * FROM contact_inquiries';
    const params = [];
    if (req.query.status) { sql += ' WHERE status = ?'; params.push(req.query.status); }
    sql += ' ORDER BY created_at DESC';
    const contacts = all(sql, params);
    res.json({ contacts });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/contacts/:id', adminAuth, (req, res) => {
  try {
    const { status } = req.body;
    run('UPDATE contact_inquiries SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/contacts/:id', adminAuth, (req, res) => {
  try { run('DELETE FROM contact_inquiries WHERE id = ?', [req.params.id]); res.json({ ok: true }); } catch (err) { safeError(res, err); }
});

// Admin: Offers
app.get('/api/admin/offers', adminAuth, (req, res) => {
  try {
    const offers = all('SELECT * FROM offers ORDER BY id DESC');
    offers.forEach(o => { try { o.sections = JSON.parse(o.sections || '[]'); } catch(e) { o.sections = []; } });
    res.json({ offers });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/offers', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run('INSERT INTO offers (title, title_ar, description, description_ar, discount_type, discount_value, item_type, item_id, start_date, end_date, image, sections) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.title, data.title_ar || '', data.description || '', data.description_ar || '', data.discount_type || 'percentage', data.discount_value || 0, data.item_type || '', data.item_id || 0, data.start_date || '', data.end_date || '', data.image || '', JSON.stringify(data.sections || ['hotels'])]);
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/offers/:id', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run('UPDATE offers SET title=?, title_ar=?, description=?, description_ar=?, discount_type=?, discount_value=?, item_type=?, item_id=?, start_date=?, end_date=?, image=?, status=?, sections=? WHERE id=?',
      [data.title, data.title_ar || '', data.description || '', data.description_ar || '', data.discount_type || 'percentage', data.discount_value || 0, data.item_type || '', data.item_id || 0, data.start_date || '', data.end_date || '', data.image || '', data.status || 'active', JSON.stringify(data.sections || ['hotels']), req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/offers/:id', adminAuth, (req, res) => {
  try { run('DELETE FROM offers WHERE id = ?', [req.params.id]); res.json({ ok: true }); } catch (err) { safeError(res, err); }
});

// Admin: Coupons
app.get('/api/admin/coupons', adminAuth, (req, res) => {
  try { const coupons = all('SELECT * FROM coupons ORDER BY id DESC'); res.json({ coupons }); } catch (err) { safeError(res, err); }
});

app.get('/api/admin/coupons-list', adminAuth, (req, res) => {
  const coupons = all("SELECT c.*, (SELECT COUNT(*) FROM bookings WHERE coupon_code = c.code) as used_count FROM coupons c ORDER BY c.id DESC");
  res.json({ coupons });
});

app.post('/api/admin/coupons', adminAuth, (req, res) => {
  try {
    const { id, code, name, name_ar, value, type, min_total, active, expires_at, usage_limit } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Code and name required' });
    if (id) {
      run("UPDATE coupons SET code=?, name=?, name_ar=?, value=?, type=?, min_total=?, active=?, expires_at=?, usage_limit=? WHERE id=?", 
        [code.toUpperCase(), name, name_ar||'', value, type||'percent', min_total||0, active!==undefined?(active?1:0):1, expires_at||'', usage_limit||0, id]);
    } else {
      run("INSERT INTO coupons (code, name, name_ar, value, type, min_total, active, expires_at, usage_limit) VALUES (?,?,?,?,?,?,?,?,?)",
        [code.toUpperCase(), name, name_ar||'', value, type||'percent', min_total||0, 1, expires_at||'', usage_limit||0]);
    }
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/coupons/:id', adminAuth, (req, res) => {
  run("DELETE FROM coupons WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

// Admin: Activity Logs
app.get('/api/admin/logs', adminAuth, (req, res) => {
  try {
    let sql = 'SELECT * FROM activity_logs';
    const params = [];
    if (req.query.limit) { sql += ' ORDER BY id DESC LIMIT ?'; params.push(parseInt(req.query.limit)); }
    else { sql += ' ORDER BY id DESC LIMIT 100'; }
    const logs = all(sql, params);
    res.json({ logs });
  } catch (err) { safeError(res, err); }
});

// Admin: Backups
app.post('/api/admin/backup', adminAuth, (req, res) => {
  try {
    const filePath = backup();
    logActivity(req.admin.id || 0, req.admin.email, 'Backup Created', `Backup: ${filePath}`);
    res.json({ path: filePath });
  } catch (err) { safeError(res, err); }
});

// Admin: Pages
app.get('/api/admin/pages', adminAuth, (req, res) => {
  try { const pages = all('SELECT * FROM pages ORDER BY id'); res.json({ pages }); } catch (err) { safeError(res, err); }
});

app.put('/api/admin/pages/:id', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run('UPDATE pages SET title=?, title_ar=?, content=?, content_ar=?, updated_at=datetime("now") WHERE id=?',
      [data.title, data.title_ar, data.content, data.content_ar, req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Homepage Sections
app.get('/api/admin/homepage', adminAuth, (req, res) => {
  try {
    const sections = all('SELECT * FROM homepage_sections');
    const data = {};
    sections.forEach(s => {
      try { data[s.section_key] = JSON.parse(s.content); } catch { data[s.section_key] = s.content; }
    });
    res.json(data);
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/homepage', adminAuth, (req, res) => {
  try {
    const { sections } = req.body;
    if (!sections || typeof sections !== 'object') return res.status(400).json({ error: 'Sections object required.' });
    for (const [key, content] of Object.entries(sections)) {
      const existing = get('SELECT id FROM homepage_sections WHERE section_key = ?', [key]);
      if (existing) run('UPDATE homepage_sections SET content = ?, updated_at = datetime("now") WHERE section_key = ?', [JSON.stringify(content), key]);
      else run('INSERT INTO homepage_sections (section_key, content) VALUES (?, ?)', [key, JSON.stringify(content)]);
    }
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Cities
app.get('/api/admin/cities', adminAuth, (req, res) => {
  try { const cities = all('SELECT * FROM cities ORDER BY name'); res.json({ cities }); } catch (err) { safeError(res, err); }
});

app.post('/api/admin/cities', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run('INSERT INTO cities (name, name_ar, country, image, description, description_ar, activities, activities_ar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.name_ar || '', data.country || 'Syria', data.image || '', data.description || '', data.description_ar || '', JSON.stringify(data.activities || []), JSON.stringify(data.activities_ar || [])]);
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/cities/:id', adminAuth, (req, res) => {
  try {
    const data = req.body;
    run('UPDATE cities SET name=?, name_ar=?, country=?, image=?, description=?, description_ar=?, activities=?, activities_ar=? WHERE id=?',
      [data.name, data.name_ar || '', data.country || 'Syria', data.image || '', data.description || '', data.description_ar || '', JSON.stringify(data.activities || []), JSON.stringify(data.activities_ar || []), req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/cities/:id', adminAuth, (req, res) => {
  try {
    run('DELETE FROM city_images WHERE city_id = ?', [req.params.id]);
    run('DELETE FROM cities WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: City Images
app.get('/api/admin/cities/:id/images', adminAuth, (req, res) => {
  try {
    const images = all('SELECT * FROM city_images WHERE city_id = ? ORDER BY sort_order', [req.params.id]);
    res.json({ images });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/cities/:id/images', adminAuth, (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) return res.status(400).json({ error: 'Images array required.' });
    for (const img of images) {
      run('INSERT INTO city_images (city_id, image, title, title_ar, sort_order) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, img.image, img.title || '', img.title_ar || '', img.sort_order || 0]);
    }
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/city-images/:id', adminAuth, (req, res) => {
  try { run('DELETE FROM city_images WHERE id = ?', [req.params.id]); res.json({ ok: true }); } catch (err) { safeError(res, err); }
});

// Sitemap
app.get('/sitemap.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const pages = ['', 'hotels', 'trips', 'cars', 'gallery', 'destinations', 'bookings', 'contact', 'about', 'privacy', 'terms', 'cancellation', 'refund'];
  const hotels = all('SELECT slug FROM hotels WHERE status = ?', ['active']).map(h => `\n  <url><loc>${base}/#hotel/${h.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('');
  const tours = all('SELECT slug FROM tours WHERE status = ?', ['active']).map(t => `\n  <url><loc>${base}/#tour/${t.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('');
  const rooms = all('SELECT r.slug, h.slug as hslug FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE r.status = ?', ['active']).map(r => `\n  <url><loc>${base}/#room/${r.hslug}/${r.slug}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`).join('');
  res.header('Content-Type', 'application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `\n  <url><loc>${base}/${p ? '#' + p : ''}</loc><changefreq>${p ? 'weekly' : 'daily'}</changefreq><priority>${p ? '0.7' : '1.0'}</priority></url>`).join('')}${hotels}${tours}${rooms}\n</urlset>`);
});

// Admin: Notifications
app.get('/api/admin/notifications', adminAuth, (req, res) => {
  try {
    const since = parseInt(req.query.since) || 0;
    const notifs = getMissedNotifications(req.admin.id || 0, since);
    const unread = countUnreadNotifications(req.admin.id || 0);
    res.json({ notifications: notifs, unread_count: unread });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/notifications/read', adminAuth, (req, res) => {
  try {
    const { id } = req.body;
    if (id) markNotificationRead(id);
    else markAllNotificationsRead(req.admin.id || 0);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== RBAC MIDDLEWARE ====================
function requirePermission(...perms) {
  return (req, res, next) => {
    if (req.admin.role === 'super_admin') return next();
    const user = get("SELECT * FROM users WHERE id = ?", [req.admin.id]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (req.admin.role === 'admin') return next();
    const role = get("SELECT permissions FROM roles WHERE name = ?", [req.admin.role]);
    if (!role) return res.status(403).json({ error: 'Role not found' });
    let rolePerms = [];
    try { rolePerms = JSON.parse(role.permissions); } catch {}
    const hasAll = perms.every(p => rolePerms.includes(p) || rolePerms.includes('*'));
    if (!hasAll) return res.status(403).json({ error: 'Insufficient permissions.' });
    next();
  };
}

// ==================== ADMIN: ROLES ====================
app.get('/api/admin/roles', superAdminAuth, (req, res) => {
  try { res.json({ roles: all('SELECT * FROM roles ORDER BY id') }); } catch (err) { safeError(res, err); }
});

app.post('/api/admin/roles', superAdminAuth, (req, res) => {
  try {
    const { name, name_ar, description, permissions } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const existing = get("SELECT id FROM roles WHERE name = ?", [name]);
    if (existing) return res.status(409).json({ error: 'Role already exists' });
    run("INSERT INTO roles (name, name_ar, description, permissions) VALUES (?, ?, ?, ?)", [name, name_ar || '', description || '', JSON.stringify(permissions || [])]);
    notifyAdmins('system', `Role Created: ${name}`, `New role added`, { role: name });
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/roles/:id', superAdminAuth, (req, res) => {
  try {
    const { name, name_ar, description, permissions } = req.body;
    const role = get("SELECT * FROM roles WHERE id = ?", [req.params.id]);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    if (role.is_system) return res.status(400).json({ error: 'Cannot edit system role' });
    run("UPDATE roles SET name=?, name_ar=?, description=?, permissions=? WHERE id=?",
      [name || role.name, name_ar !== undefined ? name_ar : role.name_ar, description !== undefined ? description : role.description, permissions ? JSON.stringify(permissions) : role.permissions, req.params.id]);
    logActivity(req.admin.id, req.admin.email, 'Role Updated', `Role ID: ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/roles/:id', superAdminAuth, (req, res) => {
  try {
    const role = get("SELECT * FROM roles WHERE id = ?", [req.params.id]);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    if (role.is_system) return res.status(400).json({ error: 'Cannot delete system role' });
    run("DELETE FROM employees WHERE role_id = ?", [req.params.id]);
    run("DELETE FROM roles WHERE id = ?", [req.params.id]);
    logActivity(req.admin.id, req.admin.email, 'Role Deleted', `Role ID: ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: EMPLOYEES ====================
app.get('/api/admin/employees', superAdminAuth, (req, res) => {
  try {
    const emps = all(`SELECT e.*, u.name as user_name, u.email, u.phone, r.name as role_name, r.name_ar as role_name_ar
      FROM employees e LEFT JOIN users u ON e.user_id = u.id LEFT JOIN roles r ON e.role_id = r.id ORDER BY e.id`);
    res.json({ employees: emps });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/employees', superAdminAuth, (req, res) => {
  try {
    const { user_id, role_id, employee_id, department, position, salary, hire_date } = req.body;
    if (!user_id || !role_id) return res.status(400).json({ error: 'User ID and Role ID required' });
    run("INSERT INTO employees (user_id, role_id, employee_id, department, position, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [user_id, role_id, employee_id || '', department || '', position || '', salary || 0, hire_date || '']);
    run("UPDATE users SET role = (SELECT name FROM roles WHERE id = ?) WHERE id = ?", [role_id, user_id]);
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/employees/:id', superAdminAuth, (req, res) => {
  try {
    const { role_id, department, position, salary, status } = req.body;
    const emp = get("SELECT * FROM employees WHERE id = ?", [req.params.id]);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    run("UPDATE employees SET role_id=?, department=?, position=?, salary=?, status=? WHERE id=?",
      [role_id || emp.role_id, department || emp.department, position || emp.position, salary || emp.salary, status || emp.status, req.params.id]);
    if (role_id) run("UPDATE users SET role = (SELECT name FROM roles WHERE id = ?) WHERE id = ?", [role_id, emp.user_id]);
    logActivity(req.admin.id, req.admin.email, 'Employee Updated', `Employee ID: ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/employees/:id', superAdminAuth, (req, res) => {
  try {
    const emp = get("SELECT * FROM employees WHERE id = ?", [req.params.id]);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    run("UPDATE users SET role='customer' WHERE id = ?", [emp.user_id]);
    run("DELETE FROM employees WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: CURRENCIES ====================
app.get('/api/public/currencies', (req, res) => {
  try { res.json({ currencies: all("SELECT * FROM currencies WHERE status='active' ORDER BY is_default DESC") }); } catch (err) { safeError(res, err); }
});

app.get('/api/admin/currencies', superAdminAuth, (req, res) => {
  try { res.json({ currencies: all('SELECT * FROM currencies ORDER BY is_default DESC, id') }); } catch (err) { safeError(res, err); }
});

app.post('/api/admin/currencies', superAdminAuth, (req, res) => {
  try {
    const { code, name, name_ar, symbol, exchange_rate, is_default } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });
    if (is_default) run("UPDATE currencies SET is_default = 0 WHERE is_default = 1");
    run("INSERT INTO currencies (code, name, name_ar, symbol, exchange_rate, is_default) VALUES (?, ?, ?, ?, ?, ?)",
      [code.toUpperCase(), name || '', name_ar || '', symbol || '', exchange_rate || 1, is_default ? 1 : 0]);
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/currencies/:id', superAdminAuth, (req, res) => {
  try {
    const { code, name, name_ar, symbol, exchange_rate, is_default, status } = req.body;
    const cur = get("SELECT * FROM currencies WHERE id = ?", [req.params.id]);
    if (!cur) return res.status(404).json({ error: 'Currency not found' });
    if (is_default) run("UPDATE currencies SET is_default = 0 WHERE is_default = 1");
    run("UPDATE currencies SET code=?, name=?, name_ar=?, symbol=?, exchange_rate=?, is_default=?, status=? WHERE id=?",
      [code || cur.code, name || cur.name, name_ar !== undefined ? name_ar : cur.name_ar, symbol || cur.symbol, exchange_rate || cur.exchange_rate, is_default ? 1 : 0, status || cur.status, req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/currencies/:id', superAdminAuth, (req, res) => {
  try {
    const cur = get("SELECT * FROM currencies WHERE id = ?", [req.params.id]);
    if (!cur) return res.status(404).json({ error: 'Currency not found' });
    if (cur.is_default) return res.status(400).json({ error: 'Cannot delete default currency' });
    if (cur.code === 'USD') return res.status(400).json({ error: 'Cannot delete USD' });
    run("DELETE FROM currencies WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: PAYMENTS ====================
app.get('/api/admin/payments', adminAuth, (req, res) => {
  try {
    const { status, booking_id, payment_method, currency, date_from, date_to } = req.query;
    let sql = "SELECT p.*, b.booking_ref, b.customer_name, b.total as booking_total FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id";
    const params = [];
    const wheres = [];
    if (status) { wheres.push("p.status = ?"); params.push(status); }
    if (booking_id) { wheres.push("p.booking_id = ?"); params.push(booking_id); }
    if (payment_method) { wheres.push("p.payment_method = ?"); params.push(payment_method); }
    if (currency) { wheres.push("p.currency = ?"); params.push(currency); }
    if (date_from) { wheres.push("p.created_at >= ?"); params.push(date_from); }
    if (date_to) { wheres.push("p.created_at <= ?"); params.push(date_to + ' 23:59:59'); }
    // Permission filtering for employees/accountants
    if (!['super_admin', 'admin', 'accountant'].includes(req.admin.role)) {
      wheres.push("1=1"); // limited view
    }
    if (wheres.length) sql += " WHERE " + wheres.join(" AND ");
    sql += " ORDER BY p.id DESC";
    const payments = all(sql, params);
    // Strip gateway details for non-super-admin/non-accountant
    const result = payments.map(p => {
      if (!['super_admin', 'admin', 'accountant'].includes(req.admin.role)) p.gateway_response = undefined;
      return p;
    });
    res.json({ payments: result });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/payments/:id', adminAuth, (req, res) => {
  try {
    const p = get("SELECT p.*, b.booking_ref, b.customer_name, b.customer_phone, b.customer_email, b.total as booking_total FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id WHERE p.id = ?", [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    // Strip gateway details for non-super-admin
    if (req.admin.role !== 'super_admin') p.gateway_response = undefined;
    res.json({ payment: p });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/payments', adminAuth, (req, res) => {
  try {
    const { booking_id, amount, currency, payment_method } = req.body;
    if (!booking_id || !amount) return res.status(400).json({ error: 'Booking ID and amount required' });
    const booking = get("SELECT * FROM bookings WHERE id = ?", [booking_id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Simulate payment processing
    const transaction_id = 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const gateway_sim = { id: transaction_id, status: 'completed', card_last4: '4242', processor: 'stripe_sim', timestamp: new Date().toISOString() };

    run("INSERT INTO payments (booking_id, user_id, amount, currency, payment_method, transaction_id, gateway_response, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')",
      [booking_id, booking.user_id || 0, amount, currency || 'USD', payment_method || 'bank_transfer', transaction_id, JSON.stringify(gateway_sim)]);

    // Auto-generate invoice
    const invoiceNum = 'INV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    run("INSERT INTO invoices (booking_id, invoice_number, customer_name, customer_phone, items, subtotal, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'paid')",
      [booking_id, invoiceNum, booking.customer_name, booking.customer_phone, JSON.stringify([{ type: booking.booking_type, name: booking.item_name, amount: amount }]), amount, amount]);

    // Auto-confirm booking on payment
    run("UPDATE bookings SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?", [booking_id]);

    notifyAdmins('system', `💰 Payment Received: ${amount} ${currency || 'USD'}`, `Booking #${booking.booking_ref} - ${payment_method || 'Bank Transfer'}`, { booking_id, amount, currency, transaction_id });
    logActivity(req.admin.id, req.admin.email, 'Payment Created', `Booking: ${booking.booking_ref}, Amount: ${amount} ${currency}`);
    res.status(201).json({ payment: { transaction_id, invoice_number: invoiceNum } });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/payments/:id/refund', adminAuth, (req, res) => {
  try {
    if (!['super_admin', 'admin'].includes(req.admin.role)) {
      const role = get("SELECT permissions FROM roles WHERE name = ?", [req.admin.role]);
      const perms = role ? JSON.parse(role.permissions || '[]') : [];
      if (!perms.includes('refunds:manage') && !perms.includes('*')) return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    const p = get("SELECT * FROM payments WHERE id = ?", [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    if (p.status !== 'completed') return res.status(400).json({ error: 'Only completed payments can be refunded' });
    const { amount, reason } = req.body;
    const refundAmount = amount || p.amount;
    run("INSERT INTO refunds (payment_id, booking_id, amount, reason, status, processed_by) VALUES (?, ?, ?, ?, 'pending', ?)", [p.id, p.booking_id, refundAmount, reason || '', req.admin.id]);
    run("UPDATE payments SET status = 'refunded' WHERE id = ?", [p.id]);
    run("UPDATE bookings SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", [p.booking_id]);
    notifyAdmins('system', `🔄 Refund Processed: ${refundAmount} ${p.currency}`, `Booking #${p.booking_id} - ${reason || 'No reason'}`, { payment_id: p.id, refund_amount: refundAmount });
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== PAYMENT ORCHESTRATION LAYER ====================

// Helper: get country from IP (simple mapping)
function detectCountryFromIP(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return 'SY';
  return 'US';
}

// Helper: calculate risk score for fraud detection
function calculateRiskScore(booking, ip) {
  let score = 0;
  const flags = [];
  const userId = booking?.user_id || 0;
  const user = userId ? get("SELECT * FROM users WHERE id = ?", [userId]) : null;

  // Velocity check: too many bookings from same IP in last hour
  const recentBookings = get("SELECT COUNT(*) as cnt FROM bookings WHERE user_id = ? AND created_at >= datetime('now', '-1 hour')", [userId]);
  if (recentBookings?.cnt > 3) { score += 20; flags.push('velocity_high'); }
  if (recentBookings?.cnt > 5) { score += 20; flags.push('velocity_critical'); }

  // Duplicate booking check
  const dupe = get("SELECT COUNT(*) as cnt FROM bookings WHERE user_id = ? AND item_id = ? AND booking_type = ? AND status IN ('new','pending') AND id != ?",
    [userId, booking?.item_id || 0, booking?.booking_type || '', booking?.id || 0]);
  if (dupe?.cnt > 0) { score += 15; flags.push('duplicate_booking'); }

  // Suspicious amount
  const amount = booking?.total || 0;
  if (amount > 10000) { score += 10; flags.push('high_amount'); }
  if (amount > 50000) { score += 15; flags.push('very_high_amount'); }

  // New user with high value booking
  if (user) {
    const userAge = get("SELECT julianday('now') - julianday(created_at) as days FROM users WHERE id = ?", [userId]);
    const totalSpent = get("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE user_id = ? AND status='completed'", [userId]);
    if (userAge && userAge.days < 1 && amount > 1000) { score += 15; flags.push('new_user_high_value'); }
    if (totalSpent.total === 0 && amount > 2000) { score += 10; flags.push('first_booking_high_value'); }
  }

  // Failed payment pattern
  const failedPayments = get("SELECT COUNT(*) as cnt FROM payments WHERE user_id = ? AND status='failed' AND created_at >= datetime('now', '-24 hours')", [userId]);
  if (failedPayments?.cnt > 2) { score += 25; flags.push('failed_payment_pattern'); }

  // Blacklist check
  if (user) {
    const blEmail = get("SELECT id FROM blacklist WHERE type='email' AND value = ?", [user.email]);
    if (blEmail) { score += 50; flags.push('blacklisted_email'); }
    const blIP = get("SELECT id FROM blacklist WHERE type='ip' AND value = ?", [ip]);
    if (blIP) { score += 50; flags.push('blacklisted_ip'); }
  }

  const level = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';
  return { score: Math.min(score, 100), level, flags };
}

// Log to audit_logs
function auditLog(userId, userEmail, userRole, action, resource = '', resourceId = 0, details = {}, ip = '') {
  try {
    run("INSERT INTO audit_logs (user_id, user_email, user_role, action, resource, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId || 0, userEmail || '', userRole || '', action, resource, resourceId, JSON.stringify(details), ip]);
  } catch (e) {}
}

// Smart gateway routing
function selectGateway(amount, currency, country, paymentMethod) {
  const gateways = all("SELECT * FROM payment_gateways WHERE is_active = 1 ORDER BY priority ASC");
  if (!gateways.length) return { gateway: null, reason: 'No gateways available' };

  // Try matching by currency + country first
  for (const g of gateways) {
    const currencies = JSON.parse(g.supported_currencies || '[]');
    const countries = JSON.parse(g.supported_countries || '[]');
    if (currencies.includes(currency) && (countries.length === 0 || countries.includes(country))) {
      if (g.health_status === 'healthy' || g.health_status === 'unknown') {
        return { gateway: g, reason: 'matched_currency_country' };
      }
    }
  }

  // Fallback: try any active gateway that supports the currency
  for (const g of gateways) {
    const currencies = JSON.parse(g.supported_currencies || '[]');
    if (currencies.includes(currency) && g.is_fallback) {
      return { gateway: g, reason: 'fallback' };
    }
  }

  return { gateway: gateways[0], reason: 'first_available' };
}

// Simulate payment processing through a gateway
function simulatePaymentProcessing(gateway, amount, currency, paymentMethod) {
  const successRate = gateway?.success_rate || 95;
  const isSuccess = Math.random() * 100 < successRate;
  const txnId = gateway?.code?.toUpperCase() + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  return {
    success: isSuccess,
    transaction_id: txnId,
    provider_ref: txnId,
    status: isSuccess ? 'completed' : 'failed',
    error: isSuccess ? null : 'Card declined. Please try another payment method.',
    processor_response: { id: txnId, status: isSuccess ? 'succeeded' : 'declined', amount, currency, processed_at: new Date().toISOString() }
  };
}

// ==================== PAYMENT API ENDPOINTS ====================

// Public: Get available payment methods
app.get('/api/payment-methods', (req, res) => {
  try {
    const country = req.query.country || 'SY';
    const currency = req.query.currency || 'USD';
    const amount = parseFloat(req.query.amount) || 0;
    const methods = all("SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY sort_order ASC");
    const result = methods.filter(m => {
      const regions = JSON.parse(m.regions || '["all"]');
      const currencies = JSON.parse(m.supported_currencies || '["USD"]');
      if (regions.includes('all')) return currencies.includes(currency);
      if (regions.includes('syria') && country === 'SY') return currencies.includes(currency);
      if (regions.includes('qatar') && country === 'QA') return currencies.includes(currency);
      if (regions.includes('international') && country !== 'SY') return currencies.includes(currency);
      return false;
    }).filter(m => amount >= m.min_amount && amount <= m.max_amount);
    res.json({ methods: result, country, currency });
  } catch (err) { safeError(res, err); }
});

// Public: Get available gateways
app.get('/api/payment-gateways', (req, res) => {
  try {
    const country = req.query.country || 'SY';
    const currency = req.query.currency || 'USD';
    const gateways = all("SELECT * FROM payment_gateways WHERE is_active = 1 ORDER BY priority ASC");
    const result = gateways.filter(g => {
      const currencies = JSON.parse(g.supported_currencies || '[]');
      const countries = JSON.parse(g.supported_countries || '[]');
      return currencies.includes(currency) && (countries.length === 0 || countries.includes(country));
    }).map(g => ({ id: g.id, code: g.code, name: g.name, name_ar: g.name_ar, provider: g.provider }));
    res.json({ gateways: result, country, currency });
  } catch (err) { safeError(res, err); }
});

// Create payment intent (initiate payment)
app.post('/api/payments/intent', auth, (req, res) => {
  try {
    const { booking_id, payment_method, payment_mode, amount, currency, billing_details } = req.body;
    if (!booking_id || !payment_method) return res.status(400).json({ error: 'Booking ID and payment method required' });

    const booking = get("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [booking_id, req.user.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const payAmount = amount || booking.total;
    const payCurrency = currency || 'USD';
    const country = req.headers['x-country-code'] || detectCountryFromIP(req.ip) || 'SY';
    const intentId = 'PI-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Smart routing
    const method = get("SELECT * FROM payment_methods WHERE code = ? AND is_active = 1", [payment_method]);
    if (!method) return res.status(400).json({ error: 'Payment method not available' });

    const routing = selectGateway(payAmount, payCurrency, country, payment_method);
    if (!routing.gateway) return res.status(503).json({ error: 'No payment gateway available', fallback_methods: getFallbackMethods(country, payCurrency) });

    // Fraud check
    const fraud = calculateRiskScore(booking, req.ip);
    if (fraud.score >= 70) {
      run("INSERT INTO risk_logs (booking_id, user_id, action, reason, ip_address, risk_score) VALUES (?, ?, 'blocked', ?, ?, ?)",
        [booking_id, req.user.id, 'High risk score: ' + fraud.flags.join(', '), req.ip || '', fraud.score]);
      auditLog(req.user.id, req.user.email, req.user.role, 'payment_blocked_fraud', 'booking', booking_id, { risk_score: fraud.score, flags: fraud.flags, ip: req.ip });
      return res.status(403).json({ error: 'Payment blocked by fraud prevention. Please contact support.', risk_level: fraud.level });
    }

    // Save fraud score
    run("INSERT INTO fraud_scores (booking_id, user_id, ip_address, risk_score, risk_level, flags) VALUES (?, ?, ?, ?, ?, ?)",
      [booking_id, req.user.id, req.ip || '', fraud.score, fraud.level, JSON.stringify(fraud.flags)]);

    // Store intent
    const clientSecret = 'cs_' + crypto.randomBytes(24).toString('hex');
    run("INSERT INTO payment_intents (booking_id, user_id, intent_id, amount, currency, payment_method, provider_code, status, client_secret, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)",
      [booking_id, req.user.id, intentId, payAmount, payCurrency, payment_method, routing.gateway.code, clientSecret, JSON.stringify({ country, risk_score: fraud.score, risk_level: fraud.level, billing_details: billing_details || {} })]);

    auditLog(req.user.id, req.user.email, req.user.role, 'payment_intent_created', 'booking', booking_id, { intent_id: intentId, amount: payAmount, currency: payCurrency, method: payment_method, gateway: routing.gateway.code, risk_score: fraud.score });

    // For manual methods, create payment directly
    if (method.needs_manual_approval) {
      const txnId = 'MAN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      run("INSERT INTO payments (booking_id, user_id, amount, currency, payment_method, transaction_id, provider_code, gateway_id, risk_score, billing_details, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
        [booking_id, req.user.id, payAmount, payCurrency, payment_method, txnId, routing.gateway.code, routing.gateway.id, fraud.score, JSON.stringify(billing_details || {})]);
      run("UPDATE bookings SET payment_status = 'pending', payment_method = ?, status = 'pending' WHERE id = ?", [payment_method, booking_id]);
      run("UPDATE payment_intents SET status = 'requires_approval' WHERE intent_id = ?", [intentId]);
      notifyAdmins('payment', `📋 Manual Payment Request: ${payAmount} ${payCurrency}`, `Booking #${booking.booking_ref} - ${payment_method}`, { booking_id, amount: payAmount, currency: payCurrency, method: payment_method });
      auditLog(req.user.id, req.user.email, req.user.role, 'payment_manual_requested', 'booking', booking_id, { intent_id: intentId, amount: payAmount, method: payment_method });
      broadcastToAdmins('stats:update', { _ts: Date.now() });
      return res.json({ intent_id: intentId, status: 'requires_approval', client_secret: null, manual: true, message: 'Payment requires admin approval.' });
    }

    // For instant methods, simulate gateway processing
    const gatewayResult = simulatePaymentProcessing(routing.gateway, payAmount, payCurrency, payment_method);
    const paymentStatus = gatewayResult.success ? 'completed' : 'failed';
    const txnId = gatewayResult.transaction_id;

    run("INSERT INTO payments (booking_id, user_id, amount, currency, payment_method, transaction_id, provider_code, gateway_id, risk_score, payment_intent_id, threeds_status, billing_details, gateway_response, status, fee_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [booking_id, req.user.id, payAmount, payCurrency, payment_method, txnId, routing.gateway.code, routing.gateway.id, fraud.score, intentId, 'verified', JSON.stringify(billing_details || {}), JSON.stringify(gatewayResult.processor_response), paymentStatus, payAmount * 0.029]);

    const bookingStatus = paymentStatus === 'completed' ? 'confirmed' : 'payment_failed';
    run("UPDATE bookings SET payment_status = ?, payment_method = ?, status = ?, updated_at = datetime('now') WHERE id = ?", [paymentStatus, payment_method, bookingStatus, booking_id]);
    run("UPDATE payment_intents SET status = ? WHERE intent_id = ?", [paymentStatus === 'completed' ? 'succeeded' : 'failed', intentId]);

    if (paymentStatus === 'completed') {
      // Auto-generate invoice
      const invNum = 'INV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      run("INSERT INTO invoices (booking_id, invoice_number, customer_name, customer_phone, customer_email, items, subtotal, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid')",
        [booking_id, invNum, booking.customer_name, booking.customer_phone, booking.customer_email || '', JSON.stringify([{ type: booking.booking_type, name: booking.item_name, amount: payAmount, currency: payCurrency }]), payAmount, payAmount]);

      notifyAdmins('payment', `✅ Payment Received: ${payAmount} ${payCurrency}`, `Booking #${booking.booking_ref} via ${payment_method}`, { booking_id, amount: payAmount, currency: payCurrency, transaction_id: txnId, method: payment_method });
      broadcastToAdmins('stats:update', { _ts: Date.now() });
      auditLog(req.user.id, req.user.email, req.user.role, 'payment_success', 'booking', booking_id, { intent_id: intentId, amount: payAmount, currency: payCurrency, method: payment_method, transaction_id: txnId });
    } else {
      notifyAdmins('payment', `❌ Payment Failed: ${payAmount} ${payCurrency}`, `Booking #${booking.booking_ref} - ${gatewayResult.error || 'Unknown error'}`, { booking_id, amount: payAmount, currency: payCurrency, method: payment_method });
      auditLog(req.user.id, req.user.email, req.user.role, 'payment_failed', 'booking', booking_id, { intent_id: intentId, amount: payAmount, currency: payCurrency, method: payment_method, error: gatewayResult.error });
    }

    res.json({
      intent_id: intentId,
      status: paymentStatus === 'completed' ? 'succeeded' : 'failed',
      transaction_id: txnId,
      client_secret: paymentStatus === 'completed' ? clientSecret : null,
      error: gatewayResult.error,
      booking_status: bookingStatus
    });
  } catch (err) { safeError(res, err); }
});

// Get payment methods available as fallback
function getFallbackMethods(country, currency) {
  const methods = all("SELECT * FROM payment_methods WHERE is_active = 1 AND needs_manual_approval = 1 ORDER BY sort_order ASC");
  return methods.filter(m => {
    const regions = JSON.parse(m.regions || '["all"]');
    const currencies = JSON.parse(m.supported_currencies || '["USD"]');
    if (!currencies.includes(currency)) return false;
    if (regions.includes('all')) return true;
    if (regions.includes('syria') && country === 'SY') return true;
    if (regions.includes('international') && country !== 'SY') return true;
    return false;
  }).map(m => ({ code: m.code, name: m.name, name_ar: m.name_ar, icon: m.icon }));
}

// Get payment intent status
app.get('/api/payments/intent/:id', auth, (req, res) => {
  try {
    const intent = get("SELECT * FROM payment_intents WHERE intent_id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (!intent) return res.status(404).json({ error: 'Intent not found' });
    const payment = get("SELECT * FROM payments WHERE payment_intent_id = ?", [req.params.id]);
    res.json({ intent: { ...intent, metadata: JSON.parse(intent.metadata || '{}') }, payment });
  } catch (err) { safeError(res, err); }
});

// Payment history for user
app.get('/api/payments/history', auth, (req, res) => {
  try {
    const payments = all("SELECT p.*, b.booking_ref, b.customer_name, b.booking_type, b.item_name FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id WHERE p.user_id = ? ORDER BY p.id DESC", [req.user.id]);
    res.json({ payments });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: PAYMENT METHOD CONFIG ====================
app.get('/api/admin/payment-methods', adminAuth, (req, res) => {
  try {
    const methods = all("SELECT * FROM payment_methods ORDER BY sort_order ASC");
    res.json({ methods });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/payment-methods/:id', superAdminAuth, (req, res) => {
  try {
    const { is_active, processing_fee, fee_type, min_amount, max_amount, regions, supported_currencies } = req.body;
    run("UPDATE payment_methods SET is_active=?, processing_fee=?, fee_type=?, min_amount=?, max_amount=?, regions=?, supported_currencies=? WHERE id=?",
      [is_active !== undefined ? (is_active ? 1 : 0) : undefined,
       processing_fee, fee_type, min_amount, max_amount,
       regions ? JSON.stringify(regions) : undefined,
       supported_currencies ? JSON.stringify(supported_currencies) : undefined,
       req.params.id].filter(v => v !== undefined));
    auditLog(req.admin.id, req.admin.email, req.admin.role, 'payment_method_updated', 'payment_method', parseInt(req.params.id), req.body, req.ip);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: GATEWAY CONFIG ====================
app.get('/api/admin/gateways', superAdminAuth, (req, res) => {
  try {
    const gateways = all("SELECT * FROM payment_gateways ORDER BY priority ASC");
    res.json({ gateways: gateways.map(g => ({ ...g, config: JSON.parse(g.config || '{}'), supported_currencies: JSON.parse(g.supported_currencies || '[]'), supported_countries: JSON.parse(g.supported_countries || '[]') })) });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/gateways/:id', superAdminAuth, (req, res) => {
  try {
    const { is_active, is_fallback, config, supported_currencies, supported_countries, priority, success_rate } = req.body;
    run("UPDATE payment_gateways SET is_active=?, is_fallback=?, config=?, supported_currencies=?, supported_countries=?, priority=?, success_rate=? WHERE id=?",
      [is_active !== undefined ? (is_active ? 1 : 0) : undefined,
       is_fallback !== undefined ? (is_fallback ? 1 : 0) : undefined,
       config ? JSON.stringify(config) : undefined,
       supported_currencies ? JSON.stringify(supported_currencies) : undefined,
       supported_countries ? JSON.stringify(supported_countries) : undefined,
       priority, success_rate, req.params.id].filter(v => v !== undefined));
    auditLog(req.admin.id, req.admin.email, req.admin.role, 'gateway_updated', 'gateway', parseInt(req.params.id), req.body, req.ip);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Gateway health check
app.post('/api/admin/gateways/:id/health-check', superAdminAuth, (req, res) => {
  try {
    const g = get("SELECT * FROM payment_gateways WHERE id = ?", [req.params.id]);
    if (!g) return res.status(404).json({ error: 'Gateway not found' });
    const start = Date.now();
    const isHealthy = g.provider === 'manual' || Math.random() * 100 < 90;
    const responseTime = Date.now() - start;
    const status = isHealthy ? 'healthy' : 'degraded';
    run("INSERT INTO gateway_health (gateway_id, status, response_time, error_message) VALUES (?, ?, ?, ?)", [req.params.id, status, responseTime, isHealthy ? '' : 'Simulated health check failure']);
    run("UPDATE payment_gateways SET health_status=?, last_health_check=datetime('now'), avg_response_time=? WHERE id=?", [status, responseTime, req.params.id]);
    res.json({ status, response_time: responseTime, checked_at: new Date().toISOString() });
  } catch (err) { safeError(res, err); }
});

// Gateway health history
app.get('/api/admin/gateways/:id/health', superAdminAuth, (req, res) => {
  try {
    const checks = all("SELECT * FROM gateway_health WHERE gateway_id = ? ORDER BY id DESC LIMIT 50", [req.params.id]);
    res.json({ checks });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: FRAUD MANAGEMENT ====================
app.get('/api/admin/fraud/scores', adminAuth, (req, res) => {
  try {
    const scores = all("SELECT fs.*, b.booking_ref, b.customer_name, b.total FROM fraud_scores fs LEFT JOIN bookings b ON fs.booking_id = b.id ORDER BY fs.id DESC LIMIT 100");
    res.json({ scores });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/fraud/blacklist', superAdminAuth, (req, res) => {
  try {
    const list = all("SELECT * FROM blacklist ORDER BY id DESC");
    res.json({ blacklist: list });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/fraud/blacklist', superAdminAuth, (req, res) => {
  try {
    const { type, value, reason } = req.body;
    if (!type || !value) return res.status(400).json({ error: 'Type and value required' });
    const existing = get("SELECT id FROM blacklist WHERE type = ? AND value = ?", [type, value]);
    if (existing) return res.status(409).json({ error: 'Already blacklisted' });
    run("INSERT INTO blacklist (type, value, reason, created_by) VALUES (?, ?, ?, ?)", [type, value, reason || '', req.admin.id]);
    auditLog(req.admin.id, req.admin.email, req.admin.role, 'blacklist_added', 'blacklist', 0, { type, value, reason }, req.ip);
    res.status(201).json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/fraud/blacklist/:id', superAdminAuth, (req, res) => {
  try {
    const item = get("SELECT * FROM blacklist WHERE id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Not found' });
    run("DELETE FROM blacklist WHERE id = ?", [req.params.id]);
    auditLog(req.admin.id, req.admin.email, req.admin.role, 'blacklist_removed', 'blacklist', parseInt(req.params.id), { type: item.type, value: item.value }, req.ip);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Risk logs
app.get('/api/admin/fraud/logs', adminAuth, (req, res) => {
  try {
    const logs = all("SELECT rl.*, b.booking_ref, b.customer_name FROM risk_logs rl LEFT JOIN bookings b ON rl.booking_id = b.id ORDER BY rl.id DESC LIMIT 100");
    res.json({ logs });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: AUDIT LOGS ====================
app.get('/api/admin/audit-logs', superAdminAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = all("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?", [limit]);
    res.json({ logs });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: MANUAL PAYMENT APPROVAL ====================
app.get('/api/admin/payments/manual', adminAuth, (req, res) => {
  try {
    const payments = all("SELECT p.*, b.booking_ref, b.customer_name, b.customer_phone, b.total as booking_total FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id WHERE p.status = 'pending' ORDER BY p.id DESC");
    res.json({ payments });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/payments/:id/approve', adminAuth, (req, res) => {
  try {
    const p = get("SELECT * FROM payments WHERE id = ?", [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    if (p.status !== 'pending') return res.status(400).json({ error: 'Payment is not pending' });

    run("UPDATE payments SET status = 'completed', updated_at = datetime('now') WHERE id = ?", [req.params.id]);
    run("UPDATE bookings SET payment_status = 'completed', status = 'confirmed', updated_at = datetime('now') WHERE id = ?", [p.booking_id]);

    // Auto-generate invoice
    const invNum = 'INV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const booking = get("SELECT * FROM bookings WHERE id = ?", [p.booking_id]);
    run("INSERT INTO invoices (booking_id, invoice_number, customer_name, customer_phone, customer_email, items, subtotal, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid')",
      [p.booking_id, invNum, booking?.customer_name || '', booking?.customer_phone || '', booking?.customer_email || '', JSON.stringify([{ type: booking?.booking_type || 'booking', name: booking?.item_name || '', amount: p.amount, currency: p.currency }]), p.amount, p.amount]);

    notifyAdmins('payment', `✅ Manual Payment Approved: ${p.amount} ${p.currency}`, `Booking #${booking?.booking_ref || p.booking_id}`, { payment_id: p.id, booking_id: p.booking_id, amount: p.amount });
    auditLog(req.admin.id, req.admin.email, req.admin.role, 'payment_approved_manual', 'payment', p.id, { booking_id: p.booking_id, amount: p.amount }, req.ip);
    broadcastToAdmins('stats:update', { _ts: Date.now() });
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.put('/api/admin/payments/:id/reject', adminAuth, (req, res) => {
  try {
    const p = get("SELECT * FROM payments WHERE id = ?", [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    if (p.status !== 'pending') return res.status(400).json({ error: 'Payment is not pending' });
    const { reason } = req.body;
    run("UPDATE payments SET status = 'rejected', updated_at = datetime('now') WHERE id = ?", [req.params.id]);
    run("UPDATE bookings SET payment_status = 'rejected', updated_at = datetime('now') WHERE id = ?", [p.booking_id]);
    notifyAdmins('payment', `❌ Manual Payment Rejected: ${p.amount} ${p.currency}`, `Reason: ${reason || 'No reason'}`, { payment_id: p.id, booking_id: p.booking_id });
    auditLog(req.admin.id, req.admin.email, req.admin.role, 'payment_rejected_manual', 'payment', p.id, { booking_id: p.booking_id, reason }, req.ip);
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});



// ==================== ADMIN: FINANCE / REPORTS ====================
app.get('/api/admin/finance/revenue', adminAuth, (req, res) => {
  try {
    if (req.admin.role === 'employee') return res.status(403).json({ error: 'Insufficient permissions.' });
    const period = req.query.period || 'monthly';
    let sql = "SELECT strftime('%Y-%m', created_at) as period, SUM(amount) as total, COUNT(*) as count, currency FROM payments WHERE status='completed' GROUP BY period, currency ORDER BY period DESC";
    if (period === 'daily') sql = "SELECT strftime('%Y-%m-%d', created_at) as period, SUM(amount) as total, COUNT(*) as count, currency FROM payments WHERE status='completed' GROUP BY period, currency ORDER BY period DESC LIMIT 30";
    if (period === 'yearly') sql = "SELECT strftime('%Y', created_at) as period, SUM(amount) as total, COUNT(*) as count, currency FROM payments WHERE status='completed' GROUP BY period, currency ORDER BY period DESC";
    const revenue = all(sql);
    const totals = all("SELECT SUM(amount) as total, currency FROM payments WHERE status='completed' GROUP BY currency");
    const today = all("SELECT SUM(amount) as total, COUNT(*) as count FROM payments WHERE status='completed' AND date(created_at) = date('now')");
    const stats = all("SELECT p.currency, p.payment_method, COUNT(*) as count, SUM(p.amount) as total FROM payments p WHERE p.status='completed' GROUP BY p.currency, p.payment_method");
    const refundStats = get("SELECT COUNT(*) as count, SUM(amount) as total FROM refunds WHERE status='completed'");
    res.json({ revenue, totals, today: today[0] || { total: 0, count: 0 }, stats, refunds: refundStats || { count: 0, total: 0 } });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/finance/export', adminAuth, async (req, res) => {
  try {
    if (!['super_admin', 'admin', 'accountant'].some(r => r === req.admin.role)) return res.status(403).json({ error: 'Insufficient permissions.' });
    const format = req.query.format || 'csv';
    const payments = all("SELECT p.id, p.transaction_id, p.amount, p.currency, p.payment_method, p.status, p.created_at, b.booking_ref, b.customer_name FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id ORDER BY p.id DESC");
    if (format === 'csv') {
      let csv = "ID,Transaction,Amount,Currency,Method,Status,Date,Booking Ref,Customer\n";
      for (const p of payments) csv += `${p.id},"${p.transaction_id}",${p.amount},${p.currency},"${p.payment_method}","${p.status}","${p.created_at}","${p.booking_ref}","${p.customer_name}"\n`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=revenue-export.csv');
      res.send(csv);
    } else {
      res.json({ payments });
    }
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: INVOICES ====================
app.get('/api/admin/invoices', adminAuth, (req, res) => {
  try {
    const invoices = all("SELECT i.*, b.booking_ref, b.customer_name FROM invoices i LEFT JOIN bookings b ON i.booking_id = b.id ORDER BY i.id DESC");
    res.json({ invoices });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/invoices/:id', adminAuth, (req, res) => {
  try {
    const inv = get("SELECT i.*, b.booking_ref, b.customer_name, b.customer_phone, b.customer_email, b.check_in, b.check_out FROM invoices i LEFT JOIN bookings b ON i.booking_id = b.id WHERE i.id = ?", [req.params.id]);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice: inv });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: SECURITY ====================
app.get('/api/admin/security/settings', superAdminAuth, (req, res) => {
  try {
    const s = {
      two_factor_enabled: get("SELECT value FROM site_settings WHERE key='2fa_enabled'")?.value || '0',
      session_timeout: get("SELECT value FROM site_settings WHERE key='session_timeout'")?.value || '60',
      max_login_attempts: get("SELECT value FROM site_settings WHERE key='max_login_attempts'")?.value || '5',
      password_policy: get("SELECT value FROM site_settings WHERE key='password_policy'")?.value || 'medium',
      ip_whitelist: get("SELECT value FROM site_settings WHERE key='ip_whitelist'")?.value || '',
    };
    res.json({ settings: s });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/security/settings', superAdminAuth, (req, res) => {
  try {
    const { two_factor_enabled, session_timeout, max_login_attempts, password_policy, ip_whitelist } = req.body;
    const pairs = [['2fa_enabled', two_factor_enabled], ['session_timeout', session_timeout], ['max_login_attempts', max_login_attempts], ['password_policy', password_policy], ['ip_whitelist', ip_whitelist]];
    for (const [k, v] of pairs) {
      if (v !== undefined) {
        const existing = get("SELECT id FROM site_settings WHERE key = ?", [k]);
        if (existing) run("UPDATE site_settings SET value = ? WHERE key = ?", [String(v), k]);
        else run("INSERT INTO site_settings (key, value) VALUES (?, ?)", [k, String(v)]);
      }
    }
    logActivity(req.admin.id, req.admin.email, 'Security Settings Updated', JSON.stringify(req.body));
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: SYSTEM HEALTH ====================
app.get('/api/admin/system/health', superAdminAuth, (req, res) => {
  try {
    const dbSize = require('fs').existsSync(path.join(__dirname, 'data.sqlite')) ? require('fs').statSync(path.join(__dirname, 'data.sqlite')).size : 0;
    const uptime = process.uptime();
    const mem = process.memoryUsage();
    const dbStatus = (() => { try { get("SELECT 1 as ok"); return 'connected'; } catch { return 'error'; } })();
    res.json({
      status: 'healthy',
      database: dbStatus,
      db_size: (dbSize / 1024).toFixed(1),
      uptime_seconds: Math.floor(uptime),
      memory_mb: (mem.rss / 1024 / 1024).toFixed(1),
      heap_mb: (mem.heapUsed / 1024 / 1024).toFixed(1),
      node_version: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || 'development'
    });
  } catch (err) { safeError(res, err); }
});

// ==================== ADMIN: DASHBOARD ENHANCEMENTS ====================
// Enhanced stats with payment data
app.get('/api/admin/dashboard', superAdminAuth, (req, res) => {
  try {
    const stats = get("SELECT COUNT(*) as total_bookings, SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) as new_bookings, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending_bookings, SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) as confirmed_bookings, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed_bookings, SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled_bookings FROM bookings");
    const payments = get("SELECT COUNT(*) as total_payments, SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) as total_revenue, SUM(CASE WHEN status='pending' THEN amount ELSE 0 END) as pending_revenue, SUM(CASE WHEN status='refunded' THEN amount ELSE 0 END) as refunded_amount FROM payments");
    const totals = get("SELECT SUM(amount) as total FROM payments WHERE status='completed'");
    const recentPayments = all("SELECT p.*, b.booking_ref, b.customer_name FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id WHERE p.status='completed' ORDER BY p.id DESC LIMIT 5");
    const methodBreakdown = all("SELECT payment_method, COUNT(*) as count, SUM(amount) as total FROM payments WHERE status='completed' GROUP BY payment_method ORDER BY total DESC");
    const pendingManual = get("SELECT COUNT(*) as count FROM payments WHERE status='pending'");
    const fraudAlerts = get("SELECT COUNT(*) as count FROM fraud_scores WHERE risk_level IN ('high','critical')");
    const gatewayHealth = all("SELECT g.code, g.name, g.health_status FROM payment_gateways g WHERE g.is_active = 1");
    res.json({ stats, payments: { ...payments, total_revenue: totals?.total || 0 }, recent_payments: recentPayments, method_breakdown: methodBreakdown, pending_manual: pendingManual?.count || 0, fraud_alerts: fraudAlerts?.count || 0, gateway_health: gatewayHealth });
  } catch (err) { safeError(res, err); }
});

// Routes
app.get('/manage-panel', (req, res) => serveHTML(res, path.join(__dirname, 'admin.html')));
app.get('/admin', (req, res) => serveHTML(res, path.join(__dirname, 'admin.html')));
app.get('/super-admin', (req, res) => serveHTML(res, path.join(__dirname, 'super-admin.html')));

// ==================== PAYMENT FLOW ENDPOINTS ====================

// Payment page routes (serve HTML pages)
app.get('/payment/bank-transfer', (req, res) => serveHTML(res, path.join(__dirname, 'payment-bank-transfer.html')));
app.get('/payment/deposit', (req, res) => serveHTML(res, path.join(__dirname, 'payment-deposit.html')));
app.get('/payment/agent', (req, res) => serveHTML(res, path.join(__dirname, 'payment-agent.html')));

// Bank Transfer submit (receipt upload)
app.post('/api/payments/bank-transfer', auth, upload.single('receipt'), (req, res) => {
  try {
    const { booking_id, customer_name, customer_phone, bank_name, account_number, sender_name, sender_phone, transfer_ref, amount, currency } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'Booking ID required' });
    const booking = get("SELECT * FROM bookings WHERE id = ?", [booking_id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const receiptUrl = req.file ? '/uploads/' + req.file.filename : '';
    const ref = 'BT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    run("INSERT INTO bank_transfers (booking_id, user_id, customer_name, customer_phone, amount, currency, bank_name, account_number, receipt_url, sender_name, sender_phone, transfer_ref, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
      [booking_id, req.user.id, customer_name || booking.customer_name, customer_phone || booking.customer_phone, amount || booking.total, currency || 'USD', bank_name || '', account_number || '', receiptUrl, sender_name || '', sender_phone || '', transfer_ref || ref]);
    run("UPDATE bookings SET payment_status = 'pending_verification', payment_method = 'bank_transfer', status = 'pending', updated_at = datetime('now') WHERE id = ?", [booking_id]);
    const txnRef = 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    run("INSERT INTO transactions (booking_id, user_id, transaction_type, amount, currency, payment_method, provider_name, provider_transaction_id, status, reference_number) VALUES (?, ?, 'payment', ?, ?, 'bank_transfer', 'bank_transfer', ?, 'pending', ?)",
      [booking_id, req.user.id, amount || booking.total, currency || 'USD', ref, txnRef]);
    run("INSERT INTO payment_logs (booking_id, user_id, action, details, ip_address) VALUES (?, ?, 'bank_transfer_submitted', ?, ?)",
      [booking_id, req.user.id, JSON.stringify({ bank_name, amount, transfer_ref: ref }), req.ip || '']);
    notifyAdmins('payment', `Bank Transfer Submitted: ${amount || booking.total} ${currency || 'USD'}`, `Booking #${booking.booking_ref || booking_id} - awaiting verification`, { booking_id, amount: amount || booking.total, transfer_ref: ref });
    auditLog(req.user.id, req.user.email, req.user.role, 'bank_transfer_submitted', 'booking', booking_id, { amount: amount || booking.total, transfer_ref: ref });
    broadcastToAdmins('stats:update', { _ts: Date.now() });
    res.json({ ok: true, transfer_ref: ref, receipt_url: receiptUrl, message: 'Bank transfer submitted. Awaiting admin verification.' });
    const customer = get("SELECT u.* FROM users u JOIN bookings b ON b.user_id = u.id WHERE b.id = ?", [booking_id]);
    if (customer && customer.email) {
      sendTemplateEmail(customer.email, 'payment_receipt', {
        name: customer.name,
        amount: req.body.amount || booking.total || '0',
        method: 'bank_transfer',
        ref: booking.booking_ref || ''
      }, 'ar', booking_id);
    }
  } catch (err) { safeError(res, err); }
});

// Pay on Arrival
app.post('/api/payments/pay-on-arrival', auth, (req, res) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'Booking ID required' });
    const booking = get("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [booking_id, req.user.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    run("UPDATE bookings SET payment_status = 'pending', payment_method = 'cash_on_arrival', status = 'pending', updated_at = datetime('now') WHERE id = ?", [booking_id]);
    const txnRef = 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    run("INSERT INTO transactions (booking_id, user_id, transaction_type, amount, currency, payment_method, provider_name, status, reference_number) VALUES (?, ?, 'payment', ?, ?, 'cash_on_arrival', 'cash_on_arrival', 'pending', ?)",
      [booking_id, req.user.id, booking.total, booking.currency || 'USD', txnRef]);
    notifyAdmins('payment', `Pay on Arrival Selected`, `Booking #${booking.booking_ref || booking_id}`, { booking_id, amount: booking.total, method: 'cash_on_arrival' });
    auditLog(req.user.id, req.user.email, req.user.role, 'pay_on_arrival', 'booking', booking_id, { amount: booking.total });
    broadcastToAdmins('stats:update', { _ts: Date.now() });
    res.json({ ok: true, message: 'Pay on arrival confirmed.' });
  } catch (err) { safeError(res, err); }
});

// Deposit Payment
app.post('/api/payments/deposit', auth, (req, res) => {
  try {
    const { booking_id, deposit_percentage, deposit_amount } = req.body;
    if (!booking_id || !deposit_percentage) return res.status(400).json({ error: 'Booking ID and deposit percentage required' });
    const booking = get("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [booking_id, req.user.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const depAmount = deposit_amount || (booking.total * deposit_percentage) / 100;
    const remaining = booking.total - depAmount;
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    run("INSERT INTO deposits (booking_id, user_id, total_amount, deposit_amount, deposit_percentage, remaining_amount, deposit_paid, status, due_date) VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?)",
      [booking_id, req.user.id, booking.total, depAmount, deposit_percentage, remaining, dueDate]);
    run("UPDATE bookings SET deposit_amount = ?, deposit_paid = 0, payment_due_date = ?, status = 'pending', payment_method = 'deposit' WHERE id = ?", [depAmount, dueDate, booking_id]);
    const txnRef = 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    run("INSERT INTO transactions (booking_id, user_id, transaction_type, amount, currency, payment_method, provider_name, status, reference_number) VALUES (?, ?, 'deposit', ?, ?, 'deposit', 'deposit', 'pending', ?)",
      [booking_id, req.user.id, depAmount, booking.currency || 'USD', txnRef]);
    auditLog(req.user.id, req.user.email, req.user.role, 'deposit_created', 'booking', booking_id, { deposit_amount: depAmount, deposit_percentage, remaining, due_date: dueDate });
    res.json({ ok: true, deposit_amount: depAmount, remaining, due_date: dueDate, message: `Deposit of ${deposit_percentage}% (${depAmount}) required. Pay within 7 days.` });
    const customer = get("SELECT u.* FROM users u JOIN bookings b ON b.user_id = u.id WHERE b.id = ?", [booking_id]);
    if (customer && customer.email) {
      sendTemplateEmail(customer.email, 'payment_receipt', {
        name: customer.name,
        amount: depAmount || '0',
        method: 'deposit',
        ref: booking.booking_ref || ''
      }, 'ar', booking_id);
    }
  } catch (err) { safeError(res, err); }
});

// Agent Payment
app.post('/api/payments/agent', auth, (req, res) => {
  try {
    const { agent_name, agent_phone, booking_id, payment_method_confirmed, notes } = req.body;
    if (!booking_id || !agent_name) return res.status(400).json({ error: 'Booking ID and agent name required' });
    const booking = get("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [booking_id, req.user.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    run("INSERT INTO agent_payments (booking_id, user_id, agent_name, agent_phone, amount, currency, payment_method_confirmed, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
      [booking_id, req.user.id, agent_name, agent_phone || '', booking.total, booking.currency || 'USD', payment_method_confirmed || '', notes || '']);
    run("UPDATE bookings SET payment_status = 'pending', payment_method = 'agent', status = 'pending', updated_at = datetime('now') WHERE id = ?", [booking_id]);
    const txnRef = 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    run("INSERT INTO transactions (booking_id, user_id, transaction_type, amount, currency, payment_method, provider_name, status, reference_number) VALUES (?, ?, 'payment', ?, ?, 'agent', 'agent', 'pending', ?)",
      [booking_id, req.user.id, booking.total, booking.currency || 'USD', txnRef]);
    notifyAdmins('payment', `Agent Payment Arranged`, `Booking #${booking.booking_ref || booking_id} - Agent: ${agent_name}`, { booking_id, agent_name, amount: booking.total });
    auditLog(req.user.id, req.user.email, req.user.role, 'agent_payment_created', 'booking', booking_id, { agent_name, agent_phone });
    broadcastToAdmins('stats:update', { _ts: Date.now() });
    res.json({ ok: true, message: 'Agent payment recorded.' });
    const customer = get("SELECT u.* FROM users u JOIN bookings b ON b.user_id = u.id WHERE b.id = ?", [booking_id]);
    if (customer && customer.email) {
      sendTemplateEmail(customer.email, 'payment_receipt', {
        name: customer.name,
        amount: booking.total || '0',
        method: 'agent',
        ref: booking.booking_ref || ''
      }, 'ar', booking_id);
    }
  } catch (err) { safeError(res, err); }
});

// Admin: Get bank transfers list
app.get('/api/admin/bank-transfers', adminAuth, (req, res) => {
  try {
    const transfers = all("SELECT bt.*, b.booking_ref, b.customer_name, b.customer_phone, b.total as booking_total FROM bank_transfers bt LEFT JOIN bookings b ON bt.booking_id = b.id ORDER BY bt.id DESC");
    res.json({ bank_transfers: transfers });
  } catch (err) { safeError(res, err); }
});

// Admin: Approve bank transfer
app.put('/api/admin/bank-transfers/:id/approve', adminAuth, (req, res) => {
  try {
    const bt = get("SELECT * FROM bank_transfers WHERE id = ?", [req.params.id]);
    if (!bt) return res.status(404).json({ error: 'Bank transfer not found' });
    run("UPDATE bank_transfers SET status = 'approved', processed_by = ?, updated_at = datetime('now') WHERE id = ?", [req.admin.id, req.params.id]);
    run("UPDATE bookings SET status = 'confirmed', payment_status = 'paid', updated_at = datetime('now') WHERE id = ?", [bt.booking_id]);
    run("UPDATE transactions SET status = 'completed' WHERE booking_id = ? AND payment_method = 'bank_transfer'", [bt.booking_id]);
    auditLog(req.admin.id, req.admin.email, req.admin.role, 'bank_transfer_approved', 'bank_transfer', bt.id, { booking_id: bt.booking_id, amount: bt.amount }, req.ip);
    notifyAdmins('payment', `Bank Transfer Approved`, `Booking #${bt.booking_id}`, { booking_id: bt.booking_id, transfer_id: bt.id });
    broadcastToAdmins('stats:update', { _ts: Date.now() });
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Reject bank transfer
app.put('/api/admin/bank-transfers/:id/reject', adminAuth, (req, res) => {
  try {
    const bt = get("SELECT * FROM bank_transfers WHERE id = ?", [req.params.id]);
    if (!bt) return res.status(404).json({ error: 'Bank transfer not found' });
    run("UPDATE bank_transfers SET status = 'rejected', processed_by = ?, notes = COALESCE(?, notes), updated_at = datetime('now') WHERE id = ?", [req.admin.id, req.body.reason || '', req.params.id]);
    run("UPDATE bookings SET status = 'payment_failed', payment_status = 'failed', updated_at = datetime('now') WHERE id = ?", [bt.booking_id]);
    run("UPDATE transactions SET status = 'failed' WHERE booking_id = ? AND payment_method = 'bank_transfer'", [bt.booking_id]);
    auditLog(req.admin.id, req.admin.email, req.admin.role, 'bank_transfer_rejected', 'bank_transfer', bt.id, { booking_id: bt.booking_id, reason: req.body.reason }, req.ip);
    notifyAdmins('payment', `Bank Transfer Rejected`, `Booking #${bt.booking_id}`, { booking_id: bt.booking_id, transfer_id: bt.id, reason: req.body.reason });
    broadcastToAdmins('stats:update', { _ts: Date.now() });
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

// Admin: Get deposits
app.get('/api/admin/deposits', adminAuth, (req, res) => {
  try {
    const deposits = all("SELECT d.*, b.booking_ref, b.customer_name, b.total as booking_total FROM deposits d LEFT JOIN bookings b ON d.booking_id = b.id ORDER BY d.id DESC");
    res.json({ deposits });
  } catch (err) { safeError(res, err); }
});

// Admin: Get agent payments
app.get('/api/admin/agent-payments', adminAuth, (req, res) => {
  try {
    const payments = all("SELECT ap.*, b.booking_ref, b.customer_name, b.total as booking_total FROM agent_payments ap LEFT JOIN bookings b ON ap.booking_id = b.id ORDER BY ap.id DESC");
    res.json({ agent_payments: payments });
  } catch (err) { safeError(res, err); }
});

// Admin: Get all transactions
app.get('/api/admin/transactions', adminAuth, (req, res) => {
  try {
    const transactions = all("SELECT t.*, b.booking_ref, b.customer_name FROM transactions t LEFT JOIN bookings b ON t.booking_id = b.id ORDER BY t.id DESC");
    res.json({ transactions });
  } catch (err) { safeError(res, err); }
});

// Admin: Get payment logs
app.get('/api/admin/payment-logs', adminAuth, (req, res) => {
  try {
    const logs = all("SELECT pl.*, b.booking_ref FROM payment_logs pl LEFT JOIN bookings b ON pl.booking_id = b.id ORDER BY pl.id DESC");
    res.json({ payment_logs: logs });
  } catch (err) { safeError(res, err); }
});

// Admin: Update booking payment status (for pay on arrival)
app.put('/api/admin/bookings/:id/confirm-payment', adminAuth, (req, res) => {
  try {
    const booking = get("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    run("UPDATE bookings SET payment_status = 'paid', status = 'confirmed', updated_at = datetime('now') WHERE id = ?", [req.params.id]);
    run("UPDATE transactions SET status = 'completed' WHERE booking_id = ? AND payment_method = 'cash_on_arrival'", [req.params.id]);
    auditLog(req.admin.id, req.admin.email, req.admin.role, 'payment_confirmed_on_arrival', 'booking', booking.id, { booking_id: booking.id }, req.ip);
    notifyAdmins('payment', `Payment Confirmed on Arrival`, `Booking #${booking.booking_ref || booking.id}`, { booking_id: booking.id });
    broadcastToAdmins('stats:update', { _ts: Date.now() });
    res.json({ ok: true, message: 'Payment confirmed on arrival.' });
  } catch (err) { safeError(res, err); }
});

// Public: Get bank details (from settings)
app.get('/api/bank-details', (req, res) => {
  try {
    const keys = ['bank_name', 'bank_account_name', 'bank_iban', 'bank_swift', 'bank_account_number'];
    const details = {};
    for (const key of keys) {
      const row = get("SELECT value FROM site_settings WHERE key = ?", [key]);
      details[key] = row ? row.value : '';
    }
    res.json({ bank_details: details });
  } catch (err) { safeError(res, err); }
});

// ==================== CUSTOMER PANEL ====================
app.get('/my-bookings', (req, res) => serveHTML(res, path.join(__dirname, 'customer-panel.html')));

app.get('/api/my/bookings', auth, (req, res) => {
  const bookings = all("SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
  res.json({ bookings });
});

app.get('/api/my/loyalty', auth, (req, res) => {
  try {
    const user = get("SELECT loyalty_points, loyalty_tier FROM users WHERE id = ?", [req.user.id]);
    const history = all("SELECT * FROM loyalty_points WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", [req.user.id]);
    const tiers = all("SELECT * FROM reward_tiers ORDER BY min_points DESC");
    res.json({ points: user?.loyalty_points || 0, tier: user?.loyalty_tier || 'Bronze', history, tiers });
  } catch (err) { safeError(res, err); }
});

app.post('/api/coupons/validate', (req, res) => {
  try {
    const { code, total } = req.body;
    if (!code) return res.json({ valid: false, error: 'Code required' });
    const coupon = get("SELECT * FROM coupons WHERE code = ? AND active = 1", [code.toUpperCase()]);
    if (!coupon) return res.json({ valid: false, error: 'Invalid coupon' });
    if (coupon.expires_at && coupon.expires_at < new Date().toISOString().split('T')[0]) return res.json({ valid: false, error: 'Expired' });
    if (coupon.usage_limit > 0) {
      const used = get("SELECT COUNT(*) as count FROM bookings WHERE coupon_code = ?", [code.toUpperCase()]);
      if (used && used.count >= coupon.usage_limit) return res.json({ valid: false, error: 'Usage limit reached' });
    }
    if (total < coupon.min_total) return res.json({ valid: false, error: 'Minimum total $' + coupon.min_total + ' required' });
    const discount = coupon.type === 'percent' ? (total * coupon.value / 100) : Math.min(coupon.value, total);
    res.json({ valid: true, coupon: { code: coupon.code, name: coupon.name, name_ar: coupon.name_ar, type: coupon.type, value: coupon.value, discount: Math.round(discount * 100) / 100, min_total: coupon.min_total } });
  } catch (err) { safeError(res, err); }
});

app.get('/api/my/invoices', auth, (req, res) => {
  const invoices = all("SELECT i.*, b.booking_ref, b.customer_name, b.total, b.item_name, b.booking_type FROM invoices i LEFT JOIN bookings b ON i.booking_id = b.id WHERE b.user_id = ? ORDER BY i.created_at DESC", [req.user.id]);
  res.json({ invoices });
});

app.get('/api/my/payments', auth, (req, res) => {
  const payments = all("SELECT p.*, b.booking_ref, b.customer_name, b.total, b.item_name, b.booking_type FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id WHERE b.user_id = ? ORDER BY p.created_at DESC", [req.user.id]);
  res.json({ payments });
});

// ==================== EMAIL & INVOICE ROUTES ====================

app.put('/api/admin/smtp-settings', adminAuth, (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email, smtp_from_name } = req.body;
    const settings = { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email, smtp_from_name };
    for (const [k, v] of Object.entries(settings)) {
      if (v !== undefined) {
        const existing = get("SELECT id FROM site_settings WHERE key = ?", [k]);
        if (existing) run("UPDATE site_settings SET value = ? WHERE key = ?", [String(v), k]);
        else run("INSERT INTO site_settings (key, value) VALUES (?, ?)", [k, String(v)]);
      }
    }
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/test-email', adminAuth, (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email required' });
  sendEmail(to, 'Test Email from Syria Travel', '<h1>Test</h1><p>If you see this, SMTP is working!</p>');
  res.json({ ok: true, message: 'Email queued' });
});

app.get('/api/admin/email-logs', adminAuth, (req, res) => {
  const logs = all("SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 100");
  res.json({ email_logs: logs });
});

app.get('/api/admin/email-templates', adminAuth, (req, res) => {
  const templates = all("SELECT * FROM email_templates");
  res.json({ email_templates: templates });
});

app.get('/api/invoices/:id/pdf', auth, async (req, res) => {
  try {
    const invoice = get("SELECT i.*, b.booking_ref, b.customer_name, b.customer_email, b.customer_phone, b.item_name, b.booking_type, b.check_in, b.check_out, b.total FROM invoices i LEFT JOIN bookings b ON i.booking_id = b.id WHERE i.id = ?", [req.params.id]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const booking = get("SELECT * FROM bookings WHERE id = ?", [invoice.booking_id]);
    if (booking && booking.user_id !== req.user.id && !['admin','super_admin'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    const pdf = await generateInvoicePDF(invoice.id, booking);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.id}.pdf"`);
    res.send(pdf);
  } catch (err) { safeError(res, err); }
});

// ==================== AVAILABILITY & SEASONAL PRICING ====================
app.get('/api/availability', (req, res) => {
  try {
    const { item_type, item_id, start_date, end_date } = req.query;
    if (!item_type || !item_id) return res.json({ available: true, dates: [] });
    const dates = all("SELECT * FROM availability WHERE item_type = ? AND item_id = ? AND date >= ? AND date <= ?", 
      [item_type, parseInt(item_id), start_date || '2000-01-01', end_date || '2100-01-01']);
    res.json({ dates });
  } catch (err) { safeError(res, err); }
});

app.post('/api/admin/availability', adminAuth, (req, res) => {
  try {
    const { item_type, item_id, date, available, price_override, notes } = req.body;
    const existing = get("SELECT id FROM availability WHERE item_type = ? AND item_id = ? AND date = ?", [item_type, item_id, date]);
    if (existing) {
      run("UPDATE availability SET available = ?, price_override = ?, notes = ? WHERE id = ?", 
        [available !== undefined ? (available ? 1 : 0) : 1, price_override || 0, notes || '', existing.id]);
    } else {
      run("INSERT INTO availability (item_type, item_id, date, available, price_override, notes) VALUES (?, ?, ?, ?, ?, ?)",
        [item_type, item_id, date, available !== undefined ? (available ? 1 : 0) : 1, price_override || 0, notes || '']);
    }
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/seasonal-pricing', adminAuth, (req, res) => {
  const pricing = all("SELECT * FROM seasonal_pricing ORDER BY start_date DESC");
  res.json({ seasonal_pricing: pricing });
});

app.post('/api/admin/seasonal-pricing', adminAuth, (req, res) => {
  try {
    const { id, item_type, item_id, name, name_ar, start_date, end_date, multiplier, flat_price, active } = req.body;
    if (id) {
      run("UPDATE seasonal_pricing SET item_type=?, item_id=?, name=?, name_ar=?, start_date=?, end_date=?, multiplier=?, flat_price=?, active=? WHERE id=?",
        [item_type || '', item_id || 0, name || '', name_ar || '', start_date, end_date, multiplier || 1, flat_price || 0, active !== undefined ? (active?1:0) : 1, id]);
    } else {
      run("INSERT INTO seasonal_pricing (item_type, item_id, name, name_ar, start_date, end_date, multiplier, flat_price, active) VALUES (?,?,?,?,?,?,?,?,?)",
        [item_type || '', item_id || 0, name || '', name_ar || '', start_date, end_date, multiplier || 1, flat_price || 0, active !== undefined ? (active?1:0) : 1]);
    }
    res.json({ ok: true });
  } catch (err) { safeError(res, err); }
});

app.delete('/api/admin/seasonal-pricing/:id', adminAuth, (req, res) => {
  run("DELETE FROM seasonal_pricing WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

// ==================== ADMIN: REPORTS ====================
app.get('/api/admin/reports/monthly-revenue', adminAuth, (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const monthly = all("SELECT strftime('%m', created_at) as month, COUNT(*) as bookings, COALESCE(SUM(total),0) as revenue FROM bookings WHERE strftime('%Y', created_at) = ? AND status != 'cancelled' GROUP BY strftime('%m', created_at) ORDER BY month", [String(year)]);
    const totalRevenue = get("SELECT COALESCE(SUM(total),0) as total FROM bookings WHERE strftime('%Y', created_at) = ? AND status != 'cancelled'", [String(year)]);
    res.json({ monthly, total_revenue: totalRevenue?.total || 0, year: parseInt(year) });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/reports/booking-type-breakdown', adminAuth, (req, res) => {
  try {
    const breakdown = all("SELECT booking_type, COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM bookings WHERE status != 'cancelled' GROUP BY booking_type ORDER BY count DESC");
    res.json({ breakdown });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/reports/payment-method-stats', adminAuth, (req, res) => {
  try {
    const stats = all("SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM bookings WHERE status != 'cancelled' AND payment_method != '' GROUP BY payment_method ORDER BY count DESC");
    res.json({ payment_stats: stats });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/reports/top-items', adminAuth, (req, res) => {
  try {
    const type = req.query.type || 'hotel';
    const items = all("SELECT item_name, COUNT(*) as bookings, COALESCE(SUM(total),0) as revenue FROM bookings WHERE booking_type = ? AND status != 'cancelled' GROUP BY item_name ORDER BY bookings DESC LIMIT 10", [type]);
    res.json({ items });
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/reports/export-csv', adminAuth, (req, res) => {
  try {
    const start = req.query.start || '2000-01-01';
    const end = req.query.end || '2100-01-01';
    const bookings = all("SELECT b.*, u.name as user_name, u.email as user_email FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE date(b.created_at) >= ? AND date(b.created_at) <= ? ORDER BY b.created_at DESC", [start, end]);
    let csv = 'ID,Ref,Customer,Email,Phone,Type,Item,CheckIn,CheckOut,Total,Payment,Status,Date\n';
    for (const b of bookings) {
      csv += `${b.id},"${b.booking_ref}","${b.customer_name}","${b.customer_email}","${b.customer_phone}","${b.booking_type}","${b.item_name}","${b.check_in}","${b.check_out}",${b.total},"${b.payment_method}","${b.status}","${b.created_at}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings-export.csv"');
    res.send(csv);
  } catch (err) { safeError(res, err); }
});

app.get('/api/admin/reports/daily-bookings', adminAuth, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const daily = all("SELECT date(created_at) as day, COUNT(*) as count FROM bookings WHERE date(created_at) >= date('now', ?) GROUP BY date(created_at) ORDER BY day", [`-${days} days`]);
    res.json({ daily, days });
  } catch (err) { safeError(res, err); }
});

// ============ ADVANCED SEARCH ============
app.get('/api/search', (req, res) => {
  try {
    const { q } = req.query;
    let results = [];
    const raw = (q || '').toLowerCase().trim();
    console.log('SEARCH raw:', JSON.stringify(raw));
    const allH = /^(ال)?فنادق$|^hotels?$/.test(raw);
    const allT = /^(ال)?جولات$|^(ال)?جولة$|^(ال)?سياحية$|^(ال)?رحلات$|^tours?$|^trips?$/.test(raw);
    const allC = /^(ال)?سيارات$|^(ال)?سيارة$|^(ال)?مركبات$|^cars?$/.test(raw);
    const allG = /^(ال)?صور$|^(ال)?معرض|^gallery$/.test(raw);
    console.log('SEARCH flags - H:', allH, 'T:', allT, 'C:', allC, 'G:', allG);
    const term = q ? `%${q}%` : '%%';

    try {
      if (allH) {
        const rows = all("SELECT id, name, name_ar, city, city_ar, cover_image, price, rating, slug FROM hotels WHERE status='active' LIMIT 50", []);
        for (const h of rows) results.push({ id: h.id, name: h.name, name_ar: h.name_ar, city: h.city, city_ar: h.city_ar, main_image: h.cover_image || '', price: h.price, rating: h.rating, slug: h.slug, item_type: 'hotel' });
      } else {
        const rows = all("SELECT id, name, name_ar, city, city_ar, cover_image, price, rating, slug FROM hotels WHERE status='active' AND (name LIKE ? OR name_ar LIKE ? OR city LIKE ? OR city_ar LIKE ?) LIMIT 20", [term, term, term, term]);
        for (const h of rows) results.push({ id: h.id, name: h.name, name_ar: h.name_ar, city: h.city, city_ar: h.city_ar, main_image: h.cover_image || '', price: h.price, rating: h.rating, slug: h.slug, item_type: 'hotel' });
      }
    } catch (e) { console.error('hotel search:', e); }

    try {
      if (allT) {
        const rows = all("SELECT id, name, name_ar, image, price, duration, slug FROM tours WHERE status='active' LIMIT 50", []);
        for (const t of rows) results.push({ id: t.id, name: t.name, name_ar: t.name_ar, main_image: t.image || '', price: t.price, slug: t.slug, item_type: 'tour' });
      } else {
        const rows = all("SELECT id, name, name_ar, image, price, duration, slug FROM tours WHERE status='active' AND (name LIKE ? OR name_ar LIKE ?) LIMIT 20", [term, term]);
        for (const t of rows) results.push({ id: t.id, name: t.name, name_ar: t.name_ar, main_image: t.image || '', price: t.price, slug: t.slug, item_type: 'tour' });
      }
    } catch (e) { console.error('tour search:', e); }

    try {
      if (allC) {
        const rows = all("SELECT id, name, name_ar, image, price_per_day, model, seats, slug FROM vehicles WHERE status='active' LIMIT 50", []);
        for (const v of rows) results.push({ id: v.id, name: v.name, name_ar: v.name_ar, main_image: v.image || '', price_per_day: v.price_per_day, model: v.model, seats: v.seats, slug: v.slug, item_type: 'car' });
      } else {
        const rows = all("SELECT id, name, name_ar, image, price_per_day, model, seats, slug FROM vehicles WHERE status='active' AND (name LIKE ? OR name_ar LIKE ?) LIMIT 20", [term, term]);
        for (const v of rows) results.push({ id: v.id, name: v.name, name_ar: v.name_ar, main_image: v.image || '', price_per_day: v.price_per_day, model: v.model, seats: v.seats, slug: v.slug, item_type: 'car' });
      }
    } catch (e) { console.error('car search:', e); }

    try {
      if (allG) {
        const rows = all("SELECT id, name, name_ar, cover_image, slug FROM gallery WHERE status='active' LIMIT 50", []);
        for (const g of rows) results.push({ id: g.id, name: g.name, name_ar: g.name_ar, main_image: g.cover_image || '', slug: g.slug, item_type: 'gallery' });
      } else {
        const rows = all("SELECT id, name, name_ar, cover_image, slug FROM gallery WHERE status='active' AND (name LIKE ? OR name_ar LIKE ?) LIMIT 20", [term, term]);
        for (const g of rows) results.push({ id: g.id, name: g.name, name_ar: g.name_ar, main_image: g.cover_image || '', slug: g.slug, item_type: 'gallery' });
      }
    } catch (e) { console.error('gallery search:', e); }

    console.log('SEARCH results count:', results.length);
    res.json({ results });
  } catch (err) { console.error('SEARCH:', err); res.status(500).json({ error: err.message }); }
});

// ============ GALLERY & TOUR DATES ============
app.get('/api/gallery-full', (req, res) => {
  try {
    const gallery = all("SELECT g.*, COALESCE(h.name, t.name, v.name) as item_name FROM gallery g LEFT JOIN hotels h ON g.item_type='hotel' AND g.item_id=h.id LEFT JOIN tours t ON g.item_type='tour' AND g.item_id=t.id LEFT JOIN vehicles v ON g.item_type='car' AND g.item_id=v.id ORDER BY g.id DESC");
    res.json({ gallery });
  } catch (err) { safeError(res, err); }
});

// Tour dates by tour id
app.get('/api/tour-dates/:id', (req, res) => {
  try {
    const tour = get("SELECT * FROM tours WHERE id = ?", [req.params.id]);
    if (!tour) return res.status(404).json({ error: 'Tour not found' });
    // Return available dates from the seasonal_pricing and availability tables
    const dates = all("SELECT DISTINCT date FROM availability WHERE item_type='tour' AND item_id=? AND (available=1 OR available IS NULL) ORDER BY date LIMIT 60", [req.params.id]);
    const prices = all("SELECT start_date, end_date, multiplier, price FROM seasonal_pricing WHERE item_type='tour' AND item_id=? ORDER BY start_date", [req.params.id]);
    res.json({ tour, dates: dates.map(d => d.date), prices });
  } catch (err) { safeError(res, err); }
});

// All tour dates overview (for gallery)
app.get('/api/tour-dates', (req, res) => {
  try {
    const tours = all("SELECT t.id, t.name, t.name_ar, t.price, t.duration, t.image as main_image, t.featured as rating, (SELECT COUNT(DISTINCT date) FROM availability WHERE item_type='tour' AND item_id=t.id AND (available=1 OR available IS NULL) AND date >= date('now')) as available_dates FROM tours t ORDER BY t.id DESC");
    res.json({ tours });
  } catch (err) { safeError(res, err); }
});

app.use('/api/*', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search.html'));
});
app.get('*', (req, res) => serveHTML(res, path.join(__dirname, 'index.html')));

async function start() {
  await init();
  const uploadsDir = path.resolve(config.upload.dir);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  server.listen(PORT, () => {
    console.log(`Syria Travel Enterprise v3.0.0`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/manage-panel`);
    console.log(`Super Admin: http://localhost:${PORT}/super-admin`);
    if (isProd) {
      console.log(`CORS origin: ${config.cors.origin}`);
      console.log(`Upload dir: ${uploadsDir}`);
    }
  });
}

function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();
