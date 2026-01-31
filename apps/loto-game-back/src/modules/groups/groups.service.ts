import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { GroupRepository, PlayerRepository } from '@libs/@systems/repositories/primary'
import { CreateGroupDto, UpdateGroupDto } from '@libs/@systems/dtos'
import { Group, Player } from '@libs/@systems/entities/primary'
import { DataSource } from 'typeorm'

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, createGroupDto: CreateGroupDto): Promise<Group> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Create group
      const group = queryRunner.manager.create(Group, {
        name: createGroupDto.name,
        description: createGroupDto.description,
        creatorId: userId,
      })
      const savedGroup = await queryRunner.manager.save(group)

      // Create players
      if (createGroupDto.players.length) {
        const players = createGroupDto.players.map(playerDto =>
          queryRunner.manager.create(Player, {
            ...playerDto,
            groupId: savedGroup.id,
          }),
        )
        await queryRunner.manager.save(players)
      }

      await queryRunner.commitTransaction()

      // Fetch the complete group with players
      return await this.findOne(savedGroup.id)
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async findAll(userId: string): Promise<Array<Group>> {
    return this.groupRepository.findByCreatorId(userId)
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepository.findOneWithPlayers(id)
    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`)
    }
    return group
  }

  async update(id: string, userId: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id)

    if (group.creatorId !== userId) {
      throw new BadRequestException('You are not authorized to update this group')
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Update group info
      if (updateGroupDto.name || updateGroupDto.description) {
        await queryRunner.manager.update(Group, id, {
          name: updateGroupDto.name ?? group.name,
          description: updateGroupDto.description ?? group.description,
        })
      }

      // Update players if provided
      if (updateGroupDto.players) {
        const existingPlayers = await this.playerRepository.findByGroupId(id)
        const existingPlayerIds = existingPlayers.map(p => p.id)

        for (const playerDto of updateGroupDto.players) {
          if (playerDto.id && existingPlayerIds.includes(playerDto.id)) {
            // Update existing player
            await queryRunner.manager.update(Player, playerDto.id, {
              name: playerDto.name,
              avatar: playerDto.avatar,
              userId: playerDto.userId,
            })
          } else if (!playerDto.id) {
            // Create new player
            const newPlayer = queryRunner.manager.create(Player, {
              ...playerDto,
              groupId: id,
            })
            await queryRunner.manager.save(newPlayer)
          }
        }

        // Delete players that are no longer in the list
        const updatedPlayerIds = updateGroupDto.players
          .filter(p => p.id)
          .map(p => p.id)
        const playersToDelete = existingPlayers.filter(
          p => !updatedPlayerIds.includes(p.id),
        )
        
        if (playersToDelete.length) {
          await queryRunner.manager.delete(
            Player,
            playersToDelete.map(p => p.id),
          )
        }
      }

      await queryRunner.commitTransaction()

      return await this.findOne(id)
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    const group = await this.findOne(id)

    if (group.creatorId !== userId) {
      throw new BadRequestException('You are not authorized to delete this group')
    }

    await this.playerRepository.deleteByGroupId(id)
    await this.groupRepository.repository.delete(id)
  }
}






