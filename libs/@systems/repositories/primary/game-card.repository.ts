import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { GameCard } from '../../entities/primary'

@Injectable()
export class GameCardRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(GameCard)
    private readonly gameCardRepository: Repository<GameCard>,
  ) {
    super()
  }

  get repository(): Repository<GameCard> {
    return this.gameCardRepository
  }

  async findByGameId(gameId: string): Promise<Array<GameCard>> {
    return this.gameCardRepository.find({
      where: { gameId },
      relations: ['card', 'user'],
      order: { selectedAt: 'ASC' },
    })
  }

  async findByGameIdAndUserId(gameId: string, userId: string): Promise<Array<GameCard>> {
    return this.gameCardRepository.find({
      where: { gameId, userId },
      relations: ['card', 'card.layouts'],
      order: { selectedAt: 'ASC' },
    })
  }

  async countByGameIdAndUserId(gameId: string, userId: string): Promise<number> {
    return this.gameCardRepository.count({
      where: { gameId, userId },
    })
  }

  async findOneByGameIdAndCardId(gameId: string, cardId: string): Promise<GameCard | null> {
    return this.gameCardRepository.findOne({
      where: { gameId, cardId },
      relations: ['user', 'card'],
    })
  }
}
