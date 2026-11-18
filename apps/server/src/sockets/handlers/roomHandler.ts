import { Socket, Server } from 'socket.io';
import { roomsService } from '../../modules/rooms/rooms.service';
import { gameService } from '../../modules/game/game.service';
import { logger } from '../../utils/logger';

export function registerRoomHandlers(io: Server, socket: Socket, userId: string, username: string): void {
  socket.on('create_room', async (data: {
    name: string;
    isPrivate: boolean;
    password?: string;
    maxPlayers: number;
    gameMode: string;
    turnTimerSeconds: number;
    scoreLimit: number;
    houseRules: Record<string, unknown>;
    allowBots: boolean;
    spectatorMode: boolean;
  }) => {
    try {
      const room = await roomsService.createRoom(userId, data);
      await socket.join(room.id);
      socket.emit('room_created', { room });
      logger.info(`Room created: ${room.code} by ${username}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating room';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('join_room', async (data: { code: string; password?: string }) => {
    try {
      const room = await roomsService.joinRoom(userId, data.code, data.password);
      if (!room) throw new Error('Room not found');
      await socket.join(room.id);
      socket.emit('room_joined', { room });
      io.to(room.id).emit('player_joined', { room });
      logger.info(`${username} joined room ${data.code}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error joining room';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('leave_room', async (data: { roomId: string }) => {
    try {
      const room = await roomsService.leaveRoom(userId, data.roomId);
      socket.leave(data.roomId);
      socket.emit('room_left', {});
      if (room) {
        io.to(data.roomId).emit('room_updated', { room });
        io.to(data.roomId).emit('player_left', { userId, room });
      } else {
        io.to(data.roomId).emit('room_closed', {});
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error leaving room';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('player_ready', async (data: { roomId: string; isReady: boolean }) => {
    try {
      const room = await roomsService.setReady(userId, data.roomId, data.isReady);
      io.to(data.roomId).emit('room_updated', { room });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('start_game', async (data: { roomId: string }) => {
    try {
      const { room, session } = await roomsService.startGame(data.roomId, userId);
      
      const playerInfos = room.players.map(p => ({
        id: p.userId,
        username: p.user.username,
        seat: p.seat,
        isBot: p.isBot,
        botDifficulty: p.botDifficulty ?? undefined,
        avatarUrl: p.user.profile?.avatarUrl ?? undefined,
      }));
      
      const houseRules = typeof room.houseRules === 'object' && room.houseRules !== null
        ? room.houseRules as Record<string, unknown>
        : {};
      
      const gameState = await gameService.createGame(
        room.id,
        session.id,
        playerInfos,
        room.gameMode.toLowerCase() as 'classic' | 'house_rules' | 'quick_match',
        houseRules as Parameters<typeof gameService.createGame>[4],
        room.turnTimerSeconds
      );
      
      io.to(data.roomId).emit('game_started', { sessionId: session.id, roomId: room.id });
      await gameService.broadcastState(room.id, gameState);
      
      logger.info(`Game started in room ${data.roomId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error starting game';
      socket.emit('error_message', { message });
    }
  });
}
