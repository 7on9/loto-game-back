import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Game } from './game.entity'
import { Card } from './card.entity'
import { User } from './user.entity'

@Entity('game_cards')
@Index('ix_game_cards_user', ['gameId', 'userId'])
export class GameCard {
  @PrimaryColumn({ type: 'uuid', name: 'game_id' })
  gameId: string

  @PrimaryColumn({ type: 'varchar', length: 10, name: 'card_id' })
  cardId: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @CreateDateColumn({ name: 'selected_at' })
  selectedAt: Date

  @ManyToOne(() => Game, game => game.gameCards)
  @JoinColumn({ name: 'game_id' })
  game: Game

  @ManyToOne(() => Card)
  @JoinColumn({ name: 'card_id' })
  card: Card

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
