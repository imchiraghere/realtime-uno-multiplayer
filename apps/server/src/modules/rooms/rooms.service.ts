import { prisma } from '../../config/database';
import { hashPassword, verifyPassword } from '../../utils/password';
import { generateRoomCode } from '../../utils/roomCode';

export class RoomsService {
  async createRoom(hostId: string, config: {
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
        name: config.name,
        hostId,
        isPrivate: config.isPrivate,
        password: passwordHash,
        maxPlayers: config.maxPlayers,
        gameMode: config.gameMode as 'CLASSIC' | 'HOUSE_RULES' | 'QUICK_MATCH',
        turnTimerSeconds: config.turnTimerSeconds,
        scoreLimit: config.scoreLimit,
        houseRules: config.houseRules as any,
        allowBots: config.allowBots,
        spectatorMode: config.spectatorMode,
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
    if (existing) return this.getRoom(room.id);

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
    
    return this.getRoom(room.id);
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
    
    return this.getRoom(roomId);
  }
  
  async setReady(userId: string, roomId: string, isReady: boolean) {
    await prisma.gameRoomPlayer.updateMany({
      where: { roomId, userId },
      data: { isReady },
    });
    return this.getRoom(roomId);
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
        },
      },
    });
  }
  
  async getPublicRooms() {
    return prisma.gameRoom.findMany({
      where: { status: 'WAITING', isPrivate: false },
      include: {
        players: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
  
  async startGame(roomId: string, hostId: string) {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== hostId) throw new Error('Only host can start');
    if (room.players.length < 2) throw new Error('Need at least 2 players');
    if (!room.players.every(p => p.isReady || p.userId === hostId)) {
      throw new Error('All players must be ready');
    }
    
    const session = await prisma.gameSession.create({
      data: { roomId },
    });
    
    await prisma.gameRoom.update({
      where: { id: roomId },
      data: { status: 'PLAYING' },
    });
    
    return { room, session };
  }
  
  private getNextSeat(usedSeats: number[]): number {
    for (let i = 0; i < 4; i++) {
      if (!usedSeats.includes(i)) return i;
    }
    throw new Error('No seats available');
  }
}

export const roomsService = new RoomsService();
