import { IsOptional, IsDateString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class GameHistoryQueryDto {
  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiPropertyOptional({ example: 'civilians' })
  @IsOptional()
  winnerRole?: string

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  groupId?: string
}






