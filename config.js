require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',

  jwt: {
    secret: process.env.JWT_SECRET,
    adminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '24h',
    userExpiresIn: process.env.JWT_USER_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'public/uploads',
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 20,
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@syria-travel.com',
    fromName: process.env.SMTP_FROM_NAME || 'Syria Travel',
  },

  db: {
    path: process.env.DB_PATH || 'data.sqlite',
    backupDir: process.env.DB_BACKUP_DIR || 'backups',
  },

  appUrl: process.env.APP_URL || '',
  apiUrl: process.env.API_URL || '',
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'combined' : 'dev'),
};

function validate() {
  const errors = [];
  if (!config.jwt.secret) errors.push('JWT_SECRET is required');
  if (config.jwt.secret === 'syria-travel-secret-key-2026' && config.isProd) {
    console.warn('WARNING: Using default JWT_SECRET in production. Generate a strong random secret.');
  }
  if (config.isProd && config.cors.origin === '*') {
    console.warn('WARNING: CORS_ORIGIN is set to "*" in production. Set it to your frontend domain.');
  }
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    if (config.isProd) process.exit(1);
  }
}

validate();

module.exports = config;
