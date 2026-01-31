import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoomsController } from './rooms.controller'
import { RoomsService } from './rooms.service'
import { Room, Group } from '@libs/@systems/entities/primary'
import { RoomRepository, GroupRepository } from '@libs/@systems/repositories/primary'

@Module({
  imports: [TypeOrmModule.forFeature([Room, Group])],
  controllers: [RoomsController],
  providers: [RoomsService, RoomRepository, GroupRepository],
  exports: [RoomsService, RoomRepository],
})
export class RoomsModule {}






