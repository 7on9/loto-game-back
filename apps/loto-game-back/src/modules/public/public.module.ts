import { Module } from '@nestjs/common'
import { PublicController } from './public.controller'
import { AppService } from '../../app.service'

@Module({
  controllers: [PublicController],
  providers: [AppService],
  exports: [AppService],
})
export class PublicModule {}





