import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { Group } from '../../entities/primary'

@Injectable()
export class GroupRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {
    super()
  }

  get repository(): Repository<Group> {
    return this.groupRepository
  }

  async findByCreatorId(creatorId: string): Promise<Array<Group>> {
    return this.groupRepository.find({
      where: { creatorId },
      relations: ['players'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOneWithPlayers(id: string): Promise<Group | null> {
    return this.groupRepository.findOne({
      where: { id },
      relations: ['players'],
    })
  }
}






