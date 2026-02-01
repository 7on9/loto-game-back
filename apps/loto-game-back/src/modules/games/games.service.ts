import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { GameRepository, CardRepository, GameCardRepository } from '@libs/@systems/repositories/primary'
import { Game, Card, GameCard } from '@libs/@systems/entities/primary'
import { GameStatus } from '@libs/@systems/enums'
import { SelectCardDto, CardAvailabilityDto } from '@libs/@systems/dtos'

@Injectable()
export class GamesService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly cardRepository: CardRepository,
    private readonly gameCardRepository: GameCardRepository,
    private readonly dataSource: DataSource,
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

  async selectCard(gameId: string, userId: string, selectCardDto: SelectCardDto): Promise<GameCard> {
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
        throw new BadRequestException(`Game is not in PREPARE status. Current status: ${game.status}`)
      }

      // 2. Check card exists and is active
      const card = await queryRunner.manager.findOne(Card, {
        where: { id: selectCardDto.cardId, isActive: true },
      })

      if (!card) {
        throw new NotFoundException(`Card with ID ${selectCardDto.cardId} not found or not active`)
      }

      // 3. Check card is not already taken
      const existingGameCard = await queryRunner.manager.findOne(GameCard, {
        where: { gameId, cardId: selectCardDto.cardId },
      })

      if (existingGameCard) {
        throw new BadRequestException(`Card ${selectCardDto.cardId} is already taken`)
      }

      // 4. Check user hasn't selected 2 cards already
      const userCardCount = await queryRunner.manager.count(GameCard, {
        where: { gameId, userId },
      })

      if (userCardCount >= 2) {
        throw new BadRequestException('You have already selected the maximum of 2 cards')
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
      return savedGameCard
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      // Release query runner
      await queryRunner.release()
    }
  }
}
