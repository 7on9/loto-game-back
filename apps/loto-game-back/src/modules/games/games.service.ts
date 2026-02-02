import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError } from 'typeorm'
import {
  GameRepository,
  CardRepository,
  GameCardRepository,
  GamePlayerRepository,
  RoomPlayerRepository,
  GameNumberOrderRepository,
  GameCalledNumberRepository,
} from '@libs/@systems/repositories/primary'
import { Game, Card, GameCard, GamePlayer, RoomPlayer, Room, GameNumberOrder, GameCalledNumber } from '@libs/@systems/entities/primary'
import { GameStatus, RoomStatus } from '@libs/@systems/enums'
import { SelectCardDto, PickCardDto, CardAvailabilityDto, StartGameResponseDto, CallNextNumberResponseDto } from '@libs/@systems/dtos'
import { GameSSEService } from './game-sse.service'

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name)

  constructor(
    private readonly gameRepository: GameRepository,
    private readonly cardRepository: CardRepository,
    private readonly gameCardRepository: GameCardRepository,
    private readonly gamePlayerRepository: GamePlayerRepository,
    private readonly roomPlayerRepository: RoomPlayerRepository,
    private readonly gameNumberOrderRepository: GameNumberOrderRepository,
    private readonly gameCalledNumberRepository: GameCalledNumberRepository,
    private readonly dataSource: DataSource,
    private readonly sseService: GameSSEService,
  ) {}

  async getCardsWithAvailability(gameId: string): Promise<Array<CardAvailabilityDto>> {
    // Check if game exists
    const game = await this.gameRepository.findOneWithRelations(gameId)
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`)
    }

    // Get all active cards
    const cards = await this.cardRepository.findActiveCards()

    // Get all game cards (taken cards) for this game
    const gameCards = await this.gameCardRepository.findByGameId(gameId)
    const takenCardMap = new Map<string, { userId: string }>()
    for (const gameCard of gameCards) {
      takenCardMap.set(gameCard.cardId, { userId: gameCard.userId })
    }

    // Map cards to availability DTOs
    return cards.map(card => ({
      id: card.id,
      pairId: card.pairId,
      colorTheme: card.colorTheme,
      isActive: card.isActive,
      isTaken: takenCardMap.has(card.id),
      takenByUserId: takenCardMap.get(card.id)?.userId,
    }))
  }

  /**
   * Get game state for SSE initial snapshot
   * Returns: status, players, and cards
   */
  async getGameStateForSSE(gameId: string): Promise<{ status: string; players: Array<{ user_id: string }>; cards: Array<CardAvailabilityDto> }> {
    const game = await this.gameRepository.findOneWithRelations(gameId)
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`)
    }

    const players = await this.gamePlayerRepository.findByGameId(gameId)
    const cards = await this.getCardsWithAvailability(gameId)

    return {
      status: game.status,
      players: players.map(p => ({ user_id: p.userId })),
      cards,
    }
  }

  /**
   * Pick a card for a game
   * Card ownership is determined solely by transactional writes; SSE is a read-only projection of committed state.
   */
  async pickCard(gameId: string, userId: string, pickCardDto: PickCardDto): Promise<GameCard> {
    // Use the same logic as selectCard but with SSE broadcasting
    const gameCard = await this.selectCard(gameId, userId, { cardId: pickCardDto.cardId })
    
    // Broadcast SSE event to all connected clients (after commit)
    this.sseService.broadcastToGame(gameId, {
      type: 'card_picked',
      data: {
        game_id: gameCard.gameId,
        card_id: gameCard.cardId,
        user_id: gameCard.userId,
      },
    })

    this.logger.log(`pick_card_success: gameId=${gameId}, userId=${userId}, cardId=${pickCardDto.cardId}`)
    return gameCard
  }

  /**
   * Release a card (only owner can release, only in PREPARE)
   * Card ownership is determined solely by transactional writes; SSE is a read-only projection of committed state.
   */
  async releaseCard(gameId: string, userId: string, cardId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. Lock game row
      const game = await queryRunner.manager.findOne(Game, {
        where: { id: gameId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!game) {
        throw new NotFoundException(`Game with ID ${gameId} not found`)
      }

      // 2. Validate game.status == PREPARE
      if (game.status !== GameStatus.PREPARE) {
        throw new BadRequestException('GAME_NOT_PREPARE')
      }

      // 3. Check card exists and is owned by user
      const gameCard = await queryRunner.manager.findOne(GameCard, {
        where: { gameId, cardId },
      })

      if (!gameCard) {
        throw new NotFoundException(`Card ${cardId} not found in game`)
      }

      // 4. Validate only owner can release
      if (gameCard.userId !== userId) {
        throw new BadRequestException('UNAUTHORIZED')
      }

      // 5. Delete game_cards
      await queryRunner.manager.delete(GameCard, {
        gameId,
        cardId,
      })

      // Commit transaction
      await queryRunner.commitTransaction()

      // 6. Broadcast SSE event (after commit)
      this.sseService.broadcastToGame(gameId, {
        type: 'card_released',
        data: { card_id: cardId },
      })

      this.logger.log(`release_card: gameId=${gameId}, userId=${userId}, cardId=${cardId}`)
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async selectCard(gameId: string, userId: string, selectCardDto: SelectCardDto): Promise<GameCard> {
    const maxRetries = 3
    let lastError: any

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const queryRunner = this.dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      try {
        // 1. Check game exists and status is PREPARE (with lock)
        const game = await queryRunner.manager.findOne(Game, {
          where: { id: gameId },
          lock: { mode: 'pessimistic_write' },
        })

        if (!game) {
          throw new NotFoundException(`Game with ID ${gameId} not found`)
        }

        if (game.status !== GameStatus.PREPARE) {
          throw new BadRequestException('GAME_NOT_PREPARE')
        }

        // 2. Check card exists and is active
        const card = await queryRunner.manager.findOne(Card, {
          where: { id: selectCardDto.cardId, isActive: true },
        })

        if (!card) {
          throw new NotFoundException('INVALID_CARD')
        }

        // 3. Check card is not already taken
        const existingGameCard = await queryRunner.manager.findOne(GameCard, {
          where: { gameId, cardId: selectCardDto.cardId },
        })

        if (existingGameCard) {
          throw new BadRequestException('CARD_ALREADY_TAKEN')
        }

        // 4. Check user hasn't selected 2 cards already
        const userCardCount = await queryRunner.manager.count(GameCard, {
          where: { gameId, userId },
        })

        if (userCardCount >= 2) {
          throw new BadRequestException('CARD_LIMIT')
        }

        // 5. Insert game_cards (lock card)
        const gameCard = queryRunner.manager.create(GameCard, {
          gameId,
          cardId: selectCardDto.cardId,
          userId,
        })

        const savedGameCard = await queryRunner.manager.save(gameCard)

        // Commit transaction
        await queryRunner.commitTransaction()
        await queryRunner.release()
        return savedGameCard
      } catch (error) {
        // Rollback on error
        await queryRunner.rollbackTransaction()
        await queryRunner.release()

        // Check if it's a deadlock error (PostgreSQL error code 40P01)
        if (
          error instanceof QueryFailedError &&
          (error as any).code === '40P01' &&
          attempt < maxRetries - 1
        ) {
          // Deadlock detected - retry after a short delay
          lastError = error
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1))) // Exponential backoff
          continue
        }

        // Not a deadlock or max retries reached - log and throw the error
        const errorCode = error instanceof BadRequestException 
          ? error.message 
          : error instanceof NotFoundException 
          ? 'INVALID_CARD' 
          : 'UNKNOWN_ERROR'
        this.logger.warn(`pick_card_fail: gameId=${gameId}, userId=${userId}, cardId=${selectCardDto.cardId}, reason=${errorCode}`)
        throw error
      }
    }

    // If we get here, all retries failed
    this.logger.error(`pick_card_fail: gameId=${gameId}, userId=${userId}, cardId=${selectCardDto.cardId}, reason=MAX_RETRIES_EXCEEDED`)
    throw lastError || new Error('Failed to select card after retries')
  }

  /**
   * Create a new game for a room and bring all room players into it
   * This locks the room (changes status to IN_PROGRESS) to prevent new joins
   */
  async createGame(roomId: string): Promise<{ game_id: string }> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. Validate room exists (with pessimistic lock)
      const room = await queryRunner.manager.findOne(Room, {
        where: { id: roomId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!room) {
        throw new NotFoundException(`Room with ID ${roomId} not found`)
      }

      // 2. Check if room already has a game (check if status is IN_PROGRESS or FINISHED)
      if (room.status !== RoomStatus.WAITING) {
        throw new BadRequestException('Room already has a game in progress')
      }

      // 3. Get all room players
      const roomPlayers = await queryRunner.manager.find(RoomPlayer, {
        where: { roomId },
      })

      if (roomPlayers.length === 0) {
        throw new BadRequestException('Cannot create game: room must have at least one player')
      }

      // 4. Create a new game for this room
      const game = queryRunner.manager.create(Game, {
        roomId,
        status: GameStatus.PREPARE,
      })
      const savedGame = await queryRunner.manager.save(game)
      const gameId = savedGame.id

      // 5. Create game_players for all room players
      const gamePlayers = roomPlayers.map(rp => {
        return queryRunner.manager.create(GamePlayer, {
          gameId,
          userId: rp.userId,
        })
      })
      await queryRunner.manager.save(gamePlayers)

      // 6. Lock the room (change status to IN_PROGRESS to prevent new joins)
      await queryRunner.manager.update(Room, roomId, {
        status: RoomStatus.IN_PROGRESS,
      })

      // Commit transaction
      await queryRunner.commitTransaction()
      await queryRunner.release()

      this.logger.log(`create_game: roomId=${roomId}, gameId=${gameId}`)

      return {
        game_id: gameId,
      }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      throw error
    }
  }

  /**
   * Start a game (shuffle numbers and transition to STARTED status)
   * This is a critical operation that must be atomic and deterministic
   */
  async startGame(gameId: string): Promise<StartGameResponseDto> {
    const maxRetries = 3
    let lastError: any

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const queryRunner = this.dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      try {
        // 1. Check game exists and status is PREPARE (with pessimistic lock)
        const game = await queryRunner.manager.findOne(Game, {
          where: { id: gameId },
          lock: { mode: 'pessimistic_write' },
        })

        if (!game) {
          throw new NotFoundException(`Game with ID ${gameId} not found`)
        }

        if (game.status !== GameStatus.PREPARE) {
          throw new BadRequestException(
            `Game cannot be started. Current status: ${game.status}. Game must be in PREPARE status.`,
          )
        }

        // 2. Validate at least 1 card is selected
        const cardCount = await queryRunner.manager.count(GameCard, {
          where: { gameId },
        })

        if (cardCount === 0) {
          throw new BadRequestException('Cannot start game: at least 1 card must be selected')
        }

        // 3. Check if number order already exists (prevent duplicate starts)
        const existingOrderCount = await queryRunner.manager.count(GameNumberOrder, {
          where: { gameId },
        })

        if (existingOrderCount > 0) {
          throw new BadRequestException('Game number order already exists. Game may have already been started.')
        }

        // 4. Generate shuffled numbers (1-90) - DETERMINISTIC, SHUFFLED ONCE
        const numbers = Array.from({ length: 90 }, (_, i) => i + 1)
        // Fisher-Yates shuffle algorithm
        for (let i = numbers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
        }

        // 5. Save full number order to database (position 0-89, number 1-90)
        const numberOrders = numbers.map((number, index) => {
          return queryRunner.manager.create(GameNumberOrder, {
            gameId,
            position: index, // 0-based position
            number,
          })
        })

        await queryRunner.manager.save(numberOrders)

        // 6. Update game status to STARTED and set started_at timestamp
        const startedAt = new Date()
        await queryRunner.manager.update(Game, gameId, {
          status: GameStatus.STARTED,
          startedAt,
        })

        // Commit transaction
        await queryRunner.commitTransaction()
        await queryRunner.release()

        return {
          gameId,
          status: GameStatus.STARTED,
          startedAt,
          totalNumbers: 90,
        }
      } catch (error) {
        // Rollback on error
        await queryRunner.rollbackTransaction()
        await queryRunner.release()

        // Check if it's a deadlock error (PostgreSQL error code 40P01)
        if (
          error instanceof QueryFailedError &&
          (error as any).code === '40P01' &&
          attempt < maxRetries - 1
        ) {
          // Deadlock detected - retry after a short delay
          lastError = error
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1))) // Exponential backoff
          continue
        }

        // Not a deadlock or max retries reached - throw the error
        throw error
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Failed to start game after retries')
  }

  /**
   * Call the next number in the game
   * This operation is atomic and handles concurrency using pessimistic locking
   */
  async callNextNumber(gameId: string): Promise<CallNextNumberResponseDto> {
    const maxRetries = 3
    let lastError: any

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const queryRunner = this.dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      try {
        // 1. Check game exists and status is STARTED (with pessimistic lock)
        const game = await queryRunner.manager.findOne(Game, {
          where: { id: gameId },
          lock: { mode: 'pessimistic_write' },
        })

        if (!game) {
          throw new NotFoundException(`Game with ID ${gameId} not found`)
        }

        if (game.status !== GameStatus.STARTED) {
          throw new BadRequestException(
            `Cannot call number. Game status is ${game.status}. Game must be in STARTED status.`,
          )
        }

        // 2. Get number order for this game
        const numberOrder = await queryRunner.manager.find(GameNumberOrder, {
          where: { gameId },
          order: { position: 'ASC' },
        })

        if (numberOrder.length === 0) {
          throw new BadRequestException('Game number order not found. Game must be started first.')
        }

        // 3. Get current call index (count of called numbers)
        const calledCount = await queryRunner.manager.count(GameCalledNumber, {
          where: { gameId },
        })

        // 4. Check if all numbers have been called
        if (calledCount >= 90) {
          throw new BadRequestException('All 90 numbers have already been called')
        }

        // 5. Get the next number from the order (by position index)
        const nextNumberOrder = numberOrder[calledCount]
        if (!nextNumberOrder) {
          throw new BadRequestException(`Invalid number order. Expected position ${calledCount} not found.`)
        }

        const nextNumber = nextNumberOrder.number

        // 6. Check if this number was already called (safety check for concurrency)
        const existingCalled = await queryRunner.manager.findOne(GameCalledNumber, {
          where: { gameId, number: nextNumber },
        })

        if (existingCalled) {
          // This should not happen if calledCount is correct, but handle it gracefully
          throw new BadRequestException(`Number ${nextNumber} has already been called`)
        }

        // 7. Persist called number
        const calledNumber = queryRunner.manager.create(GameCalledNumber, {
          gameId,
          number: nextNumber,
        })

        await queryRunner.manager.save(calledNumber)

        // Commit transaction
        await queryRunner.commitTransaction()
        await queryRunner.release()

        return {
          number: nextNumber,
          callIndex: calledCount, // 0-based index
          totalNumbers: 90,
          isComplete: calledCount + 1 >= 90,
        }
      } catch (error) {
        // Rollback on error
        await queryRunner.rollbackTransaction()
        await queryRunner.release()

        // Check if it's a deadlock error (PostgreSQL error code 40P01)
        if (
          error instanceof QueryFailedError &&
          (error as any).code === '40P01' &&
          attempt < maxRetries - 1
        ) {
          // Deadlock detected - retry after a short delay
          lastError = error
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1))) // Exponential backoff
          continue
        }

        // Not a deadlock or max retries reached - throw the error
        throw error
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Failed to call next number after retries')
  }
}
