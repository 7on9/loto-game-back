import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoomsController } from './rooms.controller'
import { RoomsService } from './rooms.service'
import { GamesModule } from '../games/games.module'
import { Room, Group, RoomPlayer } from '@libs/@systems/entities/primary'
import { RoomRepository, GroupRepository, RoomPlayerRepository } from '@libs/@systems/repositories/primary'

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Group, RoomPlayer]),
    GamesModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomRepository, GroupRepository, RoomPlayerRepository],
  exports: [RoomsService, RoomRepository],
})
export class RoomsModule {}






