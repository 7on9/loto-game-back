import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { GamesService } from './games.service'
import { SelectCardDto, CardAvailabilityDto } from '@libs/@systems/dtos'
import { JwtAuthGuard } from '@libs/@systems/auth/jwt-auth.guard'

@ApiTags('Games')
@ApiBearerAuth()
@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get(':gameId/cards')
  @ApiOperation({ summary: 'Get cards with availability status for a game' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cards retrieved successfully',
    type: [CardAvailabilityDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async getCards(@Param('gameId') gameId: string): Promise<Array<CardAvailabilityDto>> {
    return this.gamesService.getCardsWithAvailability(gameId)
  }

  @Post(':gameId/select-card')
  @ApiOperation({ summary: 'Select a card for a game' })
  @ApiResponse({ 
    status: 201, 
    description: 'Card selected successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request (card taken, limit reached, wrong state)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Game or card not found' })
  async selectCard(
    @Param('gameId') gameId: string,
    @Request() req: any,
    @Body() selectCardDto: SelectCardDto,
  ) {
    return this.gamesService.selectCard(gameId, req.user.userId, selectCardDto)
  }
}
