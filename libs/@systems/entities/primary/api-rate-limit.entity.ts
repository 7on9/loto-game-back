import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity('api_rate_limits')
export class ApiRateLimit {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string

  @PrimaryColumn({ type: 'varchar', length: 100 })
  endpoint: string

  @Column({ type: 'int', default: 0 })
  counter: number

  @Column({ type: 'timestamp', name: 'window_start' })
  windowStart: Date
}
