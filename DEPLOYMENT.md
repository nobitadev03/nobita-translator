# Deployment Guide - TikTok & Douyin Video Translator

This guide will help you deploy the application to production.

## Prerequisites

Before deploying, ensure you have:
- ✅ FFmpeg installed on the deployment server
- ✅ Python 3.8+ with edge-tts installed
- ✅ Node.js 18+ installed
- ✅ (Optional) API keys for OpenAI or AssemblyAI

## Deployment Options

### Option 1: Deploy to Railway (Recommended for Backend)

Railway provides easy deployment with automatic FFmpeg installation.

#### Backend Deployment

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Build Settings**
   - Root directory: `server`
   - Build command: `npm install && pip install edge-tts`
   - Start command: `npm start`

4. **Add Environment Variables**
   ```
   PORT=3001
   NODE_ENV=production
   OPENAI_API_KEY=your_key_here (optional)
   ASSEMBLYAI_API_KEY=your_key_here (optional)
   ```

5. **Install FFmpeg**
   - Railway includes FFmpeg by default in most environments
   - If not, add to `nixpacks.toml`:
   ```toml
   [phases.setup]
   aptPkgs = ['ffmpeg']
   ```

6. **Deploy**
   - Railway will automatically deploy
   - Note your deployment URL (e.g., `https://your-app.railway.app`)

#### Frontend Deployment to Vercel

1. **Update API URL**
   - Edit `src/api/client.ts`
   - Change `API_BASE_URL` to your Railway backend URL:
   ```typescript
   const API_BASE_URL = 'https://your-backend.railway.app/api';
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Configure Vercel**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

---

### Option 2: Deploy to Render

#### Backend on Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Configure:
     - Name: `tiktok-translator-api`
     - Environment: `Node`
     - Build command: `cd server && npm install && pip install edge-tts`
     - Start command: `cd server && npm start`

3. **Add Environment Variables**
   - Add the same variables as Railway

4. **Deploy**
   - Render will build and deploy automatically

#### Frontend on Netlify

1. **Update API URL** (same as Vercel)

2. **Deploy to Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Configure**
   - Build command: `npm run build`
   - Publish directory: `dist`

---

### Option 3: Self-Hosted (VPS/Cloud Server)

#### Requirements
- Ubuntu 20.04+ or similar Linux distribution
- 2GB+ RAM
- 20GB+ storage

#### Installation Steps

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install FFmpeg
   sudo apt install -y ffmpeg

   # Install Python and pip
   sudo apt install -y python3 python3-pip

   # Install edge-tts
   pip3 install edge-tts

   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Clone and Setup**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd douyin-ai-translator

   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure Environment**
   ```bash
   # Create .env file in server directory
   cd server
   nano .env
   ```
   Add your configuration:
   ```env
   PORT=3001
   NODE_ENV=production
   OPENAI_API_KEY=your_key_here
   ```

4. **Build Frontend**
   ```bash
   cd ..
   npm run build
   ```

5. **Setup Nginx**
   ```bash
   sudo apt install -y nginx

   # Create Nginx config
   sudo nano /etc/nginx/sites-available/video-translator
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           root /path/to/douyin-ai-translator/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Static files (videos)
       location /output {
           proxy_pass http://localhost:3001;
       }

       location /uploads {
           proxy_pass http://localhost:3001;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/video-translator /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Start Backend with PM2**
   ```bash
   cd server
   pm2 start index.js --name video-translator-api
   pm2 save
   pm2 startup
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Environment Variables Reference

### Backend (.env in server directory)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `3001` |
| `NODE_ENV` | No | Environment | `production` |
| `OPENAI_API_KEY` | No | OpenAI API key for Whisper | `sk-...` |
| `ASSEMBLYAI_API_KEY` | No | AssemblyAI API key | `...` |

### Frontend (for production builds)

Update `src/api/client.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

Then set in Vercel/Netlify:
```
VITE_API_URL=https://your-backend.railway.app/api
```

---

## Post-Deployment Checklist

- [ ] Test video download from TikTok
- [ ] Test video download from Douyin
- [ ] Test translation (Vietnamese → English)
- [ ] Test translation (English → Japanese)
- [ ] Verify voice dubbing quality
- [ ] Check video download functionality
- [ ] Monitor server logs for errors
- [ ] Setup monitoring (optional: UptimeRobot, Sentry)
- [ ] Configure CORS if needed
- [ ] Setup rate limiting for API endpoints

---

## Troubleshooting

### FFmpeg not found on deployment
- Add FFmpeg to your deployment configuration
- For Railway: Add `nixpacks.toml` with FFmpeg
- For Render: Use Docker with FFmpeg pre-installed
- For VPS: `sudo apt install ffmpeg`

### Edge TTS not working
- Ensure Python 3.8+ is installed
- Install with: `pip install edge-tts`
- Verify with: `edge-tts --list-voices`

### CORS errors
- Update backend CORS configuration in `server/index.js`
- Add your frontend domain to allowed origins

### Out of memory errors
- Increase server RAM (minimum 2GB recommended)
- Limit concurrent video processing
- Add file size limits

### Video processing timeout
- Increase timeout limits in your hosting platform
- For long videos, consider implementing a queue system

---

## Monitoring & Maintenance

### Logs
- **Railway**: View logs in dashboard
- **Render**: View logs in dashboard
- **VPS**: `pm2 logs video-translator-api`

### Updates
```bash
git pull origin main
npm install
cd server && npm install
npm run build
pm2 restart video-translator-api
```

### Backup
- Regularly backup uploaded videos if needed
- Backup environment variables
- Keep database backups if you add one

---

## Cost Estimation

### Free Tier (Recommended for Testing)
- **Frontend**: Vercel/Netlify (Free)
- **Backend**: Railway ($5/month with free trial)
- **APIs**: Free services (TikWM, MyMemory, Edge TTS)
- **Total**: ~$5/month

### Production Tier
- **Frontend**: Vercel Pro ($20/month)
- **Backend**: Railway Pro ($20/month)
- **APIs**: OpenAI Whisper (~$0.006/minute)
- **Total**: ~$40-60/month depending on usage

---

## Support

For issues or questions:
1. Check the main README.md
2. Review server logs
3. Test API endpoints directly
4. Check FFmpeg installation

Good luck with your deployment! 🚀
