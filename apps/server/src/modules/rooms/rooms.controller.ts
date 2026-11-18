import { Request, Response } from 'express';
import { roomsService } from './rooms.service';
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
