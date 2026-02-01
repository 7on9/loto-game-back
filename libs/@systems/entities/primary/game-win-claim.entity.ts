import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Game } from './game.entity'
import { User } from './user.entity'
import { Card } from './card.entity'

@Entity('game_win_claims')
@Index('ix_win_claims_game', ['gameId'])
@Index('ix_win_claims_user', ['userId'])
@Index('ix_win_claims_valid', ['isValid'])
export class GameWinClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'game_id' })
  gameId: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'varchar', length: 10, name: 'card_id' })
  cardId: string

  @Column({ type: 'jsonb', name: 'marked_numbers' })
  markedNumbers: Array<number>

  @Column({ type: 'boolean', name: 'is_valid' })
  isValid: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => Game, game => game.winClaims)
  @JoinColumn({ name: 'game_id' })
  game: Game

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Card)
  @JoinColumn({ name: 'card_id' })
  card: Card
}
