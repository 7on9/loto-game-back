import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm'
import { Game } from './game.entity'
import { User } from './user.entity'

@Entity('game_winner_snapshot')
export class GameWinnerSnapshot {
  @PrimaryColumn({ type: 'uuid', name: 'game_id' })
  gameId: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'varchar', length: 10, name: 'card_id' })
  cardId: string

  @Column({ type: 'jsonb', name: 'called_numbers' })
  calledNumbers: Array<number>

  @Column({ type: 'varchar', length: 50, name: 'winning_pattern' })
  winningPattern: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @OneToOne(() => Game, game => game.winnerSnapshot)
  @JoinColumn({ name: 'game_id' })
  game: Game

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
