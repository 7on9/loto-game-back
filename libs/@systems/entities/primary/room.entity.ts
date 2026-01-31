import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user.entity'
import { Group } from './group.entity'
import { RoomStatus } from '../../enums'

@Entity('rooms')
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
}

