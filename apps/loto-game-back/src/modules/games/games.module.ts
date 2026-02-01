import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GamesController } from './games.controller'
import { GamesService } from './games.service'
import { Game, Card, GameCard } from '@libs/@systems/entities/primary'
import { GameRepository, CardRepository, GameCardRepository } from '@libs/@systems/repositories/primary'

@Module({
  imports: [TypeOrmModule.forFeature([Game, Card, GameCard])],
  controllers: [GamesController],
  providers: [GamesService, GameRepository, CardRepository, GameCardRepository],
  exports: [GamesService, GameRepository],
})
export class GamesModule {}
