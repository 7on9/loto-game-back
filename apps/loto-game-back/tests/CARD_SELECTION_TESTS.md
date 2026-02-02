# Card Selection Flow - Test Coverage

## Overview

This document describes the comprehensive test suite for the card selection flow in the Lô Tô game backend. All tests are located in `card-selection.e2e-spec.ts`.

## Test Coverage

### 0️⃣ Test Preconditions
- ✅ Game exists and is in PREPARE status
- ✅ Seeded cards available (18 cards, 9 pairs)
- ✅ No cards assigned initially
- ✅ Test users (User A, User B) exist
- ✅ Max cards per user = 2

### 1️⃣ Happy Path Tests
- ✅ **TC-01**: User picks 1 available card
  - Selection succeeds
  - DB inserts (game_id, user_id, card_id)
  - Card marked as taken
  - User has 1 card

- ✅ **TC-02**: User picks 2 different cards
  - Selection succeeds
  - User has exactly 2 cards
  - No more selections allowed

### 2️⃣ Validation & Business Rule Tests
- ✅ **TC-03**: User picks more than 2 cards
  - Request rejected
  - Error: "maximum of 2 cards"
  - DB unchanged

- ✅ **TC-04**: User picks card when game is STARTED
  - Request rejected
  - Error: "Game is not in PREPARE status"

- ✅ **TC-05**: User picks card when game is FINISHED
  - Same result as TC-04

### 3️⃣ Concurrency & Race Condition Tests (Critical)
- ✅ **TC-06**: Two users pick same card simultaneously
  - Only one succeeds
  - Other fails with "already taken"
  - No duplicate rows in DB

- ✅ **TC-07**: Same user sends duplicate pick requests
  - First succeeds
  - Second rejected
  - Only one DB row exists

### 4️⃣ Data Integrity Tests
- ✅ **TC-08**: Card not in seed data
  - Rejected
  - Error: "not found"

- ✅ **TC-09**: Card already assigned to another game
  - Cards are per-game (should succeed)
  - Verified both games can use same card

### 5️⃣ Transaction & Rollback Tests
- ✅ **TC-10**: DB failure during insert (simulated)
  - Transaction rollback verified
  - Card remains available
  - No partial data written

- ✅ **TC-11**: Partial commit protection
  - Complete record exists
  - All fields properly set

### 6️⃣ Security & Abuse Tests
- ✅ **TC-12**: User picks card for another user
  - UserId comes from JWT token (not request body)
  - Cannot manipulate userId

- ✅ **TC-13**: User manipulates FE to bypass limit
  - Backend enforces max 2 cards
  - Frontend bypass attempts fail

### 7️⃣ Reconnect & Refresh Tests
- ✅ **TC-14**: User refreshes page after picking
  - Card still shown as taken
  - User still owns selected cards

### 8️⃣ Load & Stress Tests
- ✅ **TC-16**: 100 concurrent pick requests
  - At most 18 successful picks (one per card)
  - No deadlocks
  - No duplicate cards

### 9️⃣ Observability & Logging Tests
- ✅ **TC-18**: Audit log created on pick
  - Action logged with:
    - game_id
    - user_id
    - card_id
    - timestamp (selectedAt)
    - result (success/fail)

### 🔟 Negative & Edge Case Tests
- ✅ Request without authentication
- ✅ Request with invalid game ID
- ✅ Request with invalid card ID format

## Critical Test Cases (Non-Negotiable)

The following test cases are **mandatory** and ensure system safety:

1. ✅ **TC-01**: Basic card selection works
2. ✅ **TC-03**: Card limit enforcement
3. ✅ **TC-06**: Concurrency protection
4. ✅ **TC-10**: Transaction integrity
5. ✅ **TC-12**: Security (userId from token)

## Running Tests

```bash
# Run all e2e tests
yarn test:e2e

# Run only card selection tests
yarn test:e2e --testNamePattern="Card Selection Flow"

# Run with coverage
yarn test:e2e --coverage

# Run in watch mode
yarn test:e2e --watch
```

## Test Setup

Tests use:
- **Mock JWT Authentication**: `mock-jwt-token` with custom `x-test-user-id` header
- **Test Users**: 
  - User A: `550e8400-e29b-41d4-a716-446655440000`
  - User B: `550e8400-e29b-41d4-a716-446655440001`
- **Test Database**: Uses the same database as development (with cleanup)

## Backend Dev Rule

> **"All card selection logic is validated and locked in backend transactions; frontend is advisory only."**

This means:
- ✅ All validation happens in the backend
- ✅ Transaction locks prevent race conditions
- ✅ Frontend can only display state, not enforce rules
- ✅ Backend enforces max 2 cards per user
- ✅ Backend enforces game status checks
- ✅ Backend prevents duplicate card selection

## Test Statistics

- **Test Suites**: 1 comprehensive suite
- **Test Cases**: 20+ test cases
- **API Endpoints Tested**: 2 endpoints
  - `GET /games/:gameId/cards`
  - `POST /games/:gameId/select-card`
- **Test Scenarios**: 10 major scenarios
- **Lines of Test Code**: ~600+ lines

## Test Architecture

```
card-selection.e2e-spec.ts
├── Setup & Teardown
│   ├── beforeAll: Initialize app and datasource
│   ├── afterAll: Cleanup
│   ├── beforeEach: Create test data (game, users, cards)
│   └── afterEach: Clean test data
│
└── Test Suites
    ├── 0️⃣ Test Preconditions
    ├── 1️⃣ Happy Path Tests
    ├── 2️⃣ Validation & Business Rule Tests
    ├── 3️⃣ Concurrency & Race Condition Tests
    ├── 4️⃣ Data Integrity Tests
    ├── 5️⃣ Transaction & Rollback Tests
    ├── 6️⃣ Security & Abuse Tests
    ├── 7️⃣ Reconnect & Refresh Tests
    ├── 8️⃣ Load & Stress Tests
    ├── 9️⃣ Observability & Logging Tests
    └── 🔟 Negative & Edge Case Tests
```

## Notes

- Tests use pessimistic locking to verify transaction safety
- All database operations are wrapped in transactions
- Tests verify both API responses and database state
- Concurrency tests use `Promise.all()` to simulate simultaneous requests
- Test data is cleaned up after each test to ensure isolation
