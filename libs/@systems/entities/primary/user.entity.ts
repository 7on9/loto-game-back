import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Group } from './group.entity'
import { Room } from './room.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 50 })
  username: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @OneToMany(() => Group, group => group.creator)
  groups: Array<Group>

  @OneToMany(() => Room, room => room.creator)
  rooms: Array<Room>
}






