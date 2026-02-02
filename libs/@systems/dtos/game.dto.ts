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

export class SelectCardDto {
  @ApiProperty({ example: 'C01', description: 'Card ID to select' })
  @IsString()
  @MinLength(1)
  cardId: string
}

export class PickCardDto {
  @ApiProperty({ example: 'C01', description: 'Card ID to pick' })
  @IsString()
  @MinLength(1)
  cardId: string
}

export class CardAvailabilityDto {
  @ApiProperty({ example: 'C01' })
  id: string

  @ApiProperty({ example: 'card-red' })
  pairId: string

  @ApiProperty({ example: 'red' })
  colorTheme: string

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiProperty({ example: false, description: 'Whether the card is already taken' })
  isTaken: boolean

  @ApiProperty({ example: 'uuid', nullable: true, description: 'User ID who selected this card' })
  takenByUserId?: string
}

export class StartGameResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Game ID' })
  gameId: string

  @ApiProperty({ example: 'STARTED', description: 'New game status' })
  status: string

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Game start timestamp (only present when game is STARTED)' })
  startedAt?: Date

  @ApiProperty({ example: 90, description: 'Total numbers in the game' })
  totalNumbers: number
}

export class CallNextNumberResponseDto {
  @ApiProperty({ example: 42, description: 'The called number' })
  number: number

  @ApiProperty({ example: 15, description: 'Current call index (0-based)' })
  callIndex: number

  @ApiProperty({ example: 90, description: 'Total numbers in the game' })
  totalNumbers: number

  @ApiProperty({ example: false, description: 'Whether all numbers have been called' })
  isComplete: boolean
}
