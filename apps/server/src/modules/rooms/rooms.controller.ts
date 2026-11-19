import { Request, Response } from 'express';
import { roomsService } from './rooms.service';
import { gameService } from '../game/game.service';
import { AuthRequest } from '../../middleware/auth';

export async function createRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const room = await roomsService.createRoom(userId, req.body);
    res.status(201).json({ success: true, data: room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, error: message });
  }
}

export async function joinRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const { password } = req.body;
    const room = await roomsService.joinRoom(userId, code, password);
    res.json({ success: true, data: room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, error: message });
  }
}

export async function setReady(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const { isReady } = req.body;
    const roomObj = await roomsService.getRoomByCode(code);
    if (!roomObj) { res.status(404).json({ success: false, error: 'Room not found' }); return; }
    const room = await roomsService.setReady(userId, roomObj.id, Boolean(isReady));
    res.json({ success: true, data: room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, error: message });
  }
}

export async function startGame(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const roomObj = await roomsService.getRoomByCode(code);
    if (!roomObj) { res.status(404).json({ success: false, error: 'Room not found' }); return; }
    
    const { room, session } = await roomsService.startGame(roomObj.id, userId);

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

    roomsService.notifyGameStarted(room.id, session.id);
    await gameService.broadcastState(room.id, gameState);

    res.json({ success: true, data: { room, session } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error starting game';
    res.status(400).json({ success: false, error: message });
  }
}

export async function leaveRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const roomObj = await roomsService.getRoomByCode(code);
    if (!roomObj) { res.status(404).json({ success: false, error: 'Room not found' }); return; }
    const room = await roomsService.leaveRoom(userId, roomObj.id);
    res.json({ success: true, data: room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, error: message });
  }
}

export async function getPublicRooms(_req: Request, res: Response): Promise<void> {
  try {
    const rooms = await roomsService.getPublicRooms();
    res.json({ success: true, data: rooms });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getRoomByCode(req: Request, res: Response): Promise<void> {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const room = await roomsService.getRoomByCode(code);
    if (!room) { res.status(404).json({ success: false, error: 'Room not found' }); return; }
    res.json({ success: true, data: room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}
