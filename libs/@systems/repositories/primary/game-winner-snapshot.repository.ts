import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { GameWinnerSnapshot } from '../../entities/primary'

@Injectable()
export class GameWinnerSnapshotRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(GameWinnerSnapshot)
    private readonly gameWinnerSnapshotRepository: Repository<GameWinnerSnapshot>,
  ) {
    super()
  }

  get repository(): Repository<GameWinnerSnapshot> {
    return this.gameWinnerSnapshotRepository
  }

  async findByGameId(gameId: string): Promise<GameWinnerSnapshot | null> {
    return this.gameWinnerSnapshotRepository.findOne({
      where: { gameId },
      relations: ['user', 'game'],
    })
  }

  async findByUserId(userId: string): Promise<Array<GameWinnerSnapshot>> {
    return this.gameWinnerSnapshotRepository.find({
      where: { userId },
      relations: ['game', 'user'],
      order: { createdAt: 'DESC' },
    })
  }
}
