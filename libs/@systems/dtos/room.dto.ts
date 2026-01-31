import { IsString, IsUUID, IsEnum, MinLength, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { GameMode } from '../enums'

export class CreateRoomDto {
  @ApiProperty({ example: 'Friday Night Game' })
  @IsString()
  @MinLength(1)
  name: string

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string

  @ApiProperty({ enum: GameMode, example: GameMode.CLASSIC })
  @IsEnum(GameMode)
  gameMode: GameMode
}

