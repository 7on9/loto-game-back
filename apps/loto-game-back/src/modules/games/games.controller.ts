import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, HttpCode, Res, Sse } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import type { Response } from 'express'
import { GamesService } from './games.service'
import { GameSSEService } from './game-sse.service'
import { SelectCardDto, PickCardDto, CardAvailabilityDto, StartGameResponseDto, CallNextNumberResponseDto } from '@libs/@systems/dtos'
import { JwtAuthGuard } from '@libs/@systems/auth/jwt-auth.guard'

@ApiTags('Games')
@ApiBearerAuth()
@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly sseService: GameSSEService,
  ) {}

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

  @Get(':gameId/stream')
  @Sse()
  @ApiOperation({ summary: 'Stream game events via Server-Sent Events (SSE)' })
  @ApiResponse({
    status: 200,
    description: 'SSE stream established',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async streamGameEvents(
    @Param('gameId') gameId: string,
    @Request() req: any,
    @Res() response: Response,
  ): Promise<void> {
    const userId = req.user.userId

    // Send initial game state before registering client
    try {
      const gameState = await this.gamesService.getGameStateForSSE(gameId)
      
      // Register SSE client (this will send connection confirmation)
      this.sseService.addClient(gameId, userId, response)
      
      // Send initial snapshot in required order: game_state → players → picked_cards
      // Send game_state event to this client only
      this.sseService.sendEventToClient(gameId, userId, {
        type: 'game_state',
        data: { status: gameState.status },
      })

      // Send players event to this client only
      this.sseService.sendEventToClient(gameId, userId, {
        type: 'players',
        data: gameState.players,
      })

      // Send picked_cards initial snapshot to this client only
      this.sseService.sendEventToClient(gameId, userId, {
        type: 'picked_cards',
        data: gameState.cards.map(card => ({
          card_id: card.id,
          user_id: card.takenByUserId || null,
        })),
      })
    } catch (error) {
      // If game doesn't exist, don't register client and close connection
      response.end()
    }
  }

  @Post(':gameId/pick-card')
  @ApiOperation({ summary: 'Pick a card for a game (with SSE broadcasting)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Card picked successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request (card taken, limit reached, wrong state)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Game or card not found' })
  async pickCard(
    @Param('gameId') gameId: string,
    @Request() req: any,
    @Body() pickCardDto: PickCardDto,
  ) {
    return this.gamesService.pickCard(gameId, req.user.userId, pickCardDto)
  }

  @Delete(':gameId/pick-card/:cardId')
  @ApiOperation({ summary: 'Release a card (only owner, only in PREPARE)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Card released successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request (game not in PREPARE, unauthorized)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Game or card not found' })
  async releaseCard(
    @Param('gameId') gameId: string,
    @Param('cardId') cardId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.gamesService.releaseCard(gameId, req.user.userId, cardId)
  }

  @Post(':gameId/select-card')
  @ApiOperation({ summary: 'Select a card for a game (legacy endpoint, no SSE)' })
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


  @Post(':gameId/start')
  @HttpCode(200)
  @ApiOperation({ summary: 'Start a game by generating shuffled number order' })
  @ApiResponse({
    status: 200,
    description: 'Game started successfully',
    type: StartGameResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (game not in PREPARE status, no cards selected, already started)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async startGame(@Param('gameId') gameId: string): Promise<StartGameResponseDto> {
    return this.gamesService.startGame(gameId)
  }

  @Post(':gameId/call-next')
  @ApiOperation({ summary: 'Call the next number in the game' })
  @ApiResponse({
    status: 200,
    description: 'Number called successfully',
    type: CallNextNumberResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (game not started, all numbers called, concurrent call)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async callNextNumber(@Param('gameId') gameId: string): Promise<CallNextNumberResponseDto> {
    return this.gamesService.callNextNumber(gameId)
  }
}
