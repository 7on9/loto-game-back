import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { Game } from './game.entity'

@Entity('game_number_order')
@Unique('ux_game_number_order', ['gameId', 'number'])
export class GameNumberOrder {
  @PrimaryColumn({ type: 'uuid', name: 'game_id' })
  gameId: string

  @PrimaryColumn({ type: 'int' })
  position: number // 1..90

  @Column({ type: 'int' })
  number: number // 1..90

  @ManyToOne(() => Game, game => game.numberOrder)
  @JoinColumn({ name: 'game_id' })
  game: Game
}
