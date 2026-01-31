<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**Loto Game Backend** - A backend API built with NestJS, TypeORM, and PostgreSQL for managing rooms and users.

### ✨ Features

- 🏠 Room management
- 👥 User management and authentication
- 🔐 JWT-based authentication
- 📖 Full Swagger documentation
- 🎯 RESTful API design

### 📚 Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - System architecture and design
- [Authentication API](./AUTH_API.md) - Authentication endpoints
- [Database Setup](./DATABASE_SETUP.md) - Database configuration

## Project Setup

```bash
# Install dependencies
$ yarn install

# Set up environment variables
# Create .env file with the configuration below
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DB_PRIMARY_HOST=localhost
DB_PRIMARY_PORT=5432
DB_PRIMARY_USERNAME=your_username
DB_PRIMARY_PASSWORD=your_password
DB_PRIMARY_DATABASE=guess_the_word
DB_PRIMARY_SYNCHRONIZE=false
DB_PRIMARY_SSL=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_at_least_32_characters_long
JWT_EXPIRY=1h
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret_here_at_least_32_characters
JWT_REFRESH_TOKEN_EXPIRY=7d

# Application Configuration
PORT=3000
APP_NAME=GuessTheWord

# Swagger Configuration
SWAGGER_TITLE=Guess The Word API
SWAGGER_DESCRIPTION=The Guess The Word API
SWAGGER_VERSION=1.0

# Logging Configuration
LOG_LEVEL=info
LOG_OUTPUT=console
LOG_FILE_PATH=logs
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
LOG_REDIS_KEY=guess-the-word:logs
LOG_SHOW_CONTEXT=false

# Display Timezone
DISPLAY_TIMEZONE=Asia/Ho_Chi_Minh
```

## Compile and Run the Project

```bash
# Development
$ yarn run start:dev

# Production build
$ yarn run build

# Production run
$ yarn run start:prod
```

## Database

```bash
# Generate migration
$ yarn migration:generate --name=InitialSchema

# Run migrations
$ yarn migration:run
```

## Run Tests

```bash
# Unit tests
$ yarn run test

# E2E tests
$ yarn run test:e2e

# Test coverage
$ yarn run test:cov
```

## API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3000/swagger
- **API Base**: http://localhost:3000/api/v1

### Quick API Overview

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `/api/v1/auth` | Authentication endpoints |
| Users | `/api/v1/users` | User management |
| Rooms | `/api/v1/rooms` | Room management |
| Groups | `/api/v1/groups` | Group management |

See [AUTH_API.md](./AUTH_API.md) for authentication details.

## Project Structure

```
apps/loto-game-back/
├── src/
│   ├── modules/           # Feature modules
│   │   ├── public/       # Public endpoints
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── rooms/        # Room management
│   │   └── groups/       # Group management
│   ├── app.controller.ts
│   ├── app.module.ts
│   └── main.ts
└── tests/                # Tests

libs/
├── @config/              # Configuration
├── @core/                # Core utilities and services
├── @systems/             # System-level modules
└── @types/               # Type definitions
```

## Development

1. Install dependencies: `yarn install`
2. Create and configure `.env` file (copy from `.env.example`)
3. Run database migrations: `yarn migration:run`
4. Start development server: `yarn start:dev`
5. Visit Swagger UI: http://localhost:3000/swagger

For detailed setup instructions, see [DATABASE_SETUP.md](./DATABASE_SETUP.md)

## License

UNLICENSED
