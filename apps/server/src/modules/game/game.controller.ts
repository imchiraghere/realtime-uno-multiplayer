import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { gameService } from './game.service';
import { CardColor } from './engine/card';

export async function getGame(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const state = await gameService.getGameState(roomId);
    if (!state) { res.status(404).json({ success: false, error: 'Game not found' }); return; }
    const publicState = gameService.getPublicState(state, userId);
    res.json({ success: true, data: publicState });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function playCard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const { cardId, chosenColor } = req.body;
    const newState = await gameService.processPlayCard(roomId, userId, cardId, chosenColor as CardColor);
    await gameService.broadcastState(roomId, newState);
    const publicState = gameService.getPublicState(newState, userId);
    res.json({ success: true, data: publicState });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error playing card';
    res.status(400).json({ success: false, error: message });
  }
}

export async function drawCard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const newState = await gameService.processDrawCard(roomId, userId);
    await gameService.broadcastState(roomId, newState);
    const publicState = gameService.getPublicState(newState, userId);
    res.json({ success: true, data: publicState });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error drawing card';
    res.status(400).json({ success: false, error: message });
  }
}

export async function declareUno(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const newState = await gameService.processDeclareUno(roomId, userId);
    await gameService.broadcastState(roomId, newState);
    const publicState = gameService.getPublicState(newState, userId);
    res.json({ success: true, data: publicState });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error declaring UNO';
    res.status(400).json({ success: false, error: message });
  }
}

export async function challengeWild(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const newState = await gameService.processChallenge(roomId, userId);
    await gameService.broadcastState(roomId, newState);
    const publicState = gameService.getPublicState(newState, userId);
    res.json({ success: true, data: publicState });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, error: message });
  }
}

export async function chooseColor(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const { color } = req.body;
    const newState = await gameService.processChooseColor(roomId, userId, color as CardColor);
    await gameService.broadcastState(roomId, newState);
    const publicState = gameService.getPublicState(newState, userId);
    res.json({ success: true, data: publicState });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, error: message });
  }
}

