import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { ApiRateLimit } from '../../entities/primary'

@Injectable()
export class ApiRateLimitRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(ApiRateLimit)
    private readonly apiRateLimitRepository: Repository<ApiRateLimit>,
  ) {
    super()
  }

  get repository(): Repository<ApiRateLimit> {
    return this.apiRateLimitRepository
  }

  async findByUserIdAndEndpoint(userId: string, endpoint: string): Promise<ApiRateLimit | null> {
    return this.apiRateLimitRepository.findOne({
      where: { userId, endpoint },
    })
  }

  async incrementCounter(userId: string, endpoint: string, windowStart: Date): Promise<void> {
    await this.apiRateLimitRepository.upsert(
      {
        userId,
        endpoint,
        counter: 1,
        windowStart,
      },
      {
        conflictPaths: ['userId', 'endpoint'],
        skipUpdateIfNoValuesChanged: true,
      },
    )

    await this.apiRateLimitRepository.increment(
      { userId, endpoint },
      'counter',
      1,
    )
  }

  async resetCounter(userId: string, endpoint: string, windowStart: Date): Promise<void> {
    await this.apiRateLimitRepository.upsert(
      {
        userId,
        endpoint,
        counter: 1,
        windowStart,
      },
      {
        conflictPaths: ['userId', 'endpoint'],
      },
    )
  }
}
