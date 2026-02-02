# Implementation Gap Analysis - Join Game & Pick Card Flow

## ✅ What's Already Implemented

1. **GET /games/{game_id}/cards** - ✓ Implemented
2. **GET /games/{game_id}/stream** - ✓ Implemented (SSE)
3. **POST /games/{game_id}/pick-card** - ✓ Implemented with transaction
4. **Transaction Steps** - ✓ Follows requirements (lock game, validate, insert)
5. **SSE Broadcasting** - ✓ Broadcasts after commit
6. **DB Constraints** - ✓ UNIQUE (game_id, card_id) via primary key

## ❌ What's Missing

### 1. Join Game Flow
- **Missing**: `POST /games/{game_id}/join` endpoint
- **Missing**: `game_players` entity/table to track joined users
- **Missing**: SSE event `player_joined` broadcast

### 2. SSE Initial Events Order
- **Current**: Sends `game_state` and `picked_cards`
- **Missing**: `players` event (list of joined users)
- **Required Order**: `game_state` → `players` → `picked_cards`

### 3. Release Card
- **Missing**: `DELETE /games/{game_id}/pick-card/{card_id}` endpoint
- **Missing**: SSE event `card_released` broadcast

### 4. Error Messages
- **Current**: Generic messages like "Game is not in PREPARE status"
- **Required**: Specific error codes like `GAME_NOT_PREPARE`, `CARD_ALREADY_TAKEN`, `CARD_LIMIT`, `INVALID_CARD`

### 5. Pick Card Data Structure
- **Current**: Broadcasts `{ cardId, userId, gameId }`
- **Required**: Should match exactly `{ game_id, card_id, user_id }`

### 6. Additional DB Constraint
- **Current**: Primary key ensures UNIQUE (game_id, card_id)
- **Required**: Also need UNIQUE (game_id, user_id, card_id) - but this is redundant since (game_id, card_id) is already unique

## 🔧 Required Changes

1. Create `GamePlayer` entity
2. Add join endpoint
3. Fix SSE initial events to include players
4. Add release card endpoint
5. Update error messages to use specific codes
6. Verify pick-card transaction matches exact steps
