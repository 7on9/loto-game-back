import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GamesController } from './games.controller'
import { GamesService } from './games.service'
import { GameSSEService } from './game-sse.service'
import {
  Game,
  Card,
  CardLayout,
  GameCard,
  GamePlayer,
  RoomPlayer,
  Room,
  GameNumberOrder,
  GameCalledNumber,
  GameWinClaim,
  GameWinnerSnapshot,
} from '@libs/@systems/entities/primary'
import {
  GameRepository,
  CardRepository,
  GameCardRepository,
  GamePlayerRepository,
  RoomPlayerRepository,
  GameNumberOrderRepository,
  GameCalledNumberRepository,
} from '@libs/@systems/repositories/primary'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Game,
      Card,
      CardLayout,
      GameCard,
      GamePlayer,
      RoomPlayer,
      Room,
      GameNumberOrder,
      GameCalledNumber,
      GameWinClaim,
      GameWinnerSnapshot,
    ]),
  ],
  controllers: [GamesController],
  providers: [
    GamesService,
    GameSSEService,
    GameRepository,
    CardRepository,
    GameCardRepository,
    GamePlayerRepository,
    RoomPlayerRepository,
    GameNumberOrderRepository,
    GameCalledNumberRepository,
  ],
  exports: [GamesService, GameRepository],
})
export class GamesModule {}
