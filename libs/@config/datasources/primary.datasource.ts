import * as dotenv from 'dotenv'
dotenv.config()

import { configEnv } from '../env'
import { DataSource } from 'typeorm'

const envConfig = configEnv()
export const PrimaryDataSource = new DataSource({
  ...envConfig.DBS[0],
  entities: ['libs/@systems/entities/primary/*.entity.ts'],
  migrations: ['libs/@systems/migrations/primary/*.ts'],
} as any)
