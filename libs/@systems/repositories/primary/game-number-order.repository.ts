import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { GameNumberOrder } from '../../entities/primary'

@Injectable()
export class GameNumberOrderRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(GameNumberOrder)
    private readonly gameNumberOrderRepository: Repository<GameNumberOrder>,
  ) {
    super()
  }

  get repository(): Repository<GameNumberOrder> {
    return this.gameNumberOrderRepository
  }

  async findByGameId(gameId: string): Promise<Array<GameNumberOrder>> {
    return this.gameNumberOrderRepository.find({
      where: { gameId },
      order: { position: 'ASC' },
    })
  }

  async findByGameIdAndPosition(gameId: string, position: number): Promise<GameNumberOrder | null> {
    return this.gameNumberOrderRepository.findOne({
      where: { gameId, position },
    })
  }

  async findByGameIdAndNumber(gameId: string, number: number): Promise<GameNumberOrder | null> {
    return this.gameNumberOrderRepository.findOne({
      where: { gameId, number },
    })
  }

  async getNextNumber(gameId: string, currentPosition: number): Promise<GameNumberOrder | null> {
    return this.gameNumberOrderRepository.findOne({
      where: { gameId, position: currentPosition + 1 },
    })
  }
}
