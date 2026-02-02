import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { RoomPlayer } from '../../entities/primary'

@Injectable()
export class RoomPlayerRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(RoomPlayer)
    private readonly roomPlayerRepository: Repository<RoomPlayer>,
  ) {
    super()
  }

  get repository(): Repository<RoomPlayer> {
    return this.roomPlayerRepository
  }

  async findByRoomId(roomId: string): Promise<Array<RoomPlayer>> {
    return this.roomPlayerRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    })
  }

  async findByRoomIdAndUserId(roomId: string, userId: string): Promise<RoomPlayer | null> {
    return this.roomPlayerRepository.findOne({
      where: { roomId, userId },
    })
  }

  async countByRoomId(roomId: string): Promise<number> {
    return this.roomPlayerRepository.count({
      where: { roomId },
    })
  }
}
