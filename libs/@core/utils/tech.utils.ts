import { DynamicModule } from '@nestjs/common'
import { DataSourceOptions } from 'typeorm'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerService } from '@libs/@core/logger'

function dbModules(dbs: DataSourceOptions[]) {
  const logger = LoggerService.withTopic('DB_UTIL')
  const multipleDatabaseModule: DynamicModule[] = []
  dbs.forEach(item => {
    logger.debug('Database configuration', {
      name: item.name,
      type: item.type,
      host: item.type === 'postgres' ? (item as any).host : undefined,
      database: item.type === 'postgres' ? (item as any).database : undefined,
    })
    const typeormModule = TypeOrmModule.forRoot({
      ...item,
      autoLoadEntities: true,
    })
    multipleDatabaseModule.push(typeormModule)
  })
  return multipleDatabaseModule
}

export const TechUtils = {
  dbModules,
}





