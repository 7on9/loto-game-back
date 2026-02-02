import { DynamicModule } from '@nestjs/common'
import { DataSourceOptions } from 'typeorm'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerService } from '@libs/@core/logger'

function dbModules(dbs: DataSourceOptions[]) {
  const logger = LoggerService.withTopic('DB_UTIL')
  const multipleDatabaseModule: DynamicModule[] = []
  dbs.forEach(item => {
    const dbConfig = {
      name: item.name,
      type: item.type,
      host: item.type === 'postgres' ? (item as any).host : undefined,
      port: item.type === 'postgres' ? (item as any).port : undefined,
      database: item.type === 'postgres' ? (item as any).database : undefined,
      username: item.type === 'postgres' ? (item as any).username : undefined,
    }
    
    logger.debug('Database configuration', dbConfig)
    
    // Validate required database config
    if (item.type === 'postgres') {
      const pgItem = item as any
      if (!pgItem.host || !pgItem.database || !pgItem.username) {
        logger.error('Missing required database configuration', {
          hasHost: !!pgItem.host,
          hasDatabase: !!pgItem.database,
          hasUsername: !!pgItem.username,
        })
      }
    }
    
    const typeormModule = TypeOrmModule.forRoot({
      ...item,
      autoLoadEntities: true,
      retryAttempts: 3,
      retryDelay: 3000,
    })
    multipleDatabaseModule.push(typeormModule)
  })
  return multipleDatabaseModule
}

export const TechUtils = {
  dbModules,
}





