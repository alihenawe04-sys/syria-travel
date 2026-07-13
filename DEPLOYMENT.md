# Syria Travel - Deployment Guide

## Architecture

```
GitHub (source code)
  ├── Render (Backend - Node.js + SQLite + Socket.io)
  └── Vercel (Frontend - Static HTML/CSS/JS)
```

## Option A: Single Deployment (Simpler - Everything on Render)

Deploy the entire application on Render as a single web service.

### Steps

1. Push the project to GitHub

2. On Render Dashboard:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Name: `syria-travel`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: Free

3. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a strong random string
   - `CORS_ORIGIN`: `*`
   - `LOG_LEVEL`: `combined`

4. Add a Disk (for SQLite persistence):
   - Under "Disks" section, add a disk
   - Name: `data`
   - Mount Path: `/var/data`
   - Size: 1 GB
   - Update env vars:
     - `UPLOAD_DIR`: `/var/data/uploads`
     - `DB_PATH`: `/var/data/data.sqlite`
     - `DB_BACKUP_DIR`: `/var/data/backups`

5. Deploy and access at `https://syria-travel.onrender.com`

> **NOTE**: SQLite data persists as long as the disk exists. On Render's free plan, the service may spin down after inactivity. The disk persists across restarts but data could be lost if the disk is removed.

## Option B: Split Deployment (Frontend on Vercel + Backend on Render)

This option separates the frontend static files from the backend API.

### Step 1: Deploy Backend to Render

1. Push the project to GitHub

2. On Render Dashboard:
   - New Web Service → connect your GitHub repo
   - Name: `syria-travel-backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: Free

3. Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (generate a strong secret)
   - `CORS_ORIGIN`: `https://syria-travel.vercel.app`
   - `API_URL`: `https://syria-travel-backend.onrender.com`
   - `LOG_LEVEL`: `combined`

4. Add Disk (for SQLite persistence):
   - Disk Name: `data`
   - Mount Path: `/var/data`
   - Size: 1 GB
   - Set: `UPLOAD_DIR=/var/data/uploads`
   - Set: `DB_PATH=/var/data/data.sqlite`

5. Deploy and note the URL: `https://syria-travel-backend.onrender.com`

### Step 2: Deploy Frontend to Vercel

1. On Vercel Dashboard:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Framework Preset: **Other**
   - Root Directory: `./` (leave as is)
   - Build Command: (leave empty)
   - Output Directory: `.` (the current directory)
   - Install Command: (leave empty)

2. No environment variables needed for the static site.

3. Deploy. Vercel will serve `index.html`, `admin.html`, etc. as static files.

4. Configure API URL:
   - After deployment, the frontend needs to know the backend URL.
   - Open `index.html`, `admin.html`, `super-admin.html` and all payment HTML files
   - Edit the meta tag: `<meta name="api-url" content="">`
   - Change to: `<meta name="api-url" content="https://syria-travel-backend.onrender.com">`
   - Or set via localStorage (run in browser console):
     ```javascript
     localStorage.setItem('syria_api_url', 'https://syria-travel-backend.onrender.com');
     ```

5. Your frontend URL: `https://syria-travel.vercel.app`

### Step 3: Configure CORS on Backend

Update the `CORS_ORIGIN` environment variable on Render to include your Vercel domain:
```
CORS_ORIGIN=https://syria-travel.vercel.app
```
If using custom domain, comma-separate: `https://syria-travel.vercel.app,https://www.yourdomain.com`

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | `production` or `development` |
| `JWT_SECRET` | **YES** | - | Strong random string |
| `JWT_ADMIN_EXPIRES_IN` | No | `24h` | Admin token expiry |
| `JWT_USER_EXPIRES_IN` | No | `7d` | User token expiry |
| `CORS_ORIGIN` | No | `*` | Allowed origins (`*` or comma-separated) |
| `UPLOAD_DIR` | No | `public/uploads` | Upload directory path |
| `UPLOAD_MAX_FILE_SIZE` | No | `5242880` | Max file size (bytes) |
| `DB_PATH` | No | `data.sqlite` | SQLite database path |
| `DB_BACKUP_DIR` | No | `backups` | Backup directory |
| `API_URL` | No | `` | Backend URL (for split deployment) |
| `APP_URL` | No | `` | Frontend URL |
| `LOG_LEVEL` | No | `dev` | Morgan log format |
| `SMTP_HOST` | No | - | SMTP server |
| `SMTP_PORT` | No | `587` | SMTP port |

## Generate JWT Secret

Run this command to generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## SQLite on Render - Important Notes

- **Free plan**: Service spins down after 15 minutes of inactivity. Data persists but the first request after spin-down may take 30-60 seconds.
- **Disk persistence**: With a mounted disk, SQLite data survives restarts. Without a disk, data is LOST on every deploy/restart.
- **Backup**: Use the admin panel backup feature regularly. Backups are stored in the `backups/` directory.
- **Migration to PostgreSQL**: The database layer (`db.js`) uses simple SQL queries. To migrate, replace the `all`, `get`, `run` functions with a PostgreSQL client. The table schemas in `db.js` can be adapted to PostgreSQL with minor syntax changes.

## Production Checklist

- [ ] Generate a strong JWT_SECRET
- [ ] Set CORS_ORIGIN to your frontend domain
- [ ] Configure SMTP in admin panel (or via env vars)
- [ ] Enable rate limiting (default: 200 requests/15min per IP)
- [ ] Set up regular database backups
- [ ] Configure a custom domain with SSL
- [ ] Test all payment methods
- [ ] Test PDF invoice generation
- [ ] Test email sending
- [ ] Test Socket.io notifications
- [ ] Test file uploads
- [ ] Verify service worker registration
- [ ] Check security headers with curl or browser dev tools

## Rollback Strategy

### If deployment fails:
1. Revert the last commit: `git revert HEAD`
2. Push the revert: `git push origin main`
3. Render and Vercel will auto-deploy the reverted version

### If the database is corrupted:
1. Use a backup: Set `DB_PATH` to point to a backup file
2. Or restore via the admin panel backup feature

### If the frontend has issues:
1. Check Vercel deployment logs
2. Verify `API_BASE` is set correctly (meta tag or localStorage)
3. Check browser console for cross-origin errors
4. Verify CORS is configured correctly on Render

## Monitoring

- **Render**: Dashboard shows logs, CPU, memory usage; uptime monitoring
- **Vercel**: Analytics dashboard, deployment logs
- **Application**: Built-in health check at `/api/health`

## File Upload Storage

Uploaded files are stored in `UPLOAD_DIR` (default: `public/uploads/`).

**Warning**: On Render's free tier, uploaded files are stored on the ephemeral filesystem. They will be lost if:
- The service is redeployed
- The disk is removed
- You switch to the free tier without a disk

For production, consider using external storage:
- Cloudinary (for images)
- AWS S3
- DigitalOcean Spaces
- Backblaze B2

The upload system in `server.js` can be extended to upload to external services.

## Support

For issues:
1. Check Render logs
2. Check Vercel logs
3. Test with `/api/health` endpoint
4. Verify environment variables
