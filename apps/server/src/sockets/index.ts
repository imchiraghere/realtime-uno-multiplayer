import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { gameService } from '../modules/game/game.service';
import { registerRoomHandlers } from './handlers/roomHandler';
import { registerGameHandlers } from './handlers/gameHandler';
import { registerChatHandlers } from './handlers/chatHandler';
import { registerMatchmakingHandlers } from './handlers/matchmakingHandler';

export function initializeSockets(io: Server): void {
  gameService.setIO(io as Parameters<typeof gameService.setIO>[0]);
  
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const payload = verifyToken(token);
      socket.data = { userId: payload.userId, username: payload.username, isAdmin: payload.isAdmin };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });
  
  io.on('connection', (socket: Socket) => {
    const { userId, username } = socket.data as { userId: string; username: string };
    logger.info(`User connected: ${username} (${userId}) socket: ${socket.id}`);
    
    registerRoomHandlers(io, socket, userId, username);
    registerGameHandlers(io, socket, userId);
    registerChatHandlers(io, socket, userId);
    registerMatchmakingHandlers(io, socket, userId, username);
    
    socket.on('disconnecting', async () => {
      logger.info(`User disconnecting: ${username}`);
      // Find which games this player is in and handle disconnect before rooms are cleared
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue; // skip own room
        await gameService.handlePlayerDisconnect(roomId, userId);
        io.to(roomId).emit('player_disconnected', { playerId: userId });
      }
    });
    
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${username}`);
    });
  });
}
