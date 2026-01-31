# 🔐 Authentication & User Management API

Complete authentication system with JWT tokens and password hashing using bcrypt.

## 📋 Features

- ✅ User registration with email & password
- ✅ User login with JWT token generation
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Get user profile (protected)
- ✅ Update user profile (protected)
- ✅ Change password (protected)
- ✅ JWT token authentication on all protected endpoints

---

## 🔓 Public Endpoints (No Authentication Required)

### 1. Register New User

**POST** `/api/v1/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "username": "johndoe",
  "avatar": "https://example.com/avatar.jpg"  // optional
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "johndoe",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2025-10-25T23:00:00.000Z",
    "updatedAt": "2025-10-25T23:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `409 Conflict` - Email already registered
- `400 Bad Request` - Invalid input data

---

### 2. Login

**POST** `/api/v1/auth/login`

Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "johndoe",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2025-10-25T23:00:00.000Z",
    "updatedAt": "2025-10-25T23:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials

---

## 🔒 Protected Endpoints (Authentication Required)

All protected endpoints require the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### 3. Get Current User Profile

**GET** `/api/v1/auth/profile`

Get the profile of the currently authenticated user.

**Response:**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "username": "johndoe",
  "avatar": "https://example.com/avatar.jpg",
  "createdAt": "2025-10-25T23:00:00.000Z",
  "updatedAt": "2025-10-25T23:00:00.000Z"
}
```

**Errors:**
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

---

### 4. Update User Profile

**PUT** `/api/v1/users/profile`

Update the current user's profile information.

**Request Body:**
```json
{
  "username": "newusername",  // optional
  "avatar": "https://example.com/new-avatar.jpg"  // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "username": "newusername",
  "avatar": "https://example.com/new-avatar.jpg",
  "createdAt": "2025-10-25T23:00:00.000Z",
  "updatedAt": "2025-10-25T23:45:00.000Z"
}
```

**Errors:**
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

---

### 5. Change Password

**POST** `/api/v1/users/change-password`

Change the current user's password.

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:**
- `400 Bad Request` - Current password is incorrect
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

---

## 🔑 JWT Token Structure

The JWT token contains the following payload:

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "username": "username",
  "iat": 1698234567,
  "exp": 1698238167
}
```

**Token Configuration:**
- Algorithm: `HS512`
- Expiration: 1 hour (3600 seconds)
- Secret: Defined in `JWT_SECRET` environment variable

---

## 🔐 Password Security

- Passwords are hashed using **bcrypt** with **10 salt rounds**
- Original passwords are never stored in the database
- Password minimum length: **6 characters**

---

## 📝 Validation Rules

### Registration
- **email**: Must be valid email format
- **password**: Minimum 6 characters
- **username**: Minimum 3 characters
- **avatar**: Optional, must be string

### Login
- **email**: Must be valid email format
- **password**: Required

### Update Profile
- **username**: Optional, minimum 3 characters if provided
- **avatar**: Optional, must be string if provided

### Change Password
- **currentPassword**: Required
- **newPassword**: Required, minimum 6 characters

---

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "username": "testuser"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "avatar": "https://example.com/avatar.jpg"
  }'
```

### Change Password
```bash
curl -X POST http://localhost:3000/api/v1/users/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "test123",
    "newPassword": "newpass456"
  }'
```

---

## 🎯 Integration with Game APIs

After authentication, use the received `accessToken` in all game-related API calls:

### Example: Create a Group
```bash
curl -X POST http://localhost:3000/api/v1/groups \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Game Group",
    "players": [
      {"name": "Player 1"},
      {"name": "Player 2"}
    ]
  }'
```

---

## 🏗️ Implementation Details

### Modules Created
1. **AuthModule** (`/modules/auth/`)
   - `auth.controller.ts` - Public endpoints (register, login)
   - `auth.service.ts` - Authentication logic
   - `auth.module.ts` - Module configuration

2. **UsersModule** (`/modules/users/`) - Updated
   - `users.controller.ts` - Protected user endpoints
   - `users.service.ts` - User management logic
   - `users.module.ts` - Module configuration

### DTOs Created
- `RegisterDto` - User registration
- `LoginDto` - User login
- `UpdateUserDto` - Profile updates
- `ChangePasswordDto` - Password changes

### Security Features
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with HS512 algorithm
- Token validation on protected routes
- Email uniqueness enforced
- Password strength requirements

---

## 🚀 Quick Start

1. **Start the server:**
```bash
yarn start:dev
```

2. **Register a new user:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","username":"user1"}'
```

3. **Use the returned token** in subsequent requests!

---

## 📚 API Documentation

Full interactive API documentation available at:
```
http://localhost:3000/swagger
```

Look for:
- **Auth** tag - Public authentication endpoints
- **Users** tag - Protected user management endpoints

---

✅ **Authentication system is complete and ready to use!**






