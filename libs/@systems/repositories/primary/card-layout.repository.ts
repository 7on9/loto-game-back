import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrimaryRepo } from '@libs/@core/repository'
import { CardLayout } from '../../entities/primary'

@Injectable()
export class CardLayoutRepository extends PrimaryRepo {
  constructor(
    @InjectRepository(CardLayout)
    private readonly cardLayoutRepository: Repository<CardLayout>,
  ) {
    super()
  }

  get repository(): Repository<CardLayout> {
    return this.cardLayoutRepository
  }

  async findByCardId(cardId: string): Promise<Array<CardLayout>> {
    return this.cardLayoutRepository.find({
      where: { cardId },
      order: { rowIdx: 'ASC', colIdx: 'ASC' },
    })
  }

  async findByCardIdAndNumber(cardId: string, number: number): Promise<CardLayout | null> {
    return this.cardLayoutRepository.findOne({
      where: { cardId, number },
    })
  }
}
