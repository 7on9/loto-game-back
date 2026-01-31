# 🏗️ Architecture Documentation

> **Note**: This documentation is based on the system design from [ChatGPT Conversation](https://chatgpt.com/share/697e4cc3-20ac-8002-b794-55f28881fcf5)

## Overview

The Loto Game Backend is a simplified system focused on **room and user management**. All game-related logic (Undercover game) has been removed, keeping only the core infrastructure for managing users and rooms.

## System Architecture

### Core Modules

The system consists of the following main modules:

#### 1. **Authentication Module** (`auth/`)
- User registration and login
- JWT token generation and validation
- Password hashing and security
- Token refresh mechanism

#### 2. **Users Module** (`users/`)
- User profile management
- User CRUD operations
- Password change functionality
- User information retrieval

#### 3. **Rooms Module** (`rooms/`)
- Room creation and management
- Room status management
- Room-user relationships
- Room listing and retrieval

#### 4. **Groups Module** (`groups/`)
- Group creation and management
- Group-player relationships
- Group updates and deletion

### Database Schema

#### Core Entities

**User**
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `username` (String)
- `password` (String, Hashed)
- `avatar` (String, Optional)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

**Room**
- `id` (UUID, Primary Key)
- `name` (String)
- `creatorId` (UUID, Foreign Key → User)
- `groupId` (UUID, Foreign Key → Group, Optional)
- `status` (Enum: WAITING, IN_PROGRESS, FINISHED)
- `gameMode` (String, Template field - not used)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

**Group**
- `id` (UUID, Primary Key)
- `name` (String)
- `description` (String, Optional)
- `creatorId` (UUID, Foreign Key → User)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

**Player**
- `id` (UUID, Primary Key)
- `name` (String)
- `avatar` (String, Optional)
- `groupId` (UUID, Foreign Key → Group, Optional)
- `userId` (UUID, Foreign Key → User, Optional)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

## API Structure

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Flow

1. **Register** → `POST /auth/register`
   - Creates new user account
   - Returns JWT token

2. **Login** → `POST /auth/login`
   - Authenticates user
   - Returns JWT token

3. **Protected Routes** → Require `Authorization: Bearer <token>` header

### Room Management Flow

1. **Create Room** → `POST /rooms`
   - User creates a room
   - Optional: Link to a group
   - Returns room details

2. **List Rooms** → `GET /rooms`
   - Returns all rooms created by the authenticated user

3. **Get Room** → `GET /rooms/:id`
   - Returns specific room details

4. **Update Room Status** → Internal operation
   - Status transitions: WAITING → IN_PROGRESS → FINISHED

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
loto-game-back/
├── apps/
│   └── loto-game-back/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/          # Authentication
│       │   │   ├── users/         # User management
│       │   │   ├── rooms/         # Room management
│       │   │   ├── groups/        # Group management
│       │   │   └── public/        # Public endpoints
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── tests/
└── libs/
    ├── @config/                   # Configuration
    ├── @core/                     # Core utilities
    ├── @systems/                  # System modules
    │   ├── entities/              # Database entities
    │   ├── repositories/          # Data access layer
    │   ├── dtos/                  # Data transfer objects
    │   ├── enums/                 # Enumerations
    │   └── auth/                  # Auth guards
    └── @types/                    # Type definitions
```

## Key Design Decisions

### 1. **Removed Game Logic**
- All Undercover game logic has been removed
- Game-related modules (games, words, scoreboard) have been deleted
- Only room and user management remain

### 2. **Simplified Data Model**
- Rooms are now standalone entities
- No game state management
- No word pairs or game rounds

### 3. **Template Fields**
- Some fields (like `gameMode` in Room) are kept for template purposes
- These fields are not actively used in the current implementation

## Environment Configuration

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed environment configuration.

## Development

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Yarn package manager

### Setup Steps
1. Install dependencies: `yarn install`
2. Configure `.env` file
3. Run migrations: `yarn migration:run`
4. Start server: `yarn start:dev`
5. Access Swagger: http://localhost:3000/swagger

## API Documentation

Full API documentation is available via Swagger UI when the server is running:
- **Swagger UI**: http://localhost:3000/swagger
- **API Base**: http://localhost:3000/api/v1

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- All protected routes require valid JWT token
- CORS and security headers are configured

## Future Enhancements

Based on the architecture from the referenced ChatGPT conversation, potential future enhancements could include:
- Additional room features
- Enhanced user management
- Real-time capabilities (if needed)
- Additional group management features

---

**Reference**: [ChatGPT Conversation - System Design](https://chatgpt.com/share/697e4cc3-20ac-8002-b794-55f28881fcf5)
