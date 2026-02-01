import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Game } from './game.entity'

@Entity('game_called_numbers')
@Index('ix_called_numbers_game', ['gameId'])
export class GameCalledNumber {
  @PrimaryColumn({ type: 'uuid', name: 'game_id' })
  gameId: string

  @PrimaryColumn({ type: 'int' })
  number: number

  @CreateDateColumn({ name: 'called_at' })
  calledAt: Date

  @ManyToOne(() => Game, game => game.calledNumbers)
  @JoinColumn({ name: 'game_id' })
  game: Game
}
