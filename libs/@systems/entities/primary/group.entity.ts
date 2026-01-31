import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { User } from './user.entity'
import { Player } from './player.entity'
import { Room } from './room.entity'

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ nullable: true })
  description?: string

  @Column({ name: 'creator_id' })
  creatorId: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => User, user => user.groups)
  @JoinColumn({ name: 'creator_id' })
  creator: User

  @OneToMany(() => Player, player => player.group)
  players: Array<Player>

  @OneToMany(() => Room, room => room.group)
  rooms: Array<Room>
}






