import { Test, TestingModule } from '@nestjs/testing'
import { GameSSEService, SSEClient, SSEEvent } from './game-sse.service'
import { Response } from 'express'

describe('GameSSEService', () => {
  let service: GameSSEService
  let mockResponse: Partial<Response>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameSSEService],
    }).compile()

    service = module.get<GameSSEService>(GameSSEService)

    // Create mock response
    mockResponse = {
      setHeader: jest.fn(),
      write: jest.fn(),
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'close') {
          // Store close callback for testing
          ;(mockResponse as any).closeCallback = callback
        }
        return mockResponse as Response
      }),
      end: jest.fn(),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('addClient', () => {
    it('should register a new SSE client connection', () => {
      const gameId = 'game-123'
      const userId = 'user-456'

      service.addClient(gameId, userId, mockResponse as Response)

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream')
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache')
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive')
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no')
      expect(mockResponse.write).toHaveBeenCalled()
      expect(service.getClientCount(gameId)).toBe(1)
    })

    it('should handle multiple clients for the same game', () => {
      const gameId = 'game-123'
      const mockResponse2 = { ...mockResponse, write: jest.fn() }

      service.addClient(gameId, 'user-1', mockResponse as Response)
      service.addClient(gameId, 'user-2', mockResponse2 as Response)

      expect(service.getClientCount(gameId)).toBe(2)
    })

    it('should set up close handler for client disconnect', () => {
      const gameId = 'game-123'
      const userId = 'user-456'

      service.addClient(gameId, userId, mockResponse as Response)

      expect(mockResponse.on).toHaveBeenCalledWith('close', expect.any(Function))
    })
  })

  describe('removeClient', () => {
    it('should remove a client connection', () => {
      const gameId = 'game-123'
      const userId = 'user-456'

      service.addClient(gameId, userId, mockResponse as Response)
      expect(service.getClientCount(gameId)).toBe(1)

      const gameClients = (service as any).clients.get(gameId)
      const client = Array.from(gameClients)[0] as SSEClient

      service.removeClient(gameId, client)
      expect(service.getClientCount(gameId)).toBe(0)
    })

    it('should remove game entry when no clients remain', () => {
      const gameId = 'game-123'
      const userId = 'user-456'

      service.addClient(gameId, userId, mockResponse as Response)
      const gameClients = (service as any).clients.get(gameId)
      const client = Array.from(gameClients)[0] as SSEClient

      service.removeClient(gameId, client)
      expect((service as any).clients.has(gameId)).toBe(false)
    })
  })

  describe('broadcastToGame', () => {
    it('should broadcast event to all clients for a game', () => {
      const gameId = 'game-123'
      const mockResponse2 = { ...mockResponse, write: jest.fn() }

      service.addClient(gameId, 'user-1', mockResponse as Response)
      service.addClient(gameId, 'user-2', mockResponse2 as Response)

      const event: SSEEvent = {
        type: 'card_picked',
        data: { cardId: 'C01', userId: 'user-1' },
      }

      service.broadcastToGame(gameId, event)

      expect(mockResponse.write).toHaveBeenCalled()
      expect(mockResponse2.write).toHaveBeenCalled()
    })

    it('should not broadcast if no clients are connected', () => {
      const gameId = 'game-123'
      const event: SSEEvent = {
        type: 'card_picked',
        data: { cardId: 'C01', userId: 'user-1' },
      }

      service.broadcastToGame(gameId, event)

      expect(mockResponse.write).not.toHaveBeenCalled()
    })

    it('should handle write errors gracefully', () => {
      const gameId = 'game-123'
      const errorResponse = {
        ...mockResponse,
        write: jest.fn(() => {
          throw new Error('Write failed')
        }),
      }

      service.addClient(gameId, 'user-1', errorResponse as Response)

      const event: SSEEvent = {
        type: 'card_picked',
        data: { cardId: 'C01', userId: 'user-1' },
      }

      service.broadcastToGame(gameId, event)

      expect(service.getClientCount(gameId)).toBe(0) // Client should be removed
    })

    it('should format SSE event correctly', () => {
      const gameId = 'game-123'
      service.addClient(gameId, 'user-1', mockResponse as Response)

      const event: SSEEvent = {
        type: 'card_picked',
        data: { cardId: 'C01', userId: 'user-1' },
      }

      service.broadcastToGame(gameId, event)

      const writeCall = (mockResponse.write as jest.Mock).mock.calls[0][0]
      expect(writeCall).toContain('event: card_picked')
      expect(writeCall).toContain('data: ')
      expect(writeCall).toContain('C01')
    })
  })

  describe('getClientCount', () => {
    it('should return 0 for non-existent game', () => {
      expect(service.getClientCount('non-existent')).toBe(0)
    })

    it('should return correct count for game with clients', () => {
      const gameId = 'game-123'
      service.addClient(gameId, 'user-1', mockResponse as Response)
      service.addClient(gameId, 'user-2', { ...mockResponse, write: jest.fn() } as Response)

      expect(service.getClientCount(gameId)).toBe(2)
    })
  })

  describe('getTotalClientCount', () => {
    it('should return 0 when no clients are connected', () => {
      expect(service.getTotalClientCount()).toBe(0)
    })

    it('should return total count across all games', () => {
      service.addClient('game-1', 'user-1', mockResponse as Response)
      service.addClient('game-1', 'user-2', { ...mockResponse, write: jest.fn() } as Response)
      service.addClient('game-2', 'user-3', { ...mockResponse, write: jest.fn() } as Response)

      expect(service.getTotalClientCount()).toBe(3)
    })
  })

  describe('SSE Event Format', () => {
    it('should format string data correctly', () => {
      const gameId = 'game-123'
      service.addClient(gameId, 'user-1', mockResponse as Response)

      const event: SSEEvent = {
        type: 'game_state',
        data: 'PREPARE',
      }

      service.broadcastToGame(gameId, event)

      const writeCall = (mockResponse.write as jest.Mock).mock.calls[1][0] // Second call (after initial connection)
      expect(writeCall).toBe('event: game_state\ndata: PREPARE\n\n')
    })

    it('should format object data as JSON', () => {
      const gameId = 'game-123'
      service.addClient(gameId, 'user-1', mockResponse as Response)

      const event: SSEEvent = {
        type: 'card_picked',
        data: { cardId: 'C01', userId: 'user-1' },
      }

      service.broadcastToGame(gameId, event)

      const writeCall = (mockResponse.write as jest.Mock).mock.calls[1][0]
      expect(writeCall).toContain('event: card_picked')
      expect(writeCall).toContain('data: {"cardId":"C01","userId":"user-1"}')
    })
  })
})
