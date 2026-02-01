import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { Game } from '../../entities/primary'
import { GameStatus } from '../../enums'

@Injectable()
export class GameRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  get repository(): Repository<Game> {
    return this.gameRepository
  }

  async findByStatus(status: GameStatus): Promise<Array<Game>> {
    return this.gameRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    })
  }

  async findOneWithRelations(id: string): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { id },
      relations: ['winner', 'gameCards', 'gameCards.card', 'gameCards.user'],
    })
  }

  async findOneForUpdate(id: string): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    })
  }

  async findOneWithCalledNumbers(id: string): Promise<Game | null> {
    const game = await this.gameRepository.findOne({
      where: { id },
      relations: ['calledNumbers'],
    })
    if (game && game.calledNumbers) {
      game.calledNumbers.sort((a, b) => a.calledAt.getTime() - b.calledAt.getTime())
    }
    return game
  }

  async findOneWithWinnerSnapshot(id: string): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { id },
      relations: ['winnerSnapshot', 'winnerSnapshot.user'],
    })
  }

  async findRecentGames(limit: number = 10): Promise<Array<Game>> {
    return this.gameRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  getQueryRunner() {
    return this.dataSource.createQueryRunner()
  }
}
