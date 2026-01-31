import { DynamicModule, Module } from '@nestjs/common'
import { configEnv } from '@libs/@config/env'
import * as allModules from './modules'
import { TechUtils } from '@libs/@core/utils'
import { JwtModule } from '@nestjs/jwt'
import { LoggerModule } from '@libs/@core/logger'

const envConfig = configEnv()
const multipleDatabaseModule: DynamicModule[] = TechUtils.dbModules(envConfig.DBS)

const { JWT_EXPIRY, JWT_SECRET } = configEnv()
const isTestEnv = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID
if (!isTestEnv && (!JWT_SECRET || `${JWT_SECRET}`.trim() === '')) {
  throw new Error('JWT_SECRET is required')
}

const globalModules = [
  LoggerModule,
  JwtModule.register({
    global: true,
    secret: JWT_SECRET || 'test-secret-key-for-testing-only',
    signOptions: {
      expiresIn: 3600,
      algorithm: 'HS512' as const
    },
  }),
]

const modules = Object.values(allModules).filter(
  m => typeof m === 'function' || (typeof m === 'object' && m !== null && ('module' in m || 'imports' in m)),
)

@Module({
  imports: [
    ...multipleDatabaseModule,
    ...globalModules,
    ...(modules as Array<any>),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
