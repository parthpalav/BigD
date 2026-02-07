# 🚀 Firebase Deployment Guide for OrionMaps.xyz

## Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project: `orion-81736` (already configured)
- Custom domain: `orionmaps.xyz`

## 📋 Deployment Strategy

Since Firebase Functions has limitations for complex backends, we'll use a **hybrid approach**:

### Frontend: Firebase Hosting (with custom domain)
- Fast global CDN
- Free SSL certificate
- Custom domain support
- Perfect for React/Vite apps

### Backend: Choose one option:

**Option A: Render (Recommended - Free Tier)**
- Deploy backend separately to Render
- Use subdomain: `api.orionmaps.xyz` → Render backend
- Better for complex backends with Neo4j + Redis

**Option B: Firebase Functions**
- Serverless functions
- Limited to 540s execution time
- May need workarounds for Neo4j connections

## 🎯 Step-by-Step Deployment

### Step 1: Install Firebase CLI

\`\`\`bash
npm install -g firebase-tools
firebase login
\`\`\`

### Step 2: Build the Frontend

\`\`\`bash
cd client
npm run build
cd ..
\`\`\`

### Step 3: Deploy Frontend to Firebase

\`\`\`bash
firebase deploy --only hosting
\`\`\`

This deploys to: `https://orion-81736.web.app`

### Step 4: Connect Custom Domain

1. **In Firebase Console:**
   - Go to https://console.firebase.google.com/project/orion-81736/hosting
   - Click "Add custom domain"
   - Enter: `orionmaps.xyz`
   - Follow the verification steps

2. **In your Domain Registrar (where you bought orionmaps.xyz):**
   
   Add these DNS records:
   
   **For root domain (orionmaps.xyz):**
   \`\`\`
   Type: A
   Name: @
   Value: 151.101.1.195
   
   Type: A
   Name: @
   Value: 151.101.65.195
   \`\`\`
   
   **For www subdomain:**
   \`\`\`
   Type: CNAME
   Name: www
   Value: orion-81736.web.app
   \`\`\`

3. **Wait for DNS propagation** (can take 24-48 hours)
   - Check status: `nslookup orionmaps.xyz`

4. **Firebase auto-provisions SSL certificate** (free HTTPS)

### Step 5: Deploy Backend (Recommended: Render)

#### 5a. Sign up for Cloud Services

**Neo4j Aura (Free):**
1. Go to https://console.neo4j.io
2. Create free instance
3. Note down: URI, username, password

**Upstash Redis (Free):**
1. Go to https://upstash.com
2. Create Redis database
3. Copy Redis URL

#### 5b. Deploy to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo: `parthpalav/BigD`
4. Configure:
   - **Name:** `orionmaps-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

5. Add environment variables (copy from `server/.env`):
   \`\`\`env
   NODE_ENV=production
   PORT=3000
   
   # CORS - Add your domain
   CORS_ORIGINS=["https://orionmaps.xyz","https://www.orionmaps.xyz"]
   
   # Neo4j Aura
   NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_aura_password
   
   # Upstash Redis
   REDIS_URL=redis://default:xxxxx@xxxxx.upstash.io:6379
   
   # JWT
   JWT_SECRET=your-production-secret-change-this
   JWT_EXPIRES_IN=7d
   
   # Google OAuth - Get from Google Cloud Console
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_CALLBACK_URL=https://orionmaps.xyz/auth/google/callback
   
   # Copy other API keys from server/.env (DO NOT commit real values)
   FEATHERLESS_API_KEY=your_featherless_api_key
   FIREBASE_PROJECT_ID=orion-81736
   # etc.
   \`\`\`

6. Click "Create Web Service"

7. After deployment, you'll get a URL like:
   `https://orionmaps-api.onrender.com`

#### 5c. Set up Custom Subdomain (Optional)

In your domain registrar, add:
\`\`\`
Type: CNAME
Name: api
Value: orionmaps-api.onrender.com
\`\`\`

Then configure custom domain in Render dashboard.

### Step 6: Update Frontend API URL

Update `client/.env.production`:
\`\`\`env
VITE_API_URL=https://orionmaps-api.onrender.com/api/v1
# or if using custom subdomain:
# VITE_API_URL=https://api.orionmaps.xyz/api/v1
\`\`\`

Rebuild and redeploy frontend:
\`\`\`bash
cd client
npm run build
cd ..
firebase deploy --only hosting
\`\`\`

### Step 7: Configure Google OAuth

1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add **Authorized JavaScript origins:**
   \`\`\`
   https://orionmaps.xyz
   https://www.orionmaps.xyz
   \`\`\`
4. Add **Authorized redirect URIs:**
   \`\`\`
   https://orionmaps.xyz/auth/google/callback
   https://www.orionmaps.xyz/auth/google/callback
   \`\`\`
5. Save changes

### Step 8: Test Your Deployment

1. Visit `https://orionmaps.xyz`
2. Test signup/login
3. Test Google OAuth
4. Check all features work

## 🔧 Quick Deployment Commands

\`\`\`bash
# Build and deploy frontend
cd client && npm run build && cd .. && firebase deploy --only hosting

# View deployment logs
firebase hosting:channel:list

# Rollback if needed
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
\`\`\`

## 📊 DNS Configuration Summary

| Record Type | Name | Value | Purpose |
|------------|------|-------|---------|
| A | @ | 151.101.1.195 | Root domain |
| A | @ | 151.101.65.195 | Root domain (backup) |
| CNAME | www | orion-81736.web.app | www subdomain |
| CNAME | api | orionmaps-api.onrender.com | Backend API (optional) |

## 🔒 Security Checklist

- [ ] Generate new JWT_SECRET for production
- [ ] Use different Neo4j password than dev
- [ ] Restrict API keys to specific domains
- [ ] Enable CORS only for your domain
- [ ] Review Firebase security rules
- [ ] Enable rate limiting on backend
- [ ] Set up monitoring and alerts

## 🐛 Troubleshooting

### "Site not found" error
- Wait for DNS propagation (up to 48 hours)
- Check DNS records: `dig orionmaps.xyz`

### "CORS Error"
- Update CORS_ORIGINS in backend environment variables
- Include both `orionmaps.xyz` and `www.orionmaps.xyz`

### "OAuth not working"
- Update Google Cloud Console with production URLs
- Check GOOGLE_CALLBACK_URL matches your domain

### "Backend connection failed"
- Check VITE_API_URL in frontend .env.production
- Verify backend is deployed and running
- Check backend logs in Render dashboard

### "Database connection failed"
- Verify Neo4j Aura URI and credentials
- Check Upstash Redis URL
- Ensure databases are not sleeping (free tier limitations)

## 💰 Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Firebase Hosting | 10GB/month, 360MB/day | Free |
| Render Web Service | 750 hours/month | Free |
| Neo4j Aura | 50MB storage | Free |
| Upstash Redis | 10K commands/day | Free |
| Domain (orionmaps.xyz) | - | ~$12/year |
| **Total Monthly** | - | **~$1/month** |

## 📱 Mobile & Progressive Web App

Firebase Hosting automatically supports PWA. To enable:

1. Add to `client/public/manifest.json`
2. Configure service worker
3. Users can "Install" your app on mobile

## 🚀 Continuous Deployment

Set up GitHub Actions for automatic deployment:

\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd client && npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '\${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '\${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: orion-81736
\`\`\`

## 📞 Support

Your app will be live at:
- **Frontend:** https://orionmaps.xyz
- **Backend:** https://orionmaps-api.onrender.com/api/v1

Share the frontend URL with users worldwide! 🌍
