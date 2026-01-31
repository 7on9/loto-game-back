import { configEnv } from '../env'
import { DataSource } from 'typeorm'

const envConfig = configEnv()

export const TestDataSource = new DataSource({
  ...envConfig.DBS[0],
  entities: ['apps/loto-game-back/src/**/*.entity.ts'],
  migrations: ['libs/@systems/migrations/primary/**/*.ts'],
  database: envConfig.DBS[0].database + '_test',
  synchronize: true,
  dropSchema: true,
})





