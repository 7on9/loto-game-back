import { Controller, Get, Post, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { RoomsService } from './rooms.service'
import { GamesService } from '../games/games.service'
import { CreateRoomDto, JoinRoomByCodeDto, JoinRoomByCodeResponseDto, CreateGameResponseDto } from '@libs/@systems/dtos'
import { JwtAuthGuard } from '@libs/@systems/auth/jwt-auth.guard'

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly gamesService: GamesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room with unique 6-digit code' })
  @ApiResponse({ 
    status: 201, 
    description: 'Room created successfully',
    schema: {
      type: 'object',
      properties: {
        room_id: { type: 'string', example: 'uuid' },
        code: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  create(@Request() req: any, @Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(req.user.userId, createRoomDto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all user rooms' })
  @ApiResponse({ status: 200, description: 'Rooms retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req: any) {
    return this.roomsService.findAll(req.user.userId)
  }

  @Post('join-by-code')
  @HttpCode(200)
  @ApiOperation({ summary: 'Join a room by 6-digit code (idempotent)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Joined room successfully',
    type: JoinRoomByCodeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (room no longer accepting players)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async joinRoomByCode(
    @Body() joinRoomDto: JoinRoomByCodeDto,
    @Request() req: any,
  ): Promise<JoinRoomByCodeResponseDto> {
    return this.roomsService.joinRoomByCode(joinRoomDto.code, req.user.userId)
  }

  @Post(':roomId/games')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new game for a room (locks room, brings all room players)' })
  @ApiResponse({
    status: 201,
    description: 'Game created successfully',
    type: CreateGameResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (room already has a game, no players)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async createGame(@Param('roomId') roomId: string): Promise<CreateGameResponseDto> {
    return this.gamesService.createGame(roomId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room details' })
  @ApiResponse({ status: 200, description: 'Room retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id)
  }
}






