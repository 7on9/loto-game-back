import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Group } from './group.entity'

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ nullable: true })
  avatar?: string

  @Column({ name: 'user_id', nullable: true })
  userId?: string

  @Column({ name: 'group_id', nullable: true })
  groupId?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => Group, group => group.players)
  @JoinColumn({ name: 'group_id' })
  group: Group
}

