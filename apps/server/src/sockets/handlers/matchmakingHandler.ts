import { Socket, Server } from 'socket.io';
import { matchmakingService } from '../../modules/matchmaking/matchmaking.service';

export function registerMatchmakingHandlers(_io: Server, socket: Socket, userId: string, username: string): void {
  socket.on('join_matchmaking', (data: { gameMode?: string }) => {
    matchmakingService.addToQueue(
      { userId, username, socketId: socket.id, joinedAt: Date.now(), gameMode: data.gameMode || 'classic' },
      (roomCode) => {
        socket.emit('matchmaking_matched', { roomCode });
      }
    );
    socket.emit('matchmaking_joined', {});
  });
  
  socket.on('leave_matchmaking', () => {
    matchmakingService.removeFromQueue(userId);
    socket.emit('matchmaking_left', {});
  });
}
