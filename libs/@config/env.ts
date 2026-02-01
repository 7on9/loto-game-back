import { join } from 'path'
import { DataSourceOptions } from 'typeorm'

const stringToBoolean = (value: string | boolean) => {
  return Boolean(JSON.parse(`${value}`))
}

export type IEnvConfig = {
  DBS: DataSourceOptions[]
} & Partial<NodeJS.ProcessEnv>

export function configEnv(): IEnvConfig {
  const {
    PORT = 3000,
    DB_PRIMARY_HOST,
    DB_PRIMARY_PORT,
    DB_PRIMARY_USERNAME,
    DB_PRIMARY_PASSWORD,
    DB_PRIMARY_DATABASE,
    DB_PRIMARY_SYNCHRONIZE = false,
    DB_PRIMARY_SSL = false,
    DB_PRIMARY_SSL_REJECT_UNAUTHORIZED = true,
    // SWAGGER CONFIG
    SWAGGER_TITLE = 'LOTO GAME API',
    SWAGGER_DESCRIPTION = 'The LOTO GAME API',
    SWAGGER_VERSION = '1.0',
    JWT_SECRET,
    JWT_EXPIRY,
    JWT_REFRESH_TOKEN_SECRET,
    JWT_REFRESH_TOKEN_EXPIRY,
    PASSWORD_SALT,
    // DISPLAY_TIMEZONE
    DISPLAY_TIMEZONE = 'Asia/Ho_Chi_Minh',
    // LOGGER CONFIG
    LOG_LEVEL = 'info',
    LOG_OUTPUT = 'console',
    LOG_FILE_PATH = 'logs',
    LOG_FILE_MAX_SIZE = '20m',
    LOG_FILE_MAX_FILES = '14d',
    LOG_REDIS_KEY = 'loto-game:logs',
    LOG_SHOW_CONTEXT = 'false',
    APP_NAME = 'LOTO GAME',
  } = process.env
  const cfg = {
    PORT: Number(PORT),
    SWAGGER_TITLE,
    SWAGGER_DESCRIPTION,
    SWAGGER_VERSION,
    JWT_SECRET,
    JWT_EXPIRY,
    JWT_REFRESH_TOKEN_SECRET,
    JWT_REFRESH_TOKEN_EXPIRY,
    PASSWORD_SALT,
    DISPLAY_TIMEZONE,
    LOG_LEVEL,
    LOG_OUTPUT,
    LOG_FILE_PATH,
    LOG_FILE_MAX_SIZE,
    LOG_FILE_MAX_FILES,
    LOG_REDIS_KEY,
    LOG_SHOW_CONTEXT,
    APP_NAME,
    DBS: [
      {
        name: 'default',
        type: 'postgres',
        host: DB_PRIMARY_HOST,
        port: Number(DB_PRIMARY_PORT),
        username: DB_PRIMARY_USERNAME,
        password: DB_PRIMARY_PASSWORD,
        database: DB_PRIMARY_DATABASE,
        synchronize: stringToBoolean(DB_PRIMARY_SYNCHRONIZE),
        ssl: stringToBoolean(DB_PRIMARY_SSL)
          ? {
              rejectUnauthorized: stringToBoolean(DB_PRIMARY_SSL_REJECT_UNAUTHORIZED),
            }
          : undefined,
        logging: [
          'log',
          'error',
          'info',
        ],
      },
    ],
  } as const
  
  // Only validate JWT_SECRET when running the app (not during migrations or tests)
  const isMigration = process.argv.some(arg => arg.includes('migration'))
  const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID
  if (!isMigration && !isTest && (!JWT_SECRET || `${JWT_SECRET}`.trim() === '')) {
    throw new Error('Environment variable JWT_SECRET is required and cannot be empty')
  }
  
  return cfg as unknown as IEnvConfig
}
