import { Request, Response } from 'express';
import { logger } from './logger';
import { GameState } from '../modules/game/engine/gameState';

interface SSEClient {
  id: string;
  userId: string;
  roomId: string;
  res: Response;
  pingTimer: NodeJS.Timeout;
}

export class SSEManager {
  private clients = new Map<string, SSEClient>();
  private counter = 0;

  addClient(roomId: string, userId: string, req: Request, res: Response): string {
    const clientId = `sse-${Date.now()}-${++this.counter}`;

    // Standard SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Initial connection packet & heartbeat
    res.write(`: heartbeat\n\n`);
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clientId, roomId, userId })}\n\n`);

    // Keepalive ping every 15 seconds to prevent proxy / CDN timeout
    const pingTimer = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        this.removeClient(clientId);
      }
    }, 15000);

    const client: SSEClient = {
      id: clientId,
      userId,
      roomId,
      res,
      pingTimer,
    };

    this.clients.set(clientId, client);
    logger.info(`[SSE] Client connected: ${clientId} (user: ${userId}, room: ${roomId}). Total: ${this.clients.size}`);

    const cleanup = () => {
      this.removeClient(clientId);
    };

    req.on('close', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);

    return clientId;
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    clearInterval(client.pingTimer);
    try {
      client.res.end();
    } catch {
      // ignore
    }
    this.clients.delete(clientId);
    logger.info(`[SSE] Client disconnected: ${clientId}. Remaining: ${this.clients.size}`);
  }

  broadcast(roomId: string, event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      if (client.roomId === roomId || client.roomId === '*') {
        try {
          client.res.write(payload);
        } catch {
          this.removeClient(client.id);
        }
      }
    }
  }

  broadcastGame(
    roomId: string,
    state: GameState,
    getPublicStateFn: (state: GameState, viewingPlayerId: string) => unknown
  ): void {
    for (const client of this.clients.values()) {
      if (client.roomId === roomId) {
        try {
          const publicState = getPublicStateFn(state, client.userId);
          const payload = `event: game_state_updated\ndata: ${JSON.stringify({ state: publicState })}\n\n`;
          client.res.write(payload);
        } catch {
          this.removeClient(client.id);
        }
      }
    }
  }

  getClientCount(roomId?: string): number {
    if (!roomId) return this.clients.size;
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.roomId === roomId) count++;
    }
    return count;
  }
}

export const sseManager = new SSEManager();

