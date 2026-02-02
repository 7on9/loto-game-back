import { Test, TestingModule } from '@nestjs/testing'
import { DataSource, QueryRunner } from 'typeorm'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { GamesService } from './games.service'
import { GameSSEService } from './game-sse.service'
import {
  GameRepository,
  CardRepository,
  GameCardRepository,
  GameNumberOrderRepository,
  GameCalledNumberRepository,
} from '@libs/@systems/repositories/primary'
import { Game, Card, GameCard } from '@libs/@systems/entities/primary'
import { GameStatus } from '@libs/@systems/enums'
import { PickCardDto } from '@libs/@systems/dtos'

describe('GamesService - Pick Card Flow', () => {
  let service: GamesService
  let sseService: GameSSEService
  let gameRepository: jest.Mocked<GameRepository>
  let cardRepository: jest.Mocked<CardRepository>
  let gameCardRepository: jest.Mocked<GameCardRepository>
  let dataSource: jest.Mocked<DataSource>
  let queryRunner: jest.Mocked<QueryRunner>

  const mockGameId = 'game-123'
  const mockUserId = 'user-456'
  const mockCardId = 'C01'

  beforeEach(async () => {
    // Create mock query runner
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
      },
    } as any

    // Create mock data source
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as any

    // Create mock repositories
    gameRepository = {
      findOneWithRelations: jest.fn(),
    } as any

    cardRepository = {
      findActiveCards: jest.fn(),
    } as any

    gameCardRepository = {
      findByGameId: jest.fn(),
    } as any

    // Create mock SSE service
    sseService = {
      broadcastToGame: jest.fn(),
      addClient: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: GameRepository,
          useValue: gameRepository,
        },
        {
          provide: CardRepository,
          useValue: cardRepository,
        },
        {
          provide: GameCardRepository,
          useValue: gameCardRepository,
        },
        {
          provide: GameNumberOrderRepository,
          useValue: {},
        },
        {
          provide: GameCalledNumberRepository,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: GameSSEService,
          useValue: sseService,
        },
      ],
    }).compile()

    service = module.get<GamesService>(GamesService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('pickCard', () => {
    const pickCardDto: PickCardDto = { cardId: mockCardId }

    it('should successfully pick a card and broadcast SSE event', async () => {
      // Mock game exists and is in PREPARE status
      const mockGame: Partial<Game> = {
        id: mockGameId,
        status: GameStatus.PREPARE,
      }
      queryRunner.manager.findOne
        .mockResolvedValueOnce(mockGame as Game) // Game lookup
        .mockResolvedValueOnce({ id: mockCardId, isActive: true } as Card) // Card lookup
        .mockResolvedValueOnce(null) // Existing game card (not found)

      queryRunner.manager.count.mockResolvedValueOnce(0) // User card count

      const mockGameCard: Partial<GameCard> = {
        id: 'gc-123',
        gameId: mockGameId,
        cardId: mockCardId,
        userId: mockUserId,
      }
      queryRunner.manager.create.mockReturnValue(mockGameCard as GameCard)
      queryRunner.manager.save.mockResolvedValue(mockGameCard as GameCard)

      const result = await service.pickCard(mockGameId, mockUserId, pickCardDto)

      expect(result).toEqual(mockGameCard)
      expect(queryRunner.commitTransaction).toHaveBeenCalled()
      expect(sseService.broadcastToGame).toHaveBeenCalledWith(mockGameId, {
        type: 'card_picked',
        data: {
          cardId: mockCardId,
          userId: mockUserId,
          gameId: mockGameId,
        },
      })
    })

    it('should throw NotFoundException if game does not exist', async () => {
      queryRunner.manager.findOne.mockResolvedValueOnce(null) // Game not found

      await expect(service.pickCard(mockGameId, mockUserId, pickCardDto)).rejects.toThrow(
        NotFoundException,
      )
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled()
      expect(sseService.broadcastToGame).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException if game is not in PREPARE status', async () => {
      const mockGame: Partial<Game> = {
        id: mockGameId,
        status: GameStatus.STARTED,
      }
      queryRunner.manager.findOne.mockResolvedValueOnce(mockGame as Game)

      await expect(service.pickCard(mockGameId, mockUserId, pickCardDto)).rejects.toThrow(
        BadRequestException,
      )
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled()
      expect(sseService.broadcastToGame).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException if card does not exist', async () => {
      const mockGame: Partial<Game> = {
        id: mockGameId,
        status: GameStatus.PREPARE,
      }
      queryRunner.manager.findOne
        .mockResolvedValueOnce(mockGame as Game) // Game found
        .mockResolvedValueOnce(null) // Card not found

      await expect(service.pickCard(mockGameId, mockUserId, pickCardDto)).rejects.toThrow(
        NotFoundException,
      )
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled()
    })

    it('should throw BadRequestException if card is already taken', async () => {
      const mockGame: Partial<Game> = {
        id: mockGameId,
        status: GameStatus.PREPARE,
      }
      const mockExistingGameCard: Partial<GameCard> = {
        gameId: mockGameId,
        cardId: mockCardId,
        userId: 'other-user',
      }

      queryRunner.manager.findOne
        .mockResolvedValueOnce(mockGame as Game) // Game found
        .mockResolvedValueOnce({ id: mockCardId, isActive: true } as Card) // Card found
        .mockResolvedValueOnce(mockExistingGameCard as GameCard) // Card already taken

      await expect(service.pickCard(mockGameId, mockUserId, pickCardDto)).rejects.toThrow(
        BadRequestException,
      )
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled()
    })

    it('should throw BadRequestException if user has already selected 2 cards', async () => {
      const mockGame: Partial<Game> = {
        id: mockGameId,
        status: GameStatus.PREPARE,
      }

      queryRunner.manager.findOne
        .mockResolvedValueOnce(mockGame as Game) // Game found
        .mockResolvedValueOnce({ id: mockCardId, isActive: true } as Card) // Card found
        .mockResolvedValueOnce(null) // Card not taken

      queryRunner.manager.count.mockResolvedValueOnce(2) // User already has 2 cards

      await expect(service.pickCard(mockGameId, mockUserId, pickCardDto)).rejects.toThrow(
        BadRequestException,
      )
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled()
    })
  })

  describe('getGameStateForSSE', () => {
    it('should return game state with status and cards', async () => {
      const mockGame: Partial<Game> = {
        id: mockGameId,
        status: GameStatus.PREPARE,
      }
      gameRepository.findOneWithRelations.mockResolvedValue(mockGame as Game)

      const mockCards = [
        { id: 'C01', pairId: 'card-red', colorTheme: 'red', isActive: true },
        { id: 'C02', pairId: 'card-red', colorTheme: 'red', isActive: true },
      ]
      cardRepository.findActiveCards.mockResolvedValue(mockCards as Array<Card>)
      gameCardRepository.findByGameId.mockResolvedValue([])

      const result = await service.getGameStateForSSE(mockGameId)

      expect(result.status).toBe(GameStatus.PREPARE)
      expect(result.cards).toHaveLength(2)
      expect(result.cards[0].id).toBe('C01')
    })

    it('should throw NotFoundException if game does not exist', async () => {
      gameRepository.findOneWithRelations.mockResolvedValue(null)

      await expect(service.getGameStateForSSE(mockGameId)).rejects.toThrow(NotFoundException)
    })
  })
})
