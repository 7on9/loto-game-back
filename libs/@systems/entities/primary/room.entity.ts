import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, Unique } from 'typeorm'
import { User } from './user.entity'
import { Group } from './group.entity'
import { Game } from './game.entity'
import { RoomStatus } from '../../enums'

@Entity('rooms')
@Unique('ux_rooms_code', ['code'])
@Index('ix_rooms_code', ['code'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ name: 'creator_id' })
  creatorId: string

  @Column({ name: 'group_id', nullable: true })
  groupId?: string

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING
  })
  status: RoomStatus

  // Template field - not used in current implementation
  @Column({ name: 'game_mode', nullable: true })
  gameMode?: string

  @Column({ type: 'varchar', length: 6 })
  code: string // Unique 6-digit code (000000-999999)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => User, user => user.rooms)
  @JoinColumn({ name: 'creator_id' })
  creator: User

  @ManyToOne(() => Group, group => group.rooms)
  @JoinColumn({ name: 'group_id' })
  group?: Group

  @OneToMany(() => Game, game => game.room)
  games: Array<Game>
}

