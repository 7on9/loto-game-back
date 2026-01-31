# 📋 Database Migration Guide

This guide explains how to set up and manage database migrations for the Undercover Game backend.

## 🗄️ Database Schema Overview

The application uses **11 tables** with the following structure:

```
users
├── groups (one-to-many)
│   └── players (one-to-many)
│       └── game_players (one-to-many)
├── rooms (one-to-many)
│   └── games (one-to-one)
│       ├── game_players (one-to-many)
│       └── rounds (one-to-many)
│           └── votes (one-to-many)
├── user_stats (one-to-one)
└── words

players
└── player_stats (one-to-one)
```

## 🚀 Initial Setup

### 1. Configure Database Connection

Update `.env` file with your PostgreSQL credentials:

```env
DB_PRIMARY_HOST=localhost
DB_PRIMARY_PORT=5432
DB_PRIMARY_USERNAME=postgres
DB_PRIMARY_PASSWORD=your_password
DB_PRIMARY_DATABASE=guess_the_word
DB_PRIMARY_SYNCHRONIZE=false  # Important: keep false for production
```

### 2. Create Database

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE guess_the_word;"

# Or using createdb
createdb -U postgres guess_the_word
```

### 3. Generate Initial Migration

The entities are already defined. Generate the initial migration:

```bash
yarn migration:generate --name=InitialSchema
```

This will create a migration file in `libs/@systems/migrations/primary/` (you may need to create this directory first).

### 4. Run Migration

```bash
yarn migration:run
```

Expected output:
```
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = 'public' AND "table_name" = 'migrations'
query: CREATE TABLE "migrations" (...)
query: CREATE TABLE "users" (...)
query: CREATE TABLE "groups" (...)
...
Migration InitialSchema1234567890123 has been executed successfully.
```

## 📊 Table Structures

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  username VARCHAR NOT NULL,
  avatar VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### groups
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);
```

#### players
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  avatar VARCHAR,
  user_id UUID,
  group_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);
```

#### rooms
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  creator_id UUID NOT NULL,
  group_id UUID NOT NULL,
  status VARCHAR DEFAULT 'waiting',
  game_mode VARCHAR DEFAULT 'classic',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);
```

#### games
```sql
CREATE TABLE games (
  id UUID PRIMARY KEY,
  room_id UUID UNIQUE NOT NULL,
  word_id UUID NOT NULL,
  status VARCHAR DEFAULT 'not_started',
  current_round INT DEFAULT 0,
  winner_role VARCHAR,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (word_id) REFERENCES words(id)
);
```

#### game_players
```sql
CREATE TABLE game_players (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL,
  player_id UUID NOT NULL,
  role VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'alive',
  turn_order INT NOT NULL,
  eliminated_round INT,
  mr_white_guess VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);
```

#### rounds
```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL,
  round_number INT NOT NULL,
  eliminated_player_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (game_id) REFERENCES games(id)
);
```

#### votes
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY,
  round_id UUID NOT NULL,
  voter_id UUID NOT NULL,
  voted_for_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (round_id) REFERENCES rounds(id),
  FOREIGN KEY (voter_id) REFERENCES game_players(id),
  FOREIGN KEY (voted_for_id) REFERENCES game_players(id)
);
```

#### words
```sql
CREATE TABLE words (
  id UUID PRIMARY KEY,
  civilian_word TEXT NOT NULL,
  undercover_word TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### player_stats
```sql
CREATE TABLE player_stats (
  id UUID PRIMARY KEY,
  player_id UUID UNIQUE NOT NULL,
  total_games INT DEFAULT 0,
  wins_as_civilian INT DEFAULT 0,
  wins_as_undercover INT DEFAULT 0,
  wins_as_mr_white INT DEFAULT 0,
  total_eliminations_caused INT DEFAULT 0,
  average_survival_round FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### user_stats
```sql
CREATE TABLE user_stats (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  total_games_created INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  win_rate FLOAT DEFAULT 0,
  average_game_length FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Managing Migrations

### Create a New Migration

When you modify entities:

```bash
yarn migration:generate --name=DescriptiveName
```

Example:
```bash
yarn migration:generate --name=AddPlayerAvatarColumn
```

### Run Pending Migrations

```bash
yarn migration:run
```

### Revert Last Migration

```bash
yarn typeorm migration:revert -d ./libs/@config/datasources/primary.datasource.ts
```

### Show Migration Status

```bash
yarn typeorm migration:show -d ./libs/@config/datasources/primary.datasource.ts
```

## 🌱 Seeding Data

After migrations, seed the database with initial word pairs:

```bash
yarn seed:words
```

This adds 30 word pairs to the `words` table.

## 🧹 Cleanup & Reset

### Development: Reset Database

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS guess_the_word;"
psql -U postgres -c "CREATE DATABASE guess_the_word;"

# Run migrations
yarn migration:run

# Seed data
yarn seed:words
```

### Production: Safe Migration

```bash
# Always backup first!
pg_dump -U postgres guess_the_word > backup_$(date +%Y%m%d).sql

# Run migration
yarn migration:run

# If issues occur, restore:
psql -U postgres guess_the_word < backup_20251025.sql
```

## ⚠️ Important Notes

### DO NOT use `synchronize: true` in production!

The `DB_PRIMARY_SYNCHRONIZE` should always be `false` in production. Auto-sync can cause data loss.

### Always backup before migrations

```bash
pg_dump -U postgres guess_the_word > backup_before_migration.sql
```

### Migration Best Practices

1. **Test in Development First** - Always test migrations locally
2. **Backup Before Running** - Create database backup before production migrations
3. **Review Generated SQL** - Check migration files before running
4. **One Thing Per Migration** - Keep migrations focused and atomic
5. **Name Descriptively** - Use clear names like `AddUserAvatarColumn`
6. **Never Modify Existing Migrations** - Create new ones instead

## 🔍 Verifying Schema

### Check Tables

```bash
psql -U postgres -d guess_the_word -c "\dt"
```

Expected output:
```
           List of relations
 Schema |      Name       | Type  | Owner
--------+-----------------+-------+--------
 public | games           | table | postgres
 public | game_players    | table | postgres
 public | groups          | table | postgres
 public | migrations      | table | postgres
 public | players         | table | postgres
 public | player_stats    | table | postgres
 public | rooms           | table | postgres
 public | rounds          | table | postgres
 public | users           | table | postgres
 public | user_stats      | table | postgres
 public | votes           | table | postgres
 public | words           | table | postgres
```

### Check Table Structure

```bash
psql -U postgres -d guess_the_word -c "\d users"
```

## 📈 Monitoring

### Check Row Counts

```sql
SELECT 
  'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'words', COUNT(*) FROM words;
```

### Check Active Games

```sql
SELECT 
  g.id,
  r.name as room_name,
  g.status,
  g.current_round,
  g.created_at
FROM games g
JOIN rooms r ON r.id = g.room_id
WHERE g.status = 'in_progress'
ORDER BY g.created_at DESC;
```

## 🚨 Troubleshooting

### "relation already exists"

```bash
# Check if tables exist
psql -U postgres -d guess_the_word -c "\dt"

# If needed, drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS guess_the_word;"
psql -U postgres -c "CREATE DATABASE guess_the_word;"
yarn migration:run
```

### "Cannot find module" errors

```bash
# Rebuild the project
yarn build

# Try migration again
yarn migration:run
```

### "ECONNREFUSED" database connection

Check:
1. PostgreSQL is running: `pg_isready`
2. Credentials in `.env` are correct
3. Database exists: `psql -U postgres -l | grep guess_the_word`

## 📚 Additional Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Quick Start Guide](./QUICK_START.md)

---

**Ready to migrate!** Follow the steps above to set up your database schema. 🚀






