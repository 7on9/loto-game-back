import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Group } from './group.entity'
import { Room } from './room.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  @Column()
  username: string

  @Column({ nullable: true })
  avatar?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => Group, group => group.creator)
  groups: Array<Group>

  @OneToMany(() => Room, room => room.creator)
  rooms: Array<Room>
}






