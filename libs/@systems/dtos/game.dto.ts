import { IsUUID, IsString, IsOptional, IsArray, IsEnum, MinLength, IsInt, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateGameDto {
  @ApiPropertyOptional({ example: 'classic', enum: ['classic', 'extended'] })
  @IsOptional()
  @IsEnum(['classic', 'extended'])
  gameMode?: string

  @ApiPropertyOptional({ example: 1, description: 'Number of Undercover players (default: 1)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  undercoverCount?: number

  @ApiPropertyOptional({ example: 0, description: 'Number of Mr. White players (default: 0 for classic, 1 for extended)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  mrWhiteCount?: number
}

export class ConfigureRolesDto {
  @ApiProperty({ example: 1, description: 'Number of Undercover players' })
  @IsInt()
  @Min(1)
  undercoverCount: number

  @ApiProperty({ example: 1, description: 'Number of Mr. White players' })
  @IsInt()
  @Min(0)
  mrWhiteCount: number
}

export class AddPlayerToGameDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  name: string

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string
}

export class ReorderPlayersDto {
  @ApiProperty({ 
    example: ['uuid1', 'uuid2', 'uuid3'], 
    description: 'Array of player IDs in desired order' 
  })
  @IsArray()
  @IsUUID('4', { each: true })
  playerOrder: Array<string>
}

export class SubmitVoteDto {
  @ApiProperty({ example: 'uuid', description: 'ID of the game player who is voting' })
  @IsUUID()
  voterId: string

  @ApiProperty({ example: 'uuid', description: 'ID of the game player being voted for' })
  @IsUUID()
  votedForId: string
}

export class MrWhiteGuessDto {
  @ApiProperty({ example: 'uuid', description: 'ID of the game player (Mr. White)' })
  @IsUUID()
  gamePlayerId: string

  @ApiProperty({ example: 'apple', description: 'Mr. White\'s guess for the word' })
  @IsString()
  guess: string
}

export class GetGameWordDto {
  @ApiProperty({ example: 'uuid', description: 'ID of the game player' })
  @IsUUID()
  gamePlayerId: string
}

export class EliminatePlayerDto {
  @ApiProperty({ example: 'uuid', description: 'ID of the player to eliminate' })
  @IsUUID()
  playerId: string
}

