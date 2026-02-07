# 🎯 Quick Start Checklist

## Prerequisites
- ✅ Node.js installed (v16+)
- ✅ Neo4j installed and running (bolt://localhost:7687)
- ✅ Git repository cleaned (Firebase credentials removed)

## Step-by-Step Setup

### 1. Get Google OAuth Credentials (15 minutes)
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create/select project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 Client ID
- [ ] Add authorized origins: `http://localhost:5173`, `http://localhost:3000`
- [ ] Add redirect URI: `http://localhost:5173/auth/google/callback`
- [ ] Copy Client ID and Client Secret

### 2. Configure Backend Environment (5 minutes)
Create `server/.env`:
```env
PORT=3000
NODE_ENV=development

NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=BigData2025

JWT_SECRET=change-this-to-a-secure-random-32-character-string
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=paste-your-client-id-here
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5173/auth/google/callback
```

### 3. Configure Frontend Environment (2 minutes)
Create `client/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=paste-your-client-id-here
```

### 4. Start Backend (2 minutes)
```bash
cd server
npm install  # if not already done
npm run dev
```

Should see:
```
✅ Neo4j connected successfully
🚀 Server running on port 3000
```

### 5. Start Frontend (2 minutes)
```bash
cd client
npm install  # if not already done
npm run dev
```

Should see:
```
  VITE v... ready in ...ms
  ➜  Local:   http://localhost:5173/
```

### 6. Test Authentication (5 minutes)
- [ ] Open `http://localhost:5173`
- [ ] Should redirect to `/login`
- [ ] Test email registration:
  - Email: `test@example.com`
  - Password: `test123456`
  - Full Name: `Test User`
- [ ] Click "Sign Up"
- [ ] Should redirect to main app (authenticated)
- [ ] Refresh page - should stay authenticated
- [ ] Test Google Sign-In button
- [ ] Try logging out (if UI has logout button)

### 7. Verify API Endpoints (Optional - 5 minutes)
Test with curl or Postman:

**Register:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"test123456","fullName":"Test User 2"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"test123456"}'
```

**Get Profile (use token from login):**
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Git Repository (5 minutes)
- [ ] Verify `.env` files are in `.gitignore`
- [ ] Force push cleaned history: `git push origin main --force`
- [ ] **IMPORTANT:** Rotate Firebase credentials (they were briefly exposed)

## Troubleshooting

### Google Sign-In button not showing
- Check browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set in `client/.env`
- Ensure `http://localhost:5173` is in authorized JavaScript origins

### "CORS error" in browser
- Backend CORS is configured for localhost:5173 and localhost:3000
- Check both servers are running on correct ports
- Verify no typos in API URLs

### "Database connection failed"
- Check Neo4j is running: `neo4j status`
- Start Neo4j: `neo4j start`
- Verify credentials in `server/.env`
- Default: user=neo4j, pass=neo4j (first time) or BigData2025

### "Invalid token" errors
- Token expired (7 day default)
- User should login again
- Check JWT_SECRET in `server/.env`

### TypeScript errors
- Run `npm install` in both client and server
- Restart VS Code TypeScript server: Cmd+Shift+P → "TypeScript: Restart TS Server"

## Files Created/Modified

### Backend
- ✅ `server/src/middleware/auth.middleware.ts` - JWT authentication
- ✅ `server/src/routes/auth.routes.ts` - Auth endpoints
- ✅ `server/src/repositories/user.repository.ts` - Updated with OAuth fields
- ✅ `server/src/server.ts` - Added auth routes
- ✅ `server/.env.example` - Environment template

### Frontend
- ✅ `client/src/contexts/AuthContext.tsx` - Global auth state
- ✅ `client/src/pages/Login.tsx` - Login/register UI
- ✅ `client/src/components/ProtectedRoute.tsx` - Route protection
- ✅ `client/src/utils/errorHandler.ts` - Error handling utility
- ✅ `client/src/main.tsx` - Added AuthProvider and routes
- ✅ `client/.env.example` - Environment template

### Documentation
- ✅ `AUTHENTICATION.md` - Complete guide
- ✅ `SETUP_SUMMARY.md` - Implementation summary
- ✅ `QUICKSTART.md` - This checklist

## Next Steps After Setup

1. **Test thoroughly**: Try all auth methods (email, Google)
2. **Add UI elements**: Logout button, user profile display
3. **Protect other routes**: Wrap more routes with `<ProtectedRoute>`
4. **Add loading states**: Show spinners during auth operations
5. **Implement features**: User profile page, settings, etc.
6. **Production prep**: Change JWT_SECRET, update CORS, enable HTTPS

## Documentation
- **Full Setup**: See `AUTHENTICATION.md`
- **API Reference**: See `AUTHENTICATION.md` → API Endpoints
- **Troubleshooting**: See `AUTHENTICATION.md` → Troubleshooting

## Estimated Total Time: ~35 minutes

Most time is spent getting Google OAuth credentials (15 min).
The rest is mostly configuration and testing.

---

✅ **Ready to go!** Your authentication system is complete and production-ready (with proper configuration).
