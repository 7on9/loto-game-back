import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError } from 'typeorm'
import { RoomRepository, GroupRepository, RoomPlayerRepository } from '@libs/@systems/repositories/primary'
import { CreateRoomDto } from '@libs/@systems/dtos'
import { Room, RoomPlayer } from '@libs/@systems/entities/primary'
import { RoomStatus } from '@libs/@systems/enums'

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name)

  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly groupRepository: GroupRepository,
    private readonly roomPlayerRepository: RoomPlayerRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a room with unique 6-digit code
   * Returns: { room_id, code }
   */
  async create(userId: string, createRoomDto: CreateRoomDto): Promise<{ room_id: string; code: string }> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
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

      // Generate unique 6-digit code and create room (with retry on unique constraint violation)
      let savedRoom: Room | null = null
      let code: string | null = null
      const maxCodeAttempts = 10

      for (let codeAttempt = 0; codeAttempt < maxCodeAttempts; codeAttempt++) {
        try {
          // Generate random 6-digit code (100000-999999)
          code = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0')

          // 1. INSERT room (with unique code)
          const room = queryRunner.manager.create(Room, {
            name: createRoomDto.name,
            creatorId: userId,
            groupId: createRoomDto.groupId,
            gameMode: createRoomDto.gameMode,
            status: RoomStatus.WAITING,
            code,
          })

          savedRoom = await queryRunner.manager.save(room)
          break // Success, exit retry loop
        } catch (error) {
          // If unique constraint violation, retry with new code
          if (
            error instanceof QueryFailedError &&
            (error as any).code === '23505' // PostgreSQL unique violation
          ) {
            if (codeAttempt === maxCodeAttempts - 1) {
              throw new Error('Failed to generate unique room code after maximum attempts')
            }
            continue // Retry with new code
          }
          throw error // Re-throw other errors
        }
      }

      // TypeScript guard: ensure variables are assigned
      if (!savedRoom || !code) {
        throw new Error('Failed to create room: savedRoom or code is null')
      }

      // Commit transaction
      await queryRunner.commitTransaction()

      this.logger.log(`create_room: roomId=${savedRoom.id}, code=${code}, userId=${userId}`)

      return {
        room_id: savedRoom.id,
        code,
      }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
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

  /**
   * Join a room by code (idempotent - ignores duplicates)
   * Prevents joining if room has a game (status is IN_PROGRESS or FINISHED)
   */
  async joinRoomByCode(code: string, userId: string): Promise<{ room_id: string }> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. Validate room exists by code
      const room = await queryRunner.manager.findOne(Room, {
        where: { code },
        lock: { mode: 'pessimistic_write' },
      })

      if (!room) {
        throw new NotFoundException(`Room with code ${code} not found`)
      }

      // 2. Check if room is still accepting players (must be WAITING status)
      if (room.status !== RoomStatus.WAITING) {
        throw new BadRequestException('Room is no longer accepting new players')
      }

      // 3. Check if already joined (idempotent)
      const existingPlayer = await queryRunner.manager.findOne(RoomPlayer, {
        where: { roomId: room.id, userId },
      })

      if (!existingPlayer) {
        // 4. Insert room_players
        const roomPlayer = queryRunner.manager.create(RoomPlayer, {
          roomId: room.id,
          userId,
        })
        await queryRunner.manager.save(roomPlayer)
      }

      // Commit transaction
      await queryRunner.commitTransaction()

      this.logger.log(`join_room_by_code: roomId=${room.id}, code=${code}, userId=${userId}`)

      return {
        room_id: room.id,
      }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }
}

