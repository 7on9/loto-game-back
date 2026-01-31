import { IsString, IsOptional, IsUUID, IsArray, ValidateNested, MinLength } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePlayerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  name: string

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string
}

export class UpdatePlayerDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string
}

export class CreateGroupDto {
  @ApiProperty({ example: 'My Friends Group' })
  @IsString()
  @MinLength(1)
  name: string

  @ApiPropertyOptional({ example: 'Group for weekend games' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ type: [CreatePlayerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlayerDto)
  players: Array<CreatePlayerDto>
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'My Friends Group' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @ApiPropertyOptional({ example: 'Group for weekend games' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ type: [UpdatePlayerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlayerDto)
  players?: Array<UpdatePlayerDto>
}






