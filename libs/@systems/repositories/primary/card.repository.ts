import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { Card } from '../../entities/primary'

@Injectable()
export class CardRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {
    super()
  }

  get repository(): Repository<Card> {
    return this.cardRepository
  }

  async findActiveCards(): Promise<Array<Card>> {
    return this.cardRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    })
  }

  async findByPairId(pairId: string): Promise<Array<Card>> {
    return this.cardRepository.find({
      where: { pairId, isActive: true },
      order: { id: 'ASC' },
    })
  }

  async findOneWithLayouts(id: string): Promise<Card | null> {
    return this.cardRepository.findOne({
      where: { id },
      relations: ['layouts'],
    })
  }
}
