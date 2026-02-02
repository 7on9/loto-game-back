import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm'
import { Room } from './room.entity'
import { User } from './user.entity'

@Entity('room_players')
@Unique('ux_room_player', ['roomId', 'userId'])
@Index('ix_room_players_room', ['roomId'])
export class RoomPlayer {
  @PrimaryColumn({ type: 'uuid', name: 'room_id' })
  roomId: string

  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
