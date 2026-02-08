# Render Environment Variable Setup

## ⚠️ URGENT: Add Missing Environment Variable

Your backend is deployed on Render but the Featherless AI endpoints are not working because the API key is missing.

### Steps to Fix:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Navigate to your `orionmaps-api` service

2. **Add Environment Variable**
   - Click on "Environment" in the left sidebar
   - Click "Add Environment Variable"
   - Add the following:

   ```
   Key: FEATHERLESS_API_KEY
   Value: rc_1598a55c54bfef6a39d2e9d3252c2d0c65c3ebcad259748dffafd8cd30f7748f
   ```

3. **Save and Deploy**
   - Click "Save Changes"
   - Render will automatically redeploy your service
   - Wait ~2-3 minutes for the deployment to complete

### Verify It's Working:

After deployment completes, test the endpoints:

```bash
# Test Chat/Assistant
curl -X POST https://orionmaps-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is traffic like in Mumbai?"}' | jq .

# Test News
curl https://orionmaps-api.onrender.com/api/news | jq .
```

Both should return `"success": true` with data.

### Your App URLs:
- **Frontend**: https://orion-81736.web.app
- **Backend API**: https://orionmaps-api.onrender.com
- **API Docs**: https://orionmaps-api.onrender.com/health

---

## All Environment Variables That Should Be Set on Render:

Make sure these are all configured (from render.yaml):

✅ Already set automatically:
- NODE_ENV=production
- PORT=3000
- CORS_ORIGINS

⚠️ Need to be set manually (sync: false in render.yaml):
- **FEATHERLESS_API_KEY** ← THIS ONE IS MISSING!
- SECRET_KEY
- JWT_SECRET
- NEO4J_URI
- NEO4J_PASSWORD
- REDIS_URL (if using Redis)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

### Quick Reference Values:

```bash
# From your local .env file:
FEATHERLESS_API_KEY=rc_1598a55c54bfef6a39d2e9d3252c2d0c65c3ebcad259748dffafd8cd30f7748f
```

To get other values, check your local `/Users/arnav/Desktop/BigD/.env` or `/Users/arnav/Desktop/BigD/server/.env` files.
