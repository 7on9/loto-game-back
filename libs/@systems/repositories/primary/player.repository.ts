import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { Player } from '../../entities/primary'

@Injectable()
export class PlayerRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {
    super()
  }

  get repository(): Repository<Player> {
    return this.playerRepository
  }

  async findByGroupId(groupId: string): Promise<Array<Player>> {
    return this.playerRepository.find({
      where: { groupId },
      order: { createdAt: 'ASC' },
    })
  }

  async deleteByGroupId(groupId: string): Promise<void> {
    await this.playerRepository.delete({ groupId })
  }
}






