# BigD - Deployment Guide

## 🚀 Deploying Your Application

Your app currently runs on localhost only. To make it accessible to other users:

### Option 1: Quick Deploy (Recommended)

#### Frontend (Vercel - Free)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set build settings:
   - Framework: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api/v1
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

#### Backend (Render - Free)
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build settings:
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add ALL environment variables from `server/.env.production`
6. Add services:
   - **Neo4j Aura** (free tier): https://console.neo4j.io
   - **Upstash Redis** (free tier): https://upstash.com

### Option 2: Other Platforms

#### Frontend Options
- **Netlify**: Similar to Vercel
- **GitHub Pages**: Static hosting only
- **Cloudflare Pages**: Free with good performance

#### Backend Options
- **Railway**: Easy deployment
- **Fly.io**: Global deployment
- **Heroku**: Classic PaaS (paid)
- **AWS/GCP/Azure**: Full control (complex)

## 🔧 Required Configurations

### 1. Update Google OAuth Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   https://your-app.netlify.app
   ```
4. Add **Authorized redirect URIs**:
   ```
   https://your-app.vercel.app/auth/google/callback
   ```

### 2. Set Up Cloud Databases

#### Neo4j Aura (Free)
1. Create account at https://console.neo4j.io
2. Create a free instance
3. Copy connection URI, username, password
4. Update in backend environment variables

#### Upstash Redis (Free)
1. Create account at https://upstash.com
2. Create a Redis database
3. Copy the Redis URL
4. Update in backend environment variables

### 3. Update Environment Variables

After deploying, update:

**Frontend (.env.production):**
```env
VITE_API_URL=https://your-actual-backend-url.onrender.com/api/v1
```

**Backend (in Render dashboard):**
```env
CORS_ORIGINS=["https://your-frontend.vercel.app"]
GOOGLE_CALLBACK_URL=https://your-frontend.vercel.app/auth/google/callback
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
REDIS_URL=redis://default:password@your-redis.upstash.io:6379
```

## 📝 Step-by-Step Deployment Checklist

- [ ] Push code to GitHub
- [ ] Sign up for Neo4j Aura and create database
- [ ] Sign up for Upstash and create Redis database
- [ ] Deploy backend to Render with all environment variables
- [ ] Deploy frontend to Vercel
- [ ] Update Google OAuth settings with production URLs
- [ ] Update frontend VITE_API_URL with backend URL
- [ ] Update backend CORS_ORIGINS with frontend URL
- [ ] Test authentication flow
- [ ] Share your app URL with others!

## 🔒 Security Notes

1. **Never commit** `.env` or `.env.production` files with real credentials
2. **Generate new secrets** for JWT_SECRET in production
3. **Use different passwords** for production databases
4. **Enable HTTPS** (automatic on Vercel/Render)
5. **Restrict API keys** to specific domains

## 💰 Free Tier Limits

- **Vercel**: 100GB bandwidth/month
- **Render**: 750 hours/month (always-on), spins down after inactivity
- **Neo4j Aura**: 50MB storage, 1 database
- **Upstash Redis**: 10K commands/day

## 🆘 Troubleshooting

### "CORS Error"
Update `CORS_ORIGINS` in backend environment variables

### "Google OAuth Not Working"
Add production URL to Google Cloud Console authorized origins

### "Database Connection Failed"
Check Neo4j and Redis connection strings in environment variables

### "Server Not Responding"
Render free tier spins down after 15 min inactivity - first request wakes it up (takes ~30 seconds)

## 🌐 Access Your App

Once deployed:
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-backend.onrender.com/api/v1`

Share the frontend URL with others to let them use your app!
