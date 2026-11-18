import { Request, Response } from 'express';
import { leaderboardService } from './leaderboard.service';
import { AuthRequest } from '../../middleware/auth';

export async function getGlobalLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const leaderboard = await leaderboardService.getGlobalLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getWeeklyLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const leaderboard = await leaderboardService.getWeeklyLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getFriendsLeaderboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const leaderboard = await leaderboardService.getFriendsLeaderboard(userId, limit);
    res.json({ success: true, data: leaderboard });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}
