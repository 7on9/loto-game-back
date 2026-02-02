import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { GamePlayer } from '../../entities/primary'

@Injectable()
export class GamePlayerRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(GamePlayer)
    private readonly gamePlayerRepository: Repository<GamePlayer>,
  ) {
    super()
  }

  get repository(): Repository<GamePlayer> {
    return this.gamePlayerRepository
  }

  async findByGameId(gameId: string): Promise<Array<GamePlayer>> {
    return this.gamePlayerRepository.find({
      where: { gameId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    })
  }

  async findByGameIdAndUserId(gameId: string, userId: string): Promise<GamePlayer | null> {
    return this.gamePlayerRepository.findOne({
      where: { gameId, userId },
    })
  }

  async countByGameId(gameId: string): Promise<number> {
    return this.gamePlayerRepository.count({
      where: { gameId },
    })
  }
}
