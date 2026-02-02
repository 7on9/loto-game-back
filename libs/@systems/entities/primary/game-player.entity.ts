import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm'
import { Game } from './game.entity'
import { User } from './user.entity'

@Entity('game_players')
@Unique('ux_game_player', ['gameId', 'userId'])
@Index('ix_game_players_game', ['gameId'])
export class GamePlayer {
  @PrimaryColumn({ type: 'uuid', name: 'game_id' })
  gameId: string

  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'game_id' })
  game: Game

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
