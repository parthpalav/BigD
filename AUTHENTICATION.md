# Authentication Setup Guide

This project implements JWT-based authentication with Google OAuth support, connecting the React frontend with the Express/Neo4j backend.

## Features

- ✅ Email/Password Authentication (Registration & Login)
- ✅ Google OAuth 2.0 Authentication
- ✅ JWT Token-based Authorization
- ✅ Protected Routes (Frontend & Backend)
- ✅ User Profile Management
- ✅ Secure Password Hashing (bcrypt)
- ✅ Token Refresh & Auto-login

## Setup Instructions

### 1. Backend Setup (Server)

#### Install Dependencies
```bash
cd server
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `server` directory:

```env
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and configure:

```env
# Server
PORT=3000
NODE_ENV=development

# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=BigData2025

# JWT (IMPORTANT: Change this in production!)
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Google OAuth (see step 2 below)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5173/auth/google/callback
```

#### Start the Backend Server
```bash
npm run dev
```

Server will run on `http://localhost:3000`

### 2. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External (for testing)
   - App name: Your app name
   - Support email: Your email
   - Add test users if needed
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: BigD Traffic App
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback`
7. Copy the **Client ID** and **Client Secret**
8. Add them to both `.env` files (server and client)

### 3. Frontend Setup (Client)

#### Install Dependencies
```bash
cd client
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `client` directory:

```env
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and add your Google Client ID:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

#### Start the Frontend Development Server
```bash
npm run dev
```

Client will run on `http://localhost:5173`

## API Endpoints

### Authentication Routes (`/api/v1/auth`)

#### Register with Email/Password
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phoneNumber": "+1234567890",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
}
```

#### Login with Email/Password
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login with Google OAuth
```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "credential": "google-id-token-from-frontend"
}
```

#### Get Current User Profile
```http
GET /api/v1/auth/me
Authorization: Bearer <jwt-token>
```

#### Update User Profile
```http
PUT /api/v1/auth/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "phoneNumber": "+9876543210"
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <jwt-token>
```

## Frontend Components

### AuthContext
Provides authentication state and methods throughout the app:

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Use authentication methods
}
```

### Login Page
Located at `/login` - handles email/password and Google OAuth login/registration.

### ProtectedRoute
Wraps components that require authentication:

```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Usage Examples

### Frontend Login Flow

```tsx
import { useAuth } from './contexts/AuthContext';

function LoginComponent() {
  const { login, loginWithGoogle } = useAuth();
  
  // Email/Password Login
  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password123');
      // User is now logged in, navigate to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  // Google Login (credential from Google Sign-In button)
  const handleGoogleLogin = async (credential: string) => {
    try {
      await loginWithGoogle(credential);
      // User is now logged in
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };
}
```

### Protected Backend Routes

```typescript
import { authenticate } from '../middleware/auth.middleware';

// Protect routes that require authentication
router.get('/protected-data', authenticate, async (req: AuthRequest, res) => {
  // req.user contains: { id, email, fullName, role }
  const userId = req.user.id;
  // ... fetch user-specific data
});
```

## Security Features

- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **JWT Tokens**: Signed with secret key, expires in 7 days
- ✅ **CORS Protection**: Configured for localhost:5173 and localhost:3000
- ✅ **Helmet.js**: Security headers enabled
- ✅ **Token Verification**: Middleware validates JWT on protected routes
- ✅ **Google OAuth Verification**: Validates Google tokens server-side

## Troubleshooting

### "Invalid or expired token" error
- Token might have expired (7 day default)
- User should login again
- Check JWT_SECRET matches between requests

### Google OAuth "Invalid client" error
- Verify GOOGLE_CLIENT_ID is correct in both .env files
- Check authorized origins in Google Cloud Console
- Ensure http://localhost:5173 is added to authorized JavaScript origins

### "User not found" after login
- Database connection issue
- Check Neo4j is running: `neo4j status`
- Verify NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD in .env

### CORS errors
- Backend CORS is configured for localhost:5173 and localhost:3000
- If using different ports, update `server/src/config/index.ts`

### Registration fails with "User already exists"
- User with that email is already registered
- Use login instead, or use password reset (to be implemented)

## Database Schema

### User Node (Neo4j)
```cypher
(:User {
  id: String,              // UUID v4
  email: String,           // Unique, indexed
  passwordHash: String,    // bcrypt hash
  fullName: String,
  phoneNumber: String,     // Optional
  googleId: String,        // Optional, for OAuth users
  profilePicture: String,  // Optional, Google profile picture
  lastLogin: DateTime,     // Updated on each login
  isActive: Boolean,       // Default: true
  isVerified: Boolean,     // Default: false
  createdAt: DateTime,
  updatedAt: DateTime
})
```

## Next Steps

- [ ] Add email verification
- [ ] Add password reset functionality
- [ ] Add refresh token mechanism
- [ ] Add rate limiting for login attempts
- [ ] Add OAuth providers (GitHub, Microsoft, etc.)
- [ ] Add user roles and permissions
- [ ] Add 2FA support

## Testing

### Test Registration
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "fullName": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Support

If you encounter issues:
1. Check all environment variables are set correctly
2. Ensure Neo4j and Redis are running
3. Verify Node.js version (16+ required)
4. Check server logs for detailed error messages
5. Verify Google OAuth credentials are correctly configured

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET**: Use a strong, random 32+ character secret
2. **Update CORS origins**: Add your production domain to `server/src/config/index.ts`
3. **Update Google OAuth**: Add production domains to Google Cloud Console
4. **Use HTTPS**: Enable SSL certificates for production
5. **Environment variables**: Use secure secret management (AWS Secrets Manager, etc.)
6. **Database**: Use hosted Neo4j (Neo4j Aura) with strong credentials
7. **Rate limiting**: Add rate limiting to prevent abuse
