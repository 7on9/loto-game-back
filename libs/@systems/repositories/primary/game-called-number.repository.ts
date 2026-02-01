import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { GameCalledNumber } from '../../entities/primary'

@Injectable()
export class GameCalledNumberRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(GameCalledNumber)
    private readonly gameCalledNumberRepository: Repository<GameCalledNumber>,
  ) {
    super()
  }

  get repository(): Repository<GameCalledNumber> {
    return this.gameCalledNumberRepository
  }

  async findByGameId(gameId: string): Promise<Array<GameCalledNumber>> {
    return this.gameCalledNumberRepository.find({
      where: { gameId },
      order: { calledAt: 'ASC' },
    })
  }

  async findByGameIdAndNumber(gameId: string, number: number): Promise<GameCalledNumber | null> {
    return this.gameCalledNumberRepository.findOne({
      where: { gameId, number },
    })
  }

  async getCalledNumbersArray(gameId: string): Promise<Array<number>> {
    const calledNumbers = await this.findByGameId(gameId)
    return calledNumbers.map(cn => cn.number)
  }

  async countByGameId(gameId: string): Promise<number> {
    return this.gameCalledNumberRepository.count({
      where: { gameId },
    })
  }

  async isNumberCalled(gameId: string, number: number): Promise<boolean> {
    const count = await this.gameCalledNumberRepository.count({
      where: { gameId, number },
    })
    return count > 0
  }
}
