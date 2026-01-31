import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GroupsController } from './groups.controller'
import { GroupsService } from './groups.service'
import { Group, Player } from '@libs/@systems/entities/primary'
import { GroupRepository, PlayerRepository } from '@libs/@systems/repositories/primary'

@Module({
  imports: [TypeOrmModule.forFeature([Group, Player])],
  controllers: [GroupsController],
  providers: [GroupsService, GroupRepository, PlayerRepository],
  exports: [GroupsService, GroupRepository, PlayerRepository],
})
export class GroupsModule {}






