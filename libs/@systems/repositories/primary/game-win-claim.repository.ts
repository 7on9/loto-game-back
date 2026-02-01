import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { GameWinClaim } from '../../entities/primary'

@Injectable()
export class GameWinClaimRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(GameWinClaim)
    private readonly gameWinClaimRepository: Repository<GameWinClaim>,
  ) {
    super()
  }

  get repository(): Repository<GameWinClaim> {
    return this.gameWinClaimRepository
  }

  async findByGameId(gameId: string): Promise<Array<GameWinClaim>> {
    return this.gameWinClaimRepository.find({
      where: { gameId },
      relations: ['user', 'card'],
      order: { createdAt: 'DESC' },
    })
  }

  async findByUserId(userId: string): Promise<Array<GameWinClaim>> {
    return this.gameWinClaimRepository.find({
      where: { userId },
      relations: ['game', 'card'],
      order: { createdAt: 'DESC' },
    })
  }

  async findValidClaimsByGameId(gameId: string): Promise<Array<GameWinClaim>> {
    return this.gameWinClaimRepository.find({
      where: { gameId, isValid: true },
      relations: ['user', 'card'],
      order: { createdAt: 'ASC' },
    })
  }

  async findInvalidClaimsByGameId(gameId: string): Promise<Array<GameWinClaim>> {
    return this.gameWinClaimRepository.find({
      where: { gameId, isValid: false },
      relations: ['user', 'card'],
      order: { createdAt: 'DESC' },
    })
  }

  async findByGameIdAndUserId(gameId: string, userId: string): Promise<Array<GameWinClaim>> {
    return this.gameWinClaimRepository.find({
      where: { gameId, userId },
      relations: ['card'],
      order: { createdAt: 'DESC' },
    })
  }

  async countByGameId(gameId: string): Promise<number> {
    return this.gameWinClaimRepository.count({
      where: { gameId },
    })
  }
}
