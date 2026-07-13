const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data.sqlite');
let dbInstance;
let SQL;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  password TEXT NOT NULL,
  role TEXT DEFAULT 'customer',
  avatar TEXT DEFAULT '',
  country TEXT DEFAULT '',
  city TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  favorites TEXT DEFAULT '[]',
  total_bookings INTEGER DEFAULT 0,
  country_code TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER DEFAULT 0,
  user_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  details TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  email TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  user_country TEXT DEFAULT '',
  rating INTEGER DEFAULT 5,
  text TEXT NOT NULL,
  text_ar TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  country TEXT DEFAULT 'Syria',
  image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  activities TEXT DEFAULT '[]',
  activities_ar TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS city_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id INTEGER NOT NULL,
  image TEXT NOT NULL,
  title TEXT DEFAULT '',
  title_ar TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  city_id INTEGER DEFAULT 0,
  city TEXT DEFAULT '',
  city_ar TEXT DEFAULT '',
  address TEXT DEFAULT '',
  address_ar TEXT DEFAULT '',
  rating INTEGER DEFAULT 5,
  price REAL DEFAULT 0,
  cover_image TEXT DEFAULT '',
  desc TEXT DEFAULT '',
  desc_ar TEXT DEFAULT '',
  long_desc TEXT DEFAULT '',
  long_desc_ar TEXT DEFAULT '',
  amenities TEXT DEFAULT '[]',
  policies TEXT DEFAULT '',
  policies_ar TEXT DEFAULT '',
  lat REAL DEFAULT 0,
  lng REAL DEFAULT 0,
  featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hotel_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INTEGER NOT NULL,
  image TEXT NOT NULL,
  title TEXT DEFAULT '',
  title_ar TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INTEGER NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  category TEXT DEFAULT '',
  category_ar TEXT DEFAULT '',
  capacity INTEGER DEFAULT 2,
  size TEXT DEFAULT '',
  bed_type TEXT DEFAULT '',
  bed_type_ar TEXT DEFAULT '',
  price REAL DEFAULT 0,
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  services TEXT DEFAULT '[]',
  amenities TEXT DEFAULT '[]',
  availability TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS room_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  image TEXT NOT NULL,
  title TEXT DEFAULT '',
  title_ar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  city_id INTEGER DEFAULT 0,
  duration TEXT DEFAULT '',
  duration_ar TEXT DEFAULT '',
  price REAL DEFAULT 0,
  image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  included TEXT DEFAULT '[]',
  included_ar TEXT DEFAULT '[]',
  featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tour_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tour_id INTEGER NOT NULL,
  image TEXT NOT NULL,
  title TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tour_itinerary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tour_id INTEGER NOT NULL,
  day INTEGER DEFAULT 1,
  title TEXT DEFAULT '',
  title_ar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  year INTEGER DEFAULT 2024,
  transmission TEXT DEFAULT '',
  fuel_type TEXT DEFAULT '',
  seats INTEGER DEFAULT 5,
  luggage INTEGER DEFAULT 3,
  price_per_day REAL DEFAULT 0,
  price_per_week REAL DEFAULT 0,
  price_per_month REAL DEFAULT 0,
  image TEXT DEFAULT '',
  features TEXT DEFAULT '[]',
  features_ar TEXT DEFAULT '[]',
  featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vehicle_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  image TEXT NOT NULL,
  title TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  historical_info TEXT DEFAULT '',
  historical_info_ar TEXT DEFAULT '',
  tourism_info TEXT DEFAULT '',
  tourism_info_ar TEXT DEFAULT '',
  activities TEXT DEFAULT '[]',
  activities_ar TEXT DEFAULT '[]',
  visiting_tips TEXT DEFAULT '',
  visiting_tips_ar TEXT DEFAULT '',
  nearby_attractions TEXT DEFAULT '',
  nearby_attractions_ar TEXT DEFAULT '',
  lat REAL DEFAULT 0,
  lng REAL DEFAULT 0,
  featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gallery_id INTEGER NOT NULL,
  image TEXT NOT NULL,
  title TEXT DEFAULT '',
  title_ar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_ref TEXT UNIQUE DEFAULT '',
  user_id INTEGER DEFAULT 0,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_whatsapp TEXT DEFAULT '',
  country_code TEXT DEFAULT '',
  booking_type TEXT NOT NULL,
  item_id INTEGER DEFAULT 0,
  item_name TEXT DEFAULT '',
  room_id INTEGER DEFAULT 0,
  room_name TEXT DEFAULT '',
  check_in TEXT DEFAULT '',
  check_out TEXT DEFAULT '',
  guests INTEGER DEFAULT 1,
  nights INTEGER DEFAULT 0,
  days INTEGER DEFAULT 0,
  rooms_count INTEGER DEFAULT 1,
  total REAL DEFAULT 0,
  special_requests TEXT DEFAULT '',
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  title_ar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  discount_type TEXT DEFAULT 'percentage',
  discount_value REAL DEFAULT 0,
  item_type TEXT DEFAULT '',
  item_id INTEGER DEFAULT 0,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  image TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT DEFAULT 'percentage',
  discount_value REAL DEFAULT 0,
  max_usage INTEGER DEFAULT 100,
  usage_count INTEGER DEFAULT 0,
  min_amount REAL DEFAULT 0,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT DEFAULT '',
  content TEXT DEFAULT '',
  content_ar TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER DEFAULT 0,
  type TEXT NOT NULL,
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  data TEXT DEFAULT '{}',
  delivered_ws INTEGER DEFAULT 0,
  delivered_push INTEGER DEFAULT 0,
  read_status INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  name_ar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  permissions TEXT DEFAULT '[]',
  is_system INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER DEFAULT 0,
  employee_id TEXT UNIQUE DEFAULT '',
  department TEXT DEFAULT '',
  position TEXT DEFAULT '',
  salary REAL DEFAULT 0,
  hire_date TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  name_ar TEXT DEFAULT '',
  symbol TEXT DEFAULT '',
  exchange_rate REAL DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER DEFAULT 0,
  user_id INTEGER DEFAULT 0,
  amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT DEFAULT '',
  transaction_id TEXT DEFAULT '',
  gateway_response TEXT DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER DEFAULT 0,
  booking_id INTEGER DEFAULT 0,
  amount REAL DEFAULT 0,
  reason TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  processed_by INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER DEFAULT 0,
  invoice_number TEXT UNIQUE DEFAULT '',
  customer_name TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  items TEXT DEFAULT '[]',
  subtotal REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  refresh_token TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  expires_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Enterprise Payment System Tables
CREATE TABLE IF NOT EXISTS payment_gateways (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'custom',
  is_active INTEGER DEFAULT 0,
  is_fallback INTEGER DEFAULT 0,
  config TEXT DEFAULT '{}',
  supported_currencies TEXT DEFAULT '["USD"]',
  supported_countries TEXT DEFAULT '[]',
  success_rate REAL DEFAULT 100,
  avg_response_time REAL DEFAULT 0,
  priority INTEGER DEFAULT 0,
  last_health_check TEXT DEFAULT '',
  health_status TEXT DEFAULT 'unknown',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  provider_code TEXT DEFAULT '',
  regions TEXT DEFAULT '["all"]',
  supported_currencies TEXT DEFAULT '["USD"]',
  min_amount REAL DEFAULT 0,
  max_amount REAL DEFAULT 999999,
  processing_fee REAL DEFAULT 0,
  fee_type TEXT DEFAULT 'percentage',
  is_active INTEGER DEFAULT 1,
  is_instant INTEGER DEFAULT 1,
  needs_manual_approval INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  payment_id INTEGER DEFAULT 0,
  payment_mode TEXT DEFAULT 'full',
  deposit_amount REAL DEFAULT 0,
  deposit_paid INTEGER DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  due_date TEXT DEFAULT '',
  payment_intent_id TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fraud_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER DEFAULT 0,
  user_id INTEGER DEFAULT 0,
  ip_address TEXT DEFAULT '',
  device_fingerprint TEXT DEFAULT '',
  risk_score REAL DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  flags TEXT DEFAULT '[]',
  is_blocked INTEGER DEFAULT 0,
  reviewed_by INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS risk_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER DEFAULT 0,
  user_id INTEGER DEFAULT 0,
  action TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  risk_score REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gateway_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gateway_id INTEGER NOT NULL,
  status TEXT DEFAULT 'unknown',
  response_time REAL DEFAULT 0,
  error_message TEXT DEFAULT '',
  checked_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  reason TEXT DEFAULT '',
  created_by INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER DEFAULT 0,
  user_email TEXT DEFAULT '',
  user_role TEXT DEFAULT '',
  action TEXT NOT NULL,
  resource TEXT DEFAULT '',
  resource_id INTEGER DEFAULT 0,
  details TEXT DEFAULT '{}',
  ip_address TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_intents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  user_id INTEGER DEFAULT 0,
  intent_id TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT DEFAULT '',
  provider_code TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  client_secret TEXT DEFAULT '',
  metadata TEXT DEFAULT '{}',
  expires_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bank_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER DEFAULT 0,
  user_id INTEGER DEFAULT 0,
  customer_name TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  bank_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  receipt_url TEXT DEFAULT '',
  sender_name TEXT DEFAULT '',
  sender_phone TEXT DEFAULT '',
  transfer_ref TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  notes TEXT DEFAULT '',
  processed_by INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER DEFAULT 0,
  user_id INTEGER DEFAULT 0,
  total_amount REAL DEFAULT 0,
  deposit_amount REAL DEFAULT 0,
  deposit_percentage REAL DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  deposit_paid INTEGER DEFAULT 0,
  remaining_paid INTEGER DEFAULT 0,
  payment_method TEXT DEFAULT '',
  provider_transaction_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  due_date TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER DEFAULT 0,
  user_id INTEGER DEFAULT 0,
  agent_name TEXT DEFAULT '',
  agent_phone TEXT DEFAULT '',
  amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_method_confirmed TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  processed_by INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER DEFAULT 0,
  user_id INTEGER DEFAULT 0,
  transaction_type TEXT DEFAULT '',
  amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT DEFAULT '',
  provider_name TEXT DEFAULT '',
  provider_transaction_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  reference_number TEXT DEFAULT '',
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER DEFAULT 0,
  user_id INTEGER DEFAULT 0,
  action TEXT DEFAULT '',
  details TEXT DEFAULT '{}',
  ip_address TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient TEXT NOT NULL,
  subject TEXT DEFAULT '',
  template TEXT DEFAULT '',
  booking_id INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  subject TEXT DEFAULT '',
  subject_ar TEXT DEFAULT '',
  body TEXT DEFAULT '',
  body_ar TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  available INTEGER DEFAULT 1,
  price_override REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(item_type, item_id, date)
);

CREATE TABLE IF NOT EXISTS seasonal_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL,
  item_id INTEGER DEFAULT 0,
  name TEXT DEFAULT '',
  name_ar TEXT DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  multiplier REAL DEFAULT 1.0,
  flat_price REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loyalty_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  type TEXT DEFAULT 'earned',
  reference TEXT DEFAULT '',
  booking_id INTEGER DEFAULT 0,
  expires_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reward_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  min_points INTEGER DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  badge TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS trip_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  itinerary_id INTEGER DEFAULT 0,
  day INTEGER DEFAULT 1,
  title TEXT DEFAULT '',
  title_ar TEXT DEFAULT '',
  completed INTEGER DEFAULT 0,
  completed_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
`;

async function init() {
  if (!SQL) SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.run("PRAGMA journal_mode=WAL");
  dbInstance.run("PRAGMA foreign_keys=ON");

  const statements = SCHEMA.split(';').filter(s => s.trim().length > 0);
  for (const stmt of statements) {
    try { dbInstance.run(stmt + ';'); } catch (e) { console.error('Schema error:', e.message); }
  }

  try { dbInstance.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE users ADD COLUMN country_code TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE cities ADD COLUMN description TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE cities ADD COLUMN description_ar TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE cities ADD COLUMN activities TEXT DEFAULT '[]'"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE cities ADD COLUMN activities_ar TEXT DEFAULT '[]'"); } catch (e) {}
  try { dbInstance.run("CREATE TABLE IF NOT EXISTS city_images (id INTEGER PRIMARY KEY AUTOINCREMENT, city_id INTEGER NOT NULL, image TEXT NOT NULL, title TEXT DEFAULT '', title_ar TEXT DEFAULT '', sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN customer_email TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN nationality TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending'"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN payment_method TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN deposit_amount REAL DEFAULT 0"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN deposit_paid INTEGER DEFAULT 0"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN payment_due_date TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE payments ADD COLUMN gateway_id INTEGER DEFAULT 0"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE payments ADD COLUMN risk_score REAL DEFAULT 0"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE payments ADD COLUMN payment_intent_id TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE payments ADD COLUMN threeds_status TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE payments ADD COLUMN billing_details TEXT DEFAULT '{}'"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE payments ADD COLUMN provider_code TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE payments ADD COLUMN fee_amount REAL DEFAULT 0"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN payment_deadline TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN payment_notes TEXT DEFAULT ''"); } catch (e) {}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN coupon_id INTEGER DEFAULT 0"); } catch(e){}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN discount_amount REAL DEFAULT 0"); } catch(e){}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN coupon_code TEXT DEFAULT ''"); } catch(e){}
  try { dbInstance.run("ALTER TABLE bookings ADD COLUMN loyalty_points_used INTEGER DEFAULT 0"); } catch(e){}
  try { dbInstance.run("ALTER TABLE users ADD COLUMN loyalty_points INTEGER DEFAULT 0"); } catch(e){}
  try { dbInstance.run("ALTER TABLE users ADD COLUMN loyalty_tier TEXT DEFAULT ''"); } catch(e){}
  try { dbInstance.run("ALTER TABLE coupons ADD COLUMN name TEXT DEFAULT ''"); } catch(e){}
  try { dbInstance.run("ALTER TABLE coupons ADD COLUMN name_ar TEXT DEFAULT ''"); } catch(e){}
  try { dbInstance.run("ALTER TABLE coupons ADD COLUMN value REAL DEFAULT 0"); } catch(e){}
  try { dbInstance.run("ALTER TABLE coupons ADD COLUMN type TEXT DEFAULT 'percent'"); } catch(e){}
  try { dbInstance.run("ALTER TABLE coupons ADD COLUMN min_total REAL DEFAULT 0"); } catch(e){}
  try { dbInstance.run("ALTER TABLE coupons ADD COLUMN active INTEGER DEFAULT 1"); } catch(e){}
  try { dbInstance.run("ALTER TABLE coupons ADD COLUMN expires_at TEXT DEFAULT ''"); } catch(e){}
  try { dbInstance.run("ALTER TABLE coupons ADD COLUMN usage_limit INTEGER DEFAULT 0"); } catch(e){}

  seedDefaults();
  save();
}

function seedDefaults() {
  const adminCheck = get("SELECT id FROM users WHERE role = 'super_admin'");
  if (!adminCheck) {
    const hash = bcrypt.hashSync('189910alikings', 10);
    run("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
      ['Super Admin', 'alihenawe04@gmail.com', '+963951564210', hash, 'super_admin']);
  }
  const demoCheck = get("SELECT id FROM users WHERE email = 'demo@syria.com'");
  if (!demoCheck) {
    const hash = bcrypt.hashSync('password123', 10);
    run("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
      ['Demo Traveler', 'demo@syria.com', '+963951564210', hash, 'customer']);
  }
  const settings = [
    ['site_name', 'Syria Travel'],
    ['site_name_ar', 'سياحة سوريا'],
    ['site_logo', ''],
    ['site_favicon', ''],
    ['company_name', 'Syria Travel Tourism'],
    ['company_address', 'Damascus, Syria'],
    ['company_address_ar', 'دمشق، سوريا'],
    ['contact_phone', '+963951564210'],
    ['whatsapp_number', '963951564210'],
    ['contact_email', 'concierge@syria-travel.com'],
    ['facebook_url', ''],
    ['instagram_url', ''],
    ['twitter_url', ''],
    ['youtube_url', ''],
    ['footer_text', 'Premium international travel booking platform for Syrian tourism.'],
    ['footer_text_ar', 'منصة حجز سفر دولية فاخرة للسياحة السورية.'],
    ['hero_title', 'Discover Ancient Syria in Absolute Luxury'],
    ['hero_title_ar', 'اكتشف عراقة سوريا في رفاهية مطلقة'],
    ['hero_subtitle', 'Explore Damascus, Palmyra, and Aleppo with tailored premium tours, 5-star heritage hotels, and elite private transport.'],
    ['hero_subtitle_ar', 'استكشف دمشق، وتدمر، وحلب عبر جولات حصرية مخصصة، وفنادق تراثية فئة 5 نجوم، ومواصلات خاصة فاخرة.'],
    ['homepage_about', ''],
    ['homepage_about_ar', ''],
    ['primary_color', '#C9A96E'],
    ['secondary_color', '#0D1625'],
    ['meta_title', 'Syria Travel — Luxury Heritage Tourism Platform'],
    ['meta_description', 'Book premium tours, luxury hotels, and car rentals across Syria. Experience ancient heritage with modern comfort.'],
    ['meta_keywords', 'Syria travel, luxury hotels Damascus, Syrian tourism, heritage tours, car rental Syria'],
    ['maintenance_mode', '0'],
    ['bank_name', 'Bank of Syria & Overseas'],
    ['bank_account_name', 'Syria Travel Tourism LLC'],
    ['bank_account_number', 'SA1234567890123456789012'],
    ['bank_iban', 'SY12 3456 7890 1234 5678 9012'],
    ['bank_swift', 'BSYOSYDAXXX'],
    ['smtp_host', ''],
    ['smtp_port', '587'],
    ['smtp_user', ''],
    ['smtp_pass', ''],
    ['smtp_from_email', 'noreply@syria-travel.com'],
    ['smtp_from_name', 'Syria Travel'],
  ];
  for (const [k, v] of settings) {
    const existing = get("SELECT id FROM site_settings WHERE key = ?", [k]);
    if (!existing) run("INSERT INTO site_settings (key, value) VALUES (?, ?)", [k, v]);
  }
  const pages = [
    ['privacy-policy', 'Privacy Policy', 'سياسة الخصوصية', '<p>Privacy policy content goes here.</p>', '<p>محتوى سياسة الخصوصية هنا.</p>'],
    ['terms-conditions', 'Terms & Conditions', 'الشروط والأحكام', '<p>Terms and conditions content goes here.</p>', '<p>محتوى الشروط والأحكام هنا.</p>'],
    ['cancellation-policy', 'Cancellation Policy', 'سياسة الإلغاء', '<p>Cancellation policy content goes here.</p>', '<p>محتوى سياسة الإلغاء هنا.</p>'],
    ['refund-policy', 'Refund Policy', 'سياسة الاسترداد', '<p>Refund policy content goes here.</p>', '<p>محتوى سياسة الاسترداد هنا.</p>'],
    ['about', 'About Us', 'من نحن', '<p>About Syria Travel.</p>', '<p>عن سياحة سوريا.</p>'],
    ['contact', 'Contact Us', 'اتصل بنا', '<p>Contact us page content.</p>', '<p>محتوى صفحة اتصل بنا.</p>'],
  ];
  for (const [slug, title, titleAr, content, contentAr] of pages) {
    const existing = get("SELECT id FROM pages WHERE slug = ?", [slug]);
    if (!existing) run("INSERT INTO pages (slug, title, title_ar, content, content_ar) VALUES (?, ?, ?, ?, ?)", [slug, title, titleAr, content, contentAr]);
  }
  const countryCodes = [
    ['SY', 'Syria', 'سوريا', '+963'],
    ['SA', 'Saudi Arabia', 'السعودية', '+966'],
    ['AE', 'UAE', 'الإمارات', '+971'],
    ['QA', 'Qatar', 'قطر', '+974'],
    ['KW', 'Kuwait', 'الكويت', '+965'],
    ['BH', 'Bahrain', 'البحرين', '+973'],
    ['OM', 'Oman', 'عمان', '+968'],
    ['JO', 'Jordan', 'الأردن', '+962'],
    ['LB', 'Lebanon', 'لبنان', '+961'],
    ['IQ', 'Iraq', 'العراق', '+964'],
    ['EG', 'Egypt', 'مصر', '+20'],
    ['TR', 'Turkey', 'تركيا', '+90'],
    ['US', 'United States', 'الولايات المتحدة', '+1'],
    ['GB', 'United Kingdom', 'المملكة المتحدة', '+44'],
    ['FR', 'France', 'فرنسا', '+33'],
    ['DE', 'Germany', 'ألمانيا', '+49'],
    ['IT', 'Italy', 'إيطاليا', '+39'],
    ['ES', 'Spain', 'إسبانيا', '+34'],
    ['CA', 'Canada', 'كندا', '+1'],
    ['AU', 'Australia', 'أستراليا', '+61'],
  ];
  try {
    dbInstance.run("CREATE TABLE IF NOT EXISTS country_codes (code TEXT PRIMARY KEY, name TEXT, name_ar TEXT, dial_code TEXT)");
    for (const [code, name, nameAr, dial] of countryCodes) {
      const existing = get("SELECT code FROM country_codes WHERE code = ?", [code]);
      if (!existing) run("INSERT INTO country_codes (code, name, name_ar, dial_code) VALUES (?, ?, ?, ?)", [code, name, nameAr, dial]);
    }
  } catch (e) {}
  const defaultRoles = [
    { name: 'super_admin', name_ar: 'مشرف عام', perms: '["*"]' },
    { name: 'admin', name_ar: 'مدير', perms: '["bookings","hotels","tours","vehicles","gallery","reviews","users","reports","settings"]' },
    { name: 'accountant', name_ar: 'محاسب', perms: '["payments:view","refunds:manage","reports:finance","invoices:view"]' },
    { name: 'employee', name_ar: 'موظف', perms: '["bookings:view","bookings:create","contacts:view","reviews:view"]' },
    { name: 'support_agent', name_ar: 'دعم فني', perms: '["bookings:view","contacts:manage","reviews:manage"]' },
    { name: 'hotel_manager', name_ar: 'مدير فنادق', perms: '["hotels:manage","rooms:manage"]' },
    { name: 'tour_manager', name_ar: 'مدير جولات', perms: '["tours:manage"]' },
  ];
  for (const r of defaultRoles) {
    const existing = get("SELECT id FROM roles WHERE name = ?", [r.name]);
    if (!existing) run("INSERT INTO roles (name, name_ar, permissions, is_system) VALUES (?, ?, ?, 1)", [r.name, r.name_ar, r.perms]);
  }
  const templates = [
    ['booking_confirmation', 'Booking Confirmed - Syria Travel', 'تأكيد الحجز - Syria Travel',
      '<div style="font-family:Arial;max-width:600px;margin:auto;background:#0A0F1A;color:#E8E0D0;padding:30px;border-radius:12px;"><h1 style="color:#C9A96E;text-align:center;">✦ Syria Travel</h1><p>Dear {{name}},</p><p>Your booking has been confirmed!</p><p><strong>Reference:</strong> {{ref}}<br><strong>Item:</strong> {{item}}<br><strong>Check-in:</strong> {{check_in}}<br><strong>Total:</strong> ${{total}}</p><p>Thank you for choosing Syria Travel.</p></div>',
      '<div style="font-family:Arial;max-width:600px;margin:auto;background:#0A0F1A;color:#E8E0D0;padding:30px;border-radius:12px;"><h1 style="color:#C9A96E;text-align:center;">✦ Syria Travel</h1><p>عزيزي {{name}}،</p><p>تم تأكيد حجزك!</p><p><strong>المرجع:</strong> {{ref}}<br><strong>العنصر:</strong> {{item}}<br><strong>تاريخ الوصول:</strong> {{check_in}}<br><strong>المبلغ:</strong> ${{total}}</p><p>شكراً لاختياركم Syria Travel.</p></div>'
    ],
    ['payment_receipt', 'Payment Receipt - Syria Travel', 'إيصال الدفع - Syria Travel',
      '<div style="font-family:Arial;max-width:600px;margin:auto;background:#0A0F1A;color:#E8E0D0;padding:30px;border-radius:12px;"><h1 style="color:#C9A96E;text-align:center;">✦ Syria Travel</h1><p>Dear {{name}},</p><p>Payment received successfully!</p><p><strong>Amount:</strong> ${{amount}}<br><strong>Method:</strong> {{method}}<br><strong>Booking Ref:</strong> {{ref}}</p></div>',
      '<div style="font-family:Arial;max-width:600px;margin:auto;background:#0A0F1A;color:#E8E0D0;padding:30px;border-radius:12px;"><h1 style="color:#C9A96E;text-align:center;">✦ Syria Travel</h1><p>عزيزي {{name}}،</p><p>تم استلام الدفع بنجاح!</p><p><strong>المبلغ:</strong> ${{amount}}<br><strong>الطريقة:</strong> {{method}}<br><strong>مرجع الحجز:</strong> {{ref}}</p></div>'
    ],
    ['bank_transfer_received', 'Bank Transfer Received - Syria Travel', 'استلام تحويل بنكي - Syria Travel',
      '<p>Dear {{name}},</p><p>We received your bank transfer receipt. We will verify it shortly.</p>',
      '<p>عزيزي {{name}}،</p><p>تم استلام إيصال التحويل البنكي الخاص بك. سيتم التحقق منه قريباً.</p>'
    ]
  ];
  for (const [name, subject, subjectAr, body, bodyAr] of templates) {
    const existing = get("SELECT id FROM email_templates WHERE name = ?", [name]);
    if (!existing) run("INSERT INTO email_templates (name, subject, subject_ar, body, body_ar) VALUES (?, ?, ?, ?, ?)", [name, subject, subjectAr, body, bodyAr]);
  }
  const defaultCurrencies = [
    { code: 'USD', name: 'US Dollar', name_ar: 'دولار أمريكي', symbol: '$', rate: 1, def: 1 },
    { code: 'EUR', name: 'Euro', name_ar: 'يورو', symbol: '€', rate: 0.92, def: 0 },
    { code: 'GBP', name: 'British Pound', name_ar: 'جنيه إسترليني', symbol: '£', rate: 0.79, def: 0 },
    { code: 'QAR', name: 'Qatari Riyal', name_ar: 'ريال قطري', symbol: '﷼', rate: 3.64, def: 0 },
    { code: 'SAR', name: 'Saudi Riyal', name_ar: 'ريال سعودي', symbol: '﷼', rate: 3.75, def: 0 },
    { code: 'AED', name: 'UAE Dirham', name_ar: 'درهم إماراتي', symbol: 'د.إ', rate: 3.67, def: 0 },
  ];
  for (const c of defaultCurrencies) {
    const existing = get("SELECT id FROM currencies WHERE code = ?", [c.code]);
    if (!existing) run("INSERT INTO currencies (code, name, name_ar, symbol, exchange_rate, is_default) VALUES (?, ?, ?, ?, ?, ?)", [c.code, c.name, c.name_ar, c.symbol, c.rate, c.def]);
  }

  // Seed payment gateways
  const gateways = [
    { code: 'stripe', name: 'Stripe', name_ar: 'سترايب', provider: 'stripe', active: 1, fallback: 0, currencies: '["USD","EUR","GBP","AED","SAR"]', countries: '[]', priority: 1 },
    { code: 'paypal', name: 'PayPal', name_ar: 'باي بال', provider: 'paypal', active: 1, fallback: 1, currencies: '["USD","EUR","GBP"]', countries: '[]', priority: 2 },
    { code: 'bank_transfer', name: 'Bank Transfer', name_ar: 'تحويل بنكي', provider: 'manual', active: 1, fallback: 0, currencies: '["USD","EUR","GBP","QAR","SAR","AED"]', countries: '[]', priority: 3 },
    { code: 'cash', name: 'Cash on Arrival', name_ar: 'الدفع عند الوصول', provider: 'manual', active: 1, fallback: 0, currencies: '["USD","EUR","GBP","QAR","SAR","AED"]', countries: '["SY"]', priority: 4 },
    { code: 'agent', name: 'Agent Confirmation', name_ar: 'تأكيد وكيل', provider: 'manual', active: 1, fallback: 0, currencies: '["USD","EUR","GBP","QAR","SAR","AED"]', countries: '["SY"]', priority: 5 },
    { code: 'qpay', name: 'QPay (Qatar)', name_ar: 'كي باي (قطر)', provider: 'qpay', active: 1, fallback: 0, currencies: '["QAR"]', countries: '["QA"]', priority: 6 },
  ];
  for (const g of gateways) {
    const existing = get("SELECT id FROM payment_gateways WHERE code = ?", [g.code]);
    if (!existing) run("INSERT INTO payment_gateways (code, name, name_ar, provider, is_active, is_fallback, supported_currencies, supported_countries, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [g.code, g.name, g.name_ar, g.provider, g.active, g.fallback, g.currencies, g.countries, g.priority]);
  }

  // Seed payment methods
  const methods = [
    { code: 'visa', name: 'Visa', name_ar: 'فيزا', icon: '💳', provider: 'stripe', regions: '["international"]', currencies: '["USD","EUR","GBP","AED","SAR"]', instant: 1, sort: 1 },
    { code: 'mastercard', name: 'Mastercard', name_ar: 'ماستركارد', icon: '💳', provider: 'stripe', regions: '["international"]', currencies: '["USD","EUR","GBP","AED","SAR"]', instant: 1, sort: 2 },
    { code: 'apple_pay', name: 'Apple Pay', name_ar: 'أبل باي', icon: '🍎', provider: 'stripe', regions: '["international"]', currencies: '["USD","EUR","GBP"]', instant: 1, sort: 3 },
    { code: 'google_pay', name: 'Google Pay', name_ar: 'جوجل باي', icon: '💚', provider: 'stripe', regions: '["international"]', currencies: '["USD","EUR","GBP"]', instant: 1, sort: 4 },
    { code: 'bank_transfer', name: 'Bank Transfer', name_ar: 'تحويل بنكي', icon: '🏦', provider: 'bank_transfer', regions: '["all"]', currencies: '["USD","EUR","GBP","QAR","SAR","AED"]', instant: 0, manual: 1, sort: 5 },
    { code: 'cash_on_arrival', name: 'Cash on Arrival', name_ar: 'الدفع عند الوصول', icon: '💵', provider: 'cash', regions: '["syria"]', currencies: '["USD","EUR","GBP","QAR","SAR","AED"]', instant: 0, manual: 1, sort: 6 },
    { code: 'agent_payment', name: 'Agent Payment', name_ar: 'دفع وكيل', icon: '🤝', provider: 'agent', regions: '["syria"]', currencies: '["USD","EUR","GBP","QAR","SAR","AED"]', instant: 0, manual: 1, sort: 7 },
    { code: 'qpay', name: 'QPay', name_ar: 'كي باي', icon: '🇶🇦', provider: 'qpay', regions: '["qatar"]', currencies: '["QAR"]', instant: 1, sort: 8 },
    { code: 'deposit', name: 'Pay Deposit Now', name_ar: 'دفع عربون', icon: '💰', provider: 'stripe', regions: '["all"]', currencies: '["USD","EUR","GBP","QAR","SAR","AED"]', instant: 1, sort: 9 },
  ];
  for (const m of methods) {
    const existing = get("SELECT id FROM payment_methods WHERE code = ?", [m.code]);
    if (!existing) run("INSERT INTO payment_methods (code, name, name_ar, icon, provider_code, regions, supported_currencies, is_instant, needs_manual_approval, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [m.code, m.name, m.name_ar, m.icon, m.provider, m.regions, m.currencies, m.instant || 0, m.manual || 0, m.sort]);
  }

  // Seed reward tiers
  const tiers = [
    ['Bronze', 'برونزي', 0, 0, '🥉'],
    ['Silver', 'فضي', 100, 5, '🥈'],
    ['Gold', 'ذهبي', 500, 10, '🥇'],
    ['Platinum', 'بلاتيني', 2000, 15, '💎'],
  ];
  for (const [name, nameAr, minPts, disc, badge] of tiers) {
    const existing = get("SELECT id FROM reward_tiers WHERE name = ?", [name]);
    if (!existing) run("INSERT INTO reward_tiers (name, name_ar, min_points, discount_percent, badge) VALUES (?, ?, ?, ?, ?)", [name, nameAr, minPts, disc, badge]);
  }

  // Seed coupons
  const coupons = [
    ['WELCOME10', 'Welcome 10% Off', 'خصم 10% للترحيب', 10, 'percent', 100, 1, '2026-12-31', 0],
    ['SUMMER25', 'Summer Sale 25%', 'تخفيض الصيف 25%', 25, 'percent', 200, 1, '2026-09-30', 0],
    ['SAVE50', 'Save $50', 'وفر 50 دولار', 50, 'fixed', 300, 1, '2026-12-31', 0],
  ];
  for (const [code, name, nameAr, value, type, minTotal, active, expiresAt, usageLimit] of coupons) {
    const existing = get("SELECT id FROM coupons WHERE code = ?", [code]);
    if (!existing) run("INSERT INTO coupons (code, name, name_ar, value, type, min_total, active, expires_at, usage_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [code, name, nameAr, value, type, minTotal, active, expiresAt, usageLimit]);
  }

  // Seed blacklist admin
  const blAdmin = get("SELECT id FROM blacklist WHERE type = 'system'");
  if (!blAdmin) run("INSERT INTO blacklist (type, value, reason) VALUES ('system', 'init', 'System initialization')");
}

function save() {
  fs.writeFileSync(DB_PATH, Buffer.from(dbInstance.export()));
}

function all(sql, params = []) {
  if (!dbInstance) throw new Error('Database not initialized');
  if (params.length > 0) {
    const stmt = dbInstance.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      const row = {};
      cols.forEach((c, i) => row[c] = vals[i]);
      rows.push(row);
    }
    stmt.free();
    return rows;
  }
  const execResult = dbInstance.exec(sql);
  if (!execResult || execResult.length === 0) return [];
  const cols = execResult[0].columns;
  return execResult[0].values.map(vals => {
    const row = {};
    cols.forEach((c, i) => row[c] = vals[i]);
    return row;
  });
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  save();
  const lastIdRows = dbInstance.exec("SELECT last_insert_rowid() as id");
  const lastInsertRowid = lastIdRows && lastIdRows[0] ? lastIdRows[0].values[0][0] : null;
  return { lastInsertRowid };
}

function backup() {
  const data = dbInstance.export();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath);
  const filePath = path.join(backupPath, `backup-${timestamp}.sqlite`);
  fs.writeFileSync(filePath, Buffer.from(data));
  return filePath;
}

function restore(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('Backup file not found');
  const buffer = fs.readFileSync(filePath);
  dbInstance = new SQL.Database(buffer);
  save();
}

function addNotification(adminId, type, title, message, data = {}) {
  return run(`INSERT INTO notifications (admin_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)`,
    [adminId, type, title, message, JSON.stringify(data)]);
}

function getMissedNotifications(adminId, sinceId = 0) {
  return all("SELECT * FROM notifications WHERE admin_id = ? AND id > ? ORDER BY id DESC LIMIT 50", [adminId, sinceId]);
}

function markNotificationRead(notifId) {
  return run("UPDATE notifications SET read_status = 1 WHERE id = ?", [notifId]);
}

function markAllNotificationsRead(adminId) {
  return run("UPDATE notifications SET read_status = 1 WHERE admin_id = ? AND read_status = 0", [adminId]);
}

function countUnreadNotifications(adminId) {
  const r = get("SELECT COUNT(*) as cnt FROM notifications WHERE admin_id = ? AND read_status = 0", [adminId]);
  return r ? r.cnt : 0;
}

function logActivity(userId, userName, action, details = '', ip = '') {
  try {
    run("INSERT INTO activity_logs (user_id, user_name, action, details, ip_address) VALUES (?, ?, ?, ?, ?)",
      [userId, userName, action, details, ip]);
  } catch (e) {}
}

module.exports = { init, all, get, run, backup, restore, logActivity, addNotification, getMissedNotifications, markNotificationRead, markAllNotificationsRead, countUnreadNotifications };
