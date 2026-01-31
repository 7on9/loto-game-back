# 🗄️ Database Setup Guide

This guide will help you set up PostgreSQL for the Undercover Game backend.

## 📋 Prerequisites

- Docker installed on your system
- Yarn package manager

## 🚀 Quick Start

### 1. Start PostgreSQL with Docker

Navigate to the deployment folder and start Docker containers:

```bash
cd /Users/longnguyen/source/work/guess-the-word/deployment
docker compose up -d
```

Or if you're using the older docker-compose command:

```bash
cd /Users/longnguyen/source/work/guess-the-word/deployment
docker-compose up -d
```

This will start:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`

### 2. Verify PostgreSQL is Running

```bash
docker ps
```

You should see a container named `guess-the-word-db` running.

### 3. Check Database Connection

The database is automatically created with these credentials:

```
Host: localhost
Port: 5432
Database: guess_the_word
Username: postgres
Password: postgres
```

### 4. Generate and Run Migrations

From the backend project directory:

```bash
cd /Users/longnguyen/source/work/guess-the-word/guess-the-word-back

# Generate the initial migration
yarn typeorm migration:generate libs/@systems/migrations/primary/InitialSchema -d ./libs/@config/datasources/primary.datasource.ts

# Run migrations
yarn migration:run
```

### 5. Seed Initial Data

```bash
yarn seed:words
```

This will add 30 word pairs to the database.

## 🛠️ Docker Commands

### Start containers
```bash
cd /Users/longnguyen/source/work/guess-the-word/deployment
docker compose up -d
```

### Stop containers
```bash
docker compose down
```

### View logs
```bash
docker compose logs -f db
```

### Restart containers
```bash
docker compose restart
```

### Remove containers and data
```bash
docker compose down -v
```

## 🔧 Manual Database Commands

### Connect to PostgreSQL
```bash
docker exec -it guess-the-word-db psql -U postgres -d guess_the_word
```

### Common SQL Commands
```sql
-- List all tables
\dt

-- Describe a table
\d users

-- Count records
SELECT COUNT(*) FROM words;

-- Exit psql
\q
```

## ⚠️ Troubleshooting

### Port Already in Use

If port 5432 is already in use:

```bash
# Check what's using port 5432
lsof -i :5432

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

Or change the port in `deployment/docker-compose.yaml`:

```yaml
ports:
  - 5433:5432  # Change local port to 5433
```

Then update `.env`:
```
DB_PRIMARY_PORT=5433
```

### Database Connection Refused

1. Check if Docker is running:
   ```bash
   docker ps
   ```

2. Check container logs:
   ```bash
   docker compose logs db
   ```

3. Restart containers:
   ```bash
   docker compose restart
   ```

### Migration Errors

If you get "relation already exists" error:

```bash
# Drop and recreate the database
docker exec -it guess-the-word-db psql -U postgres -c "DROP DATABASE IF EXISTS guess_the_word;"
docker exec -it guess-the-word-db psql -U postgres -c "CREATE DATABASE guess_the_word;"

# Run migrations again
yarn migration:run
```

## 📝 Migration Commands Reference

```bash
# Generate a new migration
yarn typeorm migration:generate libs/@systems/migrations/primary/<MigrationName> -d ./libs/@config/datasources/primary.datasource.ts

# Run pending migrations
yarn migration:run

# Revert last migration
yarn typeorm migration:revert -d ./libs/@config/datasources/primary.datasource.ts

# Show migration status
yarn typeorm migration:show -d ./libs/@config/datasources/primary.datasource.ts
```

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] PostgreSQL container is running (`docker ps`)
- [ ] Database `guess_the_word` exists
- [ ] All 11 tables are created (run `\dt` in psql)
- [ ] Word pairs are seeded (check with: `SELECT COUNT(*) FROM words;`)
- [ ] Backend can connect (run `yarn start:dev`)

## 🎯 Next Steps

Once the database is set up:

1. Start the development server:
   ```bash
   yarn start:dev
   ```

2. Access Swagger documentation:
   ```
   http://localhost:3000/swagger
   ```

3. Test the API endpoints

## 📚 Related Documentation

- [Quick Start Guide](./QUICK_START.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

**Ready to start!** Run `docker compose up -d` in the deployment folder to begin. 🚀






