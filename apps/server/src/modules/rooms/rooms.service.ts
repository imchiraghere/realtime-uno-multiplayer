import { Server } from 'socket.io';
import { prisma } from '../../config/database';
import { hashPassword, verifyPassword } from '../../utils/password';
import { generateRoomCode } from '../../utils/roomCode';
import { sseManager } from '../../utils/sseManager';

export class RoomsService {
  private io: Server | null = null;

  setIO(io: Server): void {
    this.io = io;
  }

  notifyRoomUpdated(roomId: string, room: unknown): void {
    if (this.io) {
      this.io.to(roomId).emit('room_updated', { room });
    }
    sseManager.broadcast(roomId, 'room_updated', { room });
  }

  notifyPlayerJoined(roomId: string, room: unknown): void {
    if (this.io) {
      this.io.to(roomId).emit('player_joined', { room });
      this.io.to(roomId).emit('room_updated', { room });
    }
    sseManager.broadcast(roomId, 'player_joined', { room });
    sseManager.broadcast(roomId, 'room_updated', { room });
  }

  notifyPlayerLeft(roomId: string, userId: string, room: unknown | null): void {
    if (this.io) {
      if (room) {
        this.io.to(roomId).emit('player_left', { userId, room });
        this.io.to(roomId).emit('room_updated', { room });
      } else {
        this.io.to(roomId).emit('room_closed', {});
      }
    }
    if (room) {
      sseManager.broadcast(roomId, 'player_left', { userId, room });
      sseManager.broadcast(roomId, 'room_updated', { room });
    } else {
      sseManager.broadcast(roomId, 'room_closed', {});
    }
  }

  notifyGameStarted(roomId: string, sessionId: string, code?: string): void {
    if (this.io) {
      this.io.to(roomId).emit('game_started', { sessionId, roomId, code });
      if (code) {
        this.io.to(code).emit('game_started', { sessionId, roomId, code });
      }
    }
    sseManager.broadcast(roomId, 'game_started', { sessionId, roomId, code });
    if (code) {
      sseManager.broadcast(code, 'game_started', { sessionId, roomId, code });
    }
  }

  async createRoom(hostId: string, config: {
    name?: string;
    isPrivate?: boolean;
    password?: string;
    maxPlayers?: number;
    gameMode?: string;
    turnTimerSeconds?: number;
    scoreLimit?: number;
    houseRules?: Record<string, unknown>;
    allowBots?: boolean;
    spectatorMode?: boolean;
  }) {
    let code = generateRoomCode();
    // Ensure unique code
    while (await prisma.gameRoom.findUnique({ where: { code } })) {
      code = generateRoomCode();
    }
    
    const passwordHash = config.password ? await hashPassword(config.password) : undefined;
    
    const room = await prisma.gameRoom.create({
      data: {
        code,
        name: (config.name && config.name.trim()) || `Room ${code}`,
        hostId,
        isPrivate: Boolean(config.isPrivate),
        password: passwordHash,
        maxPlayers: Math.min(Math.max(Number(config.maxPlayers) || 4, 2), 10),
        gameMode: (config.gameMode as 'CLASSIC' | 'HOUSE_RULES' | 'QUICK_MATCH') || 'CLASSIC',
        turnTimerSeconds: Number(config.turnTimerSeconds) || 30,
        scoreLimit: Number(config.scoreLimit) || 500,
        houseRules: (config.houseRules as any) || {},
        allowBots: config.allowBots !== undefined ? Boolean(config.allowBots) : true,
        spectatorMode: Boolean(config.spectatorMode),
        players: {
          create: {
            userId: hostId,
            seat: 0,
            isReady: false,
          },
        },
      },
      include: { players: { include: { user: { include: { profile: true, stats: true } } } } },
    });
    
    return room;
  }
  
  async joinRoom(userId: string, code: string, password?: string) {
    const normalizedCode = code.trim().toUpperCase();
    const room = await prisma.gameRoom.findUnique({
      where: { code: normalizedCode },
      include: { players: true },
    });
    
    if (!room) throw new Error('Room not found');

    // Check if already in room first (for socket reconnection / page transitions)
    const existing = room.players.find(p => p.userId === userId);
    if (existing) {
      const fullRoom = await this.getRoom(room.id);
      this.notifyPlayerJoined(room.id, fullRoom);
      return fullRoom;
    }

    if (room.status !== 'WAITING') throw new Error('Game already started');
    if (room.players.length >= room.maxPlayers) throw new Error('Room is full');
    
    if (room.password && password) {
      const valid = await verifyPassword(password, room.password);
      if (!valid) throw new Error('Invalid room password');
    } else if (room.password && !password) {
      throw new Error('Password required');
    }
    
    const seat = this.getNextSeat(room.players.map(p => p.seat));
    
    await prisma.gameRoomPlayer.create({
      data: { roomId: room.id, userId, seat, isReady: false },
    });
    
    const fullRoom = await this.getRoom(room.id);
    this.notifyPlayerJoined(room.id, fullRoom);
    return fullRoom;
  }
  
  async leaveRoom(userId: string, roomId: string) {
    const room = await prisma.gameRoom.findUnique({
      where: { id: roomId },
      include: { players: true },
    });
    
    if (!room) return;
    
    await prisma.gameRoomPlayer.deleteMany({
      where: { roomId, userId },
    });
    
    const remaining = room.players.filter(p => p.userId !== userId);
    
    if (remaining.length === 0) {
      await prisma.gameRoom.update({
        where: { id: roomId },
        data: { status: 'FINISHED' },
      });
      this.notifyPlayerLeft(roomId, userId, null);
      return null;
    }
    
    // Transfer host if needed
    if (room.hostId === userId) {
      const newHost = remaining[0];
      await prisma.gameRoom.update({
        where: { id: roomId },
        data: { hostId: newHost.userId },
      });
    }
    
    const updated = await this.getRoom(roomId);
    this.notifyPlayerLeft(roomId, userId, updated);
    return updated;
  }
  
  async setReady(userId: string, roomId: string, isReady: boolean) {
    await prisma.gameRoomPlayer.updateMany({
      where: { roomId, userId },
      data: { isReady },
    });
    const updated = await this.getRoom(roomId);
    this.notifyRoomUpdated(roomId, updated);
    return updated;
  }
  
  async getRoom(roomId: string) {
    return prisma.gameRoom.findUnique({
      where: { id: roomId },
      include: {
        players: {
          include: { user: { include: { profile: true, stats: true } } },
          orderBy: { seat: 'asc' },
        },
      },
    });
  }
  
  async getRoomByCode(code: string) {
    return prisma.gameRoom.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        players: {
          include: { user: { include: { profile: true, stats: true } } },
          orderBy: { seat: 'asc' },
        },
      },
    });
  }
  
  async getPublicRooms() {
    let rooms = await prisma.gameRoom.findMany({
      where: { status: 'WAITING', isPrivate: false },
      include: {
        players: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (rooms.length === 0) {
      try {
        const { seedTestRooms } = await import('../../config/autoInitDatabase');
        const seeded = await seedTestRooms();
        if (seeded > 0) {
          rooms = await prisma.gameRoom.findMany({
            where: { status: 'WAITING', isPrivate: false },
            include: {
              players: { include: { user: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          });
        }
      } catch {
        // ignore
      }
    }

    return rooms;
  }
  
  async getRoomByIdOrCode(idOrCode: string) {
    if (!idOrCode) return null;
    const trimmed = idOrCode.trim();
    return prisma.gameRoom.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { code: trimmed.toUpperCase() },
        ],
      },
      include: {
        players: {
          include: { user: { include: { profile: true, stats: true } } },
          orderBy: { seat: 'asc' },
        },
      },
    });
  }

  async startGame(roomIdOrCode: string, hostId: string) {
    const room = await this.getRoomByIdOrCode(roomIdOrCode);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== hostId) throw new Error('Only host can start');

    // If game is already in playing status, return existing session
    if (room.status === 'PLAYING') {
      const existingSession = await prisma.gameSession.findFirst({
        where: { roomId: room.id, status: 'IN_PROGRESS' },
        orderBy: { startedAt: 'desc' },
      });
      if (existingSession) {
        return { room, session: existingSession, isExisting: true };
      }
    }

    if (room.players.length < 2) throw new Error('Need at least 2 players');
    if (!room.players.every(p => p.isReady || p.userId === hostId)) {
      throw new Error('All players must be ready');
    }
    
    const session = await prisma.gameSession.create({
      data: { roomId: room.id },
    });
    
    await prisma.gameRoom.update({
      where: { id: room.id },
      data: { status: 'PLAYING' },
    });
    
    return { room, session, isExisting: false };
  }
  
  private getNextSeat(usedSeats: number[]): number {
    for (let i = 0; i < 10; i++) {
      if (!usedSeats.includes(i)) return i;
    }
    throw new Error('No seats available');
  }
}

export const roomsService = new RoomsService();
