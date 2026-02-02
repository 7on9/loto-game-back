import { Injectable, Logger } from '@nestjs/common'
import { Response } from 'express'

export interface SSEClient {
  userId: string
  gameId: string
  response: Response
}

export type SSEEventType = 'game_state' | 'players' | 'picked_cards' | 'card_picked' | 'card_released' | 'player_joined' | 'number_called' | 'game_started' | 'game_finished'

export interface SSEEvent {
  type: SSEEventType
  data: any
}

@Injectable()
export class GameSSEService {
  private readonly logger = new Logger(GameSSEService.name)
  private readonly clients = new Map<string, Set<SSEClient>>() // gameId -> Set of clients

  /**
   * Register a new SSE client connection
   */
  addClient(gameId: string, userId: string, response: Response): void {
    if (!this.clients.has(gameId)) {
      this.clients.set(gameId, new Set())
    }

    const client: SSEClient = {
      userId,
      gameId,
      response,
    }

    this.clients.get(gameId)!.add(client)

    // Set up SSE headers
    response.setHeader('Content-Type', 'text/event-stream')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('Connection', 'keep-alive')
    response.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

    // Send initial connection confirmation
    this.sendEvent(client, {
      type: 'game_state',
      data: { connected: true, gameId },
    })

    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(gameId, client)
    })

    this.logger.log(`Client connected: gameId=${gameId}, userId=${userId}, total=${this.clients.get(gameId)!.size}`)
  }

  /**
   * Remove a client connection
   */
  removeClient(gameId: string, client: SSEClient): void {
    const gameClients = this.clients.get(gameId)
    if (gameClients) {
      gameClients.delete(client)
      if (gameClients.size === 0) {
        this.clients.delete(gameId)
      }
      this.logger.log(`Client disconnected: gameId=${gameId}, userId=${client.userId}, remaining=${gameClients.size}`)
    }
  }

  /**
   * Broadcast an event to all clients for a specific game
   */
  broadcastToGame(gameId: string, event: SSEEvent): void {
    const gameClients = this.clients.get(gameId)
    if (!gameClients || gameClients.size === 0) {
      return
    }

    const eventData = this.formatSSE(event)
    const deadClients: Array<SSEClient> = []

    for (const client of gameClients) {
      try {
        client.response.write(eventData)
      } catch (error) {
        this.logger.warn(`Failed to send event to client: ${client.userId}`, error)
        deadClients.push(client)
      }
    }

    // Clean up dead clients
    for (const deadClient of deadClients) {
      this.removeClient(gameId, deadClient)
    }

    this.logger.debug(`Broadcasted ${event.type} to ${gameClients.size} clients for game ${gameId}`)
  }

  /**
   * Send an event to a specific client
   */
  private sendEvent(client: SSEClient, event: SSEEvent): void {
    try {
      const eventData = this.formatSSE(event)
      client.response.write(eventData)
    } catch (error) {
      this.logger.warn(`Failed to send event to client: ${client.userId}`, error)
      this.removeClient(client.gameId, client)
    }
  }

  /**
   * Send an event to a specific client by gameId and userId
   */
  sendEventToClient(gameId: string, userId: string, event: SSEEvent): void {
    const gameClients = this.clients.get(gameId)
    if (!gameClients) {
      return
    }

    for (const client of gameClients) {
      if (client.userId === userId) {
        this.sendEvent(client, event)
        return
      }
    }
  }

  /**
   * Format an event as SSE data
   */
  private formatSSE(event: SSEEvent): string {
    const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data)
    return `event: ${event.type}\ndata: ${data}\n\n`
  }

  /**
   * Get the number of connected clients for a game
   */
  getClientCount(gameId: string): number {
    return this.clients.get(gameId)?.size ?? 0
  }

  /**
   * Get total number of connected clients across all games
   */
  getTotalClientCount(): number {
    let total = 0
    for (const gameClients of this.clients.values()) {
      total += gameClients.size
    }
    return total
  }
}
