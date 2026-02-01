import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm'
import { Card } from './card.entity'

@Entity('card_layouts')
@Unique('ux_card_number', ['cardId', 'number'])
export class CardLayout {
  @PrimaryColumn({ type: 'varchar', length: 10, name: 'card_id' })
  cardId: string

  @PrimaryColumn({ type: 'int', name: 'row_idx' })
  rowIdx: number

  @PrimaryColumn({ type: 'int', name: 'col_idx' })
  colIdx: number

  @Column({ type: 'int' })
  number: number // 1-90

  @ManyToOne(() => Card, card => card.layouts)
  @JoinColumn({ name: 'card_id' })
  card: Card
}
