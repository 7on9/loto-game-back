import { IsString, IsUUID, IsEnum, MinLength, IsOptional, Matches } from 'class-validator'
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


export class JoinRoomByCodeDto {
  @ApiProperty({ example: '123456', description: '6-digit room code' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Room code must be exactly 6 digits' })
  code: string
}

export class JoinRoomByCodeResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID of the room joined' })
  room_id: string
}

export class CreateGameResponseDto {
  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-1234-567890abcdef', description: 'ID of the created game' })
  game_id: string
}
