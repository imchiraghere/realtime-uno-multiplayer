import { Request, Response } from 'express';
import { friendsService } from './friends.service';
import { AuthRequest } from '../../middleware/auth';

export async function sendRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const senderId = req.user?.userId;
    if (!senderId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const request = await friendsService.sendFriendRequest(senderId, targetUserId);
    res.status(201).json({ success: true, data: request });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, error: message });
  }
}

export async function respondRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
    await friendsService.respondToRequest(requestId, userId, req.body.accept);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, error: message });
  }
}

export async function getFriends(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const friends = await friendsService.getFriends(userId);
    res.json({ success: true, data: friends });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getPendingRequests(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const requests = await friendsService.getPendingRequests(userId);
    res.json({ success: true, data: requests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}
