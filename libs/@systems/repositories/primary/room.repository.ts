import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { Room } from '../../entities/primary'

@Injectable()
export class RoomRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {
    super()
  }

  get repository(): Repository<Room> {
    return this.roomRepository
  }

  async findByCreatorId(creatorId: string): Promise<Array<Room>> {
    return this.roomRepository.find({
      where: { creatorId },
      relations: ['group'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOneWithRelations(id: string): Promise<Room | null> {
    return this.roomRepository.findOne({
      where: { id },
      relations: ['group', 'group.players'],
    })
  }
}

