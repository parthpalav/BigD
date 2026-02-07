# Authentication API Testing

## Test Results Summary

### ✅ All Tests Passed

1. **User Signup** - Creates user in MongoDB with hashed password
2. **Duplicate Prevention** - Rejects duplicate email addresses  
3. **Login Success** - Authenticates with correct credentials
4. **Login Failure** - Rejects wrong password
5. **Input Validation** - Validates name, email, and password
6. **JWT Token Generation** - Returns JWT on successful auth
7. **Token Authentication** - Verifies JWT on protected routes

## API Endpoints

### POST `/api/auth/signup`
Register a new user
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "..."
    },
    "token": "eyJhbGc..."
  }
}
```

### POST `/api/auth/login`
Authenticate user
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGc..."
  }
}
```

### GET `/api/auth/me`
Get current user (requires JWT token)
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "..."
    }
  }
}
```

## Validation Rules

- **Name**: 2-50 characters, required
- **Email**: Valid email format, unique, required
- **Password**: Minimum 6 characters, required

## Security Features

- ✅ Passwords hashed with bcrypt (10 salt rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ Email uniqueness enforced
- ✅ Password comparison using bcrypt
- ✅ No passwords in responses
- ✅ Input validation and sanitization
- ✅ Environment variables for secrets

## MongoDB Storage

Users are stored in the `bigd` database with:
- Hashed passwords (never stored in plain text)
- Unique email index
- Timestamps (createdAt, updatedAt)
- Mongoose schema validation

## Environment Variables

```env
MONGO_URI=mongodb+srv://...
PORT=3001
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```
