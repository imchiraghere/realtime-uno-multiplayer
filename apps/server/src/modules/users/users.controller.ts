import { Request, Response } from 'express';
import { usersService } from './users.service';
import { AuthRequest } from '../../middleware/auth';

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const rawId = req.params.id || req.user?.userId;
    const userId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!userId) { res.status(400).json({ success: false, error: 'User ID required' }); return; }
    const user = await usersService.getUser(userId);
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const profile = await usersService.updateProfile(userId, req.body);
    res.json({ success: true, data: profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getMatchHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const rawId = req.params.id || req.user?.userId;
    const userId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!userId) { res.status(400).json({ success: false, error: 'User ID required' }); return; }
    const history = await usersService.getMatchHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') { res.status(400).json({ success: false, error: 'Query required' }); return; }
    const users = await usersService.searchUsers(q);
    res.json({ success: true, data: users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}
