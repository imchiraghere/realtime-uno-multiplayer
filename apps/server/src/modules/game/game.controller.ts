import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { gameService } from './game.service';
import { chatService } from '../chat/chat.service';
import { CardColor } from './engine/card';
import { verifyToken } from '../../utils/jwt';
import { sseManager } from '../../utils/sseManager';

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

export async function streamGameEvents(req: Request, res: Response): Promise<void> {
  try {
    const rawToken = (req.query.token as string) || (req.headers.authorization as string)?.replace(/^Bearer\s+/i, '');
    if (!rawToken) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const payload = verifyToken(rawToken);
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const state = await gameService.getGameState(roomId);
    if (!state) {
      res.status(404).json({ success: false, error: 'Game not found' });
      return;
    }

    sseManager.addClient(roomId, payload.userId, req, res);

    // Immediately push current public game state for this player
    const publicState = gameService.getPublicState(state, payload.userId);
    res.write(`event: game_state_updated\ndata: ${JSON.stringify({ state: publicState })}\n\n`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error subscribing to game events';
    res.status(400).json({ success: false, error: message });
  }
}

export async function playCard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const { cardId, chosenColor } = req.body;
    const newState = await gameService.processPlayCard(roomId, userId, cardId, chosenColor as CardColor);
    
    gameService.broadcastEvent(roomId, 'card_played', {
      playerId: userId,
      cardId,
      chosenColor,
    });
    
    await gameService.broadcastState(roomId, newState);
    
    if (newState.phase === 'finished') {
      gameService.broadcastEvent(roomId, 'game_over', {
        winner: newState.winner,
        players: newState.players.map(p => ({ id: p.id, username: p.username, score: p.score })),
      });
    }

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
    
    gameService.broadcastEvent(roomId, 'card_drawn', { playerId: userId });
    await gameService.broadcastState(roomId, newState);

    if (newState.phase === 'finished') {
      gameService.broadcastEvent(roomId, 'game_over', {
        winner: newState.winner,
        players: newState.players.map(p => ({ id: p.id, username: p.username, score: p.score })),
      });
    }

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
    
    gameService.broadcastEvent(roomId, 'uno_declared', { playerId: userId });
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
    
    gameService.broadcastEvent(roomId, 'challenge_result', {
      challengerId: userId,
      success: !newState.challengeWindow?.active,
    });
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
    
    gameService.broadcastEvent(roomId, 'color_changed', { color, playerId: userId });
    await gameService.broadcastState(roomId, newState);

    const publicState = gameService.getPublicState(newState, userId);
    res.json({ success: true, data: publicState });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, error: message });
  }
}

export async function getChatMessages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const messages = await chatService.getRoomMessages(roomId, 50);
    res.json({ success: true, data: messages.reverse() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function sendChatMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ success: false, error: 'Empty message' });
      return;
    }
    const msg = await chatService.saveMessage(roomId, userId, message.trim());
    const chatPayload = {
      id: msg.id,
      userId,
      username: msg.user.username,
      avatarUrl: msg.user.profile?.avatarUrl,
      message: message.trim(),
      createdAt: msg.createdAt,
    };
    gameService.broadcastEvent(roomId, 'chat_message', chatPayload);
    res.json({ success: true, data: chatPayload });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error sending message';
    res.status(400).json({ success: false, error: message });
  }
}
