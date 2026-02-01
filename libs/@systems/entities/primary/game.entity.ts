import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, Index } from 'typeorm'
import { User } from './user.entity'
import { GameStatus } from '../../enums'
import { GameCard } from './game-card.entity'
import { GameNumberOrder } from './game-number-order.entity'
import { GameCalledNumber } from './game-called-number.entity'
import { GameWinClaim } from './game-win-claim.entity'
import { GameWinnerSnapshot } from './game-winner-snapshot.entity'

@Entity('games')
@Index('ix_games_status', ['status'])
@Index('ix_games_created_at', ['createdAt'])
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string

  @Column({
    type: 'varchar',
    length: 20,
    default: GameStatus.PREPARE
  })
  status: GameStatus // PREPARE / STARTED / FINISHED

  @Column({ type: 'uuid', nullable: true, name: 'winner_user_id' })
  winnerUserId?: string

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'finished_at' })
  finishedAt?: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => User)
  @JoinColumn({ name: 'winner_user_id' })
  winner?: User

  @OneToMany(() => GameCard, gameCard => gameCard.game)
  gameCards: Array<GameCard>

  @OneToMany(() => GameNumberOrder, numberOrder => numberOrder.game)
  numberOrder: Array<GameNumberOrder>

  @OneToMany(() => GameCalledNumber, calledNumber => calledNumber.game)
  calledNumbers: Array<GameCalledNumber>

  @OneToMany(() => GameWinClaim, winClaim => winClaim.game)
  winClaims: Array<GameWinClaim>

  @OneToOne(() => GameWinnerSnapshot, snapshot => snapshot.game)
  winnerSnapshot?: GameWinnerSnapshot
}
