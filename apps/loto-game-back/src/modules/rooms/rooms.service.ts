import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { RoomRepository, GroupRepository } from '@libs/@systems/repositories/primary'
import { CreateRoomDto } from '@libs/@systems/dtos'
import { Room } from '@libs/@systems/entities/primary'
import { RoomStatus } from '@libs/@systems/enums'

@Injectable()
export class RoomsService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly groupRepository: GroupRepository,
  ) {}

  async create(userId: string, createRoomDto: CreateRoomDto): Promise<Room> {
    // If groupId is provided, verify it exists and belongs to user
    if (createRoomDto.groupId) {
      const group = await this.groupRepository.findOneWithPlayers(createRoomDto.groupId)
      if (!group) {
        throw new NotFoundException(`Group with ID ${createRoomDto.groupId} not found`)
      }

      if (group.creatorId !== userId) {
        throw new BadRequestException('You are not authorized to create a room with this group')
      }
    }

    const room = this.roomRepository.repository.create({
      name: createRoomDto.name,
      creatorId: userId,
      groupId: createRoomDto.groupId,
      gameMode: createRoomDto.gameMode,
      status: RoomStatus.WAITING,
    })

    return this.roomRepository.repository.save(room)
  }

  async findAll(userId: string): Promise<Array<Room>> {
    return this.roomRepository.findByCreatorId(userId)
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOneWithRelations(id)
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`)
    }
    return room
  }

  async updateStatus(id: string, status: RoomStatus): Promise<Room> {
    const room = await this.findOne(id)
    room.status = status
    return this.roomRepository.repository.save(room)
  }
}

