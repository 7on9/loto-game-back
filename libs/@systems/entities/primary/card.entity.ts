import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany, Index } from 'typeorm'
import { CardLayout } from './card-layout.entity'

@Entity('cards')
@Index('ix_cards_pair_id', ['pairId'])
@Index('ix_cards_active', ['isActive'])
export class Card {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string // C01..C18

  @Column({ type: 'varchar', length: 15, name: 'pair_id' })
  pairId: string // card-red, card-orange, card-purple, card-green, card-blue, card-yellow

  @Column({ type: 'varchar', length: 20, name: 'color_theme' })
  colorTheme: string

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @OneToMany(() => CardLayout, layout => layout.card)
  layouts: Array<CardLayout>
}
