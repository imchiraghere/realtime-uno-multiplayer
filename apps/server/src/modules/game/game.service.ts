import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { GameState, PlayerState, DEFAULT_HOUSE_RULES, getPublicGameState, HouseRules, GameMode, PublicGameState } from './engine/gameState';
import { createDeck, shuffleDeck } from './engine/deck';
import { CardColor } from './engine/card';
import { playCard as doPlayCard } from './actions/playCard';
import { drawCard as doDrawCard } from './actions/drawCard';
import { declareUno as doDeclareUno } from './actions/declareUno';
import { challengeWildDrawFour as doChallenge } from './actions/challenge';
import { chooseColor as doChooseColor } from './actions/chooseColor';
import { reconnectManager } from './reconnect/reconnectManager';
import { getBotAction } from './bots/bot';
import { turnTimer } from './timers/turnTimer';
import { isGameOver, calculateScores } from './engine/rules';
import { Server } from 'socket.io';

const GAME_STATE_TTL = 3600 * 24; // 24 hours

export class GameService {
  private games = new Map<string, GameState>();
  private io: Server | null = null;
  
  setIO(io: Server): void {
    this.io = io;
  }
  
  private emit(roomId: string, event: string, data: unknown): void {
    this.io?.to(roomId).emit(event, data);
  }

  async broadcastState(roomId: string, state?: GameState): Promise<void> {
    const currentState = state || await this.getGameState(roomId);
    if (!currentState || !this.io) return;
    
    const sockets = [...(this.io.sockets.sockets.values())];
    for (const sock of sockets) {
      const sockUserId = (sock.data as { userId?: string }).userId;
      const isPlayerInGame = !!(sockUserId && currentState.players.some(p => p.id === sockUserId));
      if (sock.rooms.has(roomId) || isPlayerInGame) {
        if (!sock.rooms.has(roomId)) {
          sock.join(roomId);
        }
        const publicState = getPublicGameState(currentState, sockUserId || '__spectator__');
        sock.emit('game_state_updated', { state: publicState });
        sock.emit('private_state_updated', { state: publicState });
      }
    }
  }
  
  async createGame(
    roomId: string,
    sessionId: string,
    playerInfos: Array<{ id: string; username: string; seat: number; isBot: boolean; botDifficulty?: string; avatarUrl?: string }>,
    gameMode: GameMode,
    houseRules: Partial<HouseRules>,
    turnTimerSeconds: number
  ): Promise<GameState> {
    const deck = shuffleDeck(createDeck());
    const mergedHouseRules = { ...DEFAULT_HOUSE_RULES, ...houseRules };
    const handSize = mergedHouseRules.startingHandSize;
    
    const players: PlayerState[] = playerInfos.map((info, idx) => ({
      id: info.id,
      username: info.username,
      seat: info.seat,
      hand: deck.slice(idx * handSize, (idx + 1) * handSize),
      hasCalledUno: false,
      isConnected: true,
      isBot: info.isBot,
      botDifficulty: info.botDifficulty as PlayerState['botDifficulty'],
      score: 0,
      avatarUrl: info.avatarUrl,
    }));
    
    const remaining = deck.slice(playerInfos.length * handSize);
    
    // First card of discard pile - skip wild cards for initial card
    let firstCardIndex = 0;
    while (remaining[firstCardIndex]?.color === 'wild') firstCardIndex++;
    
    const firstCard = remaining[firstCardIndex];
    const drawPile = [...remaining.slice(0, firstCardIndex), ...remaining.slice(firstCardIndex + 1)];
    
    const state: GameState = {
      sessionId,
      roomId,
      players,
      drawPile,
      discardPile: [firstCard],
      currentPlayerIndex: 0,
      direction: 1,
      currentColor: firstCard.color as CardColor,
      phase: 'playing',
      pendingDrawCount: 0,
      lastPlayedCard: firstCard,
      winner: null,
      turnStartedAt: Date.now(),
      unoDeclarations: {},
      challengeWindow: null,
      gameMode,
      houseRules: mergedHouseRules,
      turnTimerSeconds,
      turnNumber: 0,
    };
    
    this.games.set(roomId, state);
    await this.saveGameState(state);
    
    // Start turn timer
    this.startTurnTimer(state);
    
    // If first player is a bot, schedule bot action
    if (players[0]?.isBot) {
      setTimeout(() => this.executeBotTurn(roomId), 1500);
    }
    
    return state;
  }
  
  async getGameState(roomId: string): Promise<GameState | null> {
    return this.games.get(roomId) || null;
  }
  
  async saveGameState(state: GameState): Promise<void> {
    this.games.set(state.roomId, state);
  }
  
  async loadGameState(roomId: string): Promise<GameState | null> {
    return this.games.get(roomId) || null;
  }
  
  async processPlayCard(
    roomId: string,
    playerId: string,
    cardId: string,
    chosenColor?: CardColor
  ): Promise<GameState> {
    const state = await this.getGameState(roomId);
    if (!state) throw new Error('Game not found');
    
    turnTimer.clearTimer(roomId);
    const newState = doPlayCard(state, cardId, playerId, chosenColor);
    await this.saveGameState(newState);
    
    if (newState.phase === 'finished') {
      await this.finishGame(newState);
    } else {
      this.startTurnTimer(newState);
      await this.scheduleBotTurnIfNeeded(newState);
    }
    
    return newState;
  }
  
  async processDrawCard(roomId: string, playerId: string): Promise<GameState> {
    const state = await this.getGameState(roomId);
    if (!state) throw new Error('Game not found');
    
    turnTimer.clearTimer(roomId);
    const newState = doDrawCard(state, playerId);
    await this.saveGameState(newState);
    
    if (newState.phase === 'finished') {
      await this.finishGame(newState);
    } else {
      this.startTurnTimer(newState);
      await this.scheduleBotTurnIfNeeded(newState);
    }
    
    return newState;
  }
  
  async processDeclareUno(roomId: string, playerId: string): Promise<GameState> {
    const state = await this.getGameState(roomId);
    if (!state) throw new Error('Game not found');
    const newState = doDeclareUno(state, playerId);
    await this.saveGameState(newState);
    return newState;
  }
  
  async processChallenge(roomId: string, challengerId: string): Promise<GameState> {
    const state = await this.getGameState(roomId);
    if (!state) throw new Error('Game not found');
    
    turnTimer.clearTimer(roomId);
    const newState = doChallenge(state, challengerId);
    await this.saveGameState(newState);
    this.startTurnTimer(newState);
    await this.scheduleBotTurnIfNeeded(newState);
    return newState;
  }
  
  async processChooseColor(roomId: string, playerId: string, color: CardColor): Promise<GameState> {
    const state = await this.getGameState(roomId);
    if (!state) throw new Error('Game not found');
    
    const newState = doChooseColor(state, playerId, color);
    await this.saveGameState(newState);
    
    if (newState.phase !== 'challenge_window') {
      this.startTurnTimer(newState);
    }
    await this.scheduleBotTurnIfNeeded(newState);
    return newState;
  }
  
  async handlePlayerDisconnect(roomId: string, playerId: string): Promise<void> {
    const state = await this.getGameState(roomId);
    if (!state) return;
    
    const updatedPlayers = state.players.map(p =>
      p.id === playerId ? { ...p, isConnected: false } : p
    );
    
    const newState = { ...state, players: updatedPlayers };
    await this.saveGameState(newState);
    await this.broadcastState(roomId, newState);
    
    reconnectManager.startReconnectTimer(
      roomId,
      playerId,
      30,
      async (rId, pId) => {
        await this.handleReconnectTimeout(rId, pId);
      }
    );
  }
  
  async handlePlayerReconnect(roomId: string, playerId: string): Promise<GameState | null> {
    reconnectManager.cancelTimer(roomId, playerId);
    
    const state = await this.getGameState(roomId);
    if (!state) return null;
    
    const updatedPlayers = state.players.map(p =>
      p.id === playerId ? { ...p, isConnected: true } : p
    );
    
    const newState = { ...state, players: updatedPlayers };
    await this.saveGameState(newState);
    await this.broadcastState(roomId, newState);
    return newState;
  }
  
  private async handleReconnectTimeout(roomId: string, playerId: string): Promise<void> {
    const state = await this.getGameState(roomId);
    if (!state || state.phase === 'finished') return;
    
    // Convert to bot or forfeit
    const updatedPlayers = state.players.map(p =>
      p.id === playerId
        ? { ...p, isBot: true, botDifficulty: 'easy' as const }
        : p
    );
    
    const newState = { ...state, players: updatedPlayers };
    await this.saveGameState(newState);
    this.emit(roomId, 'player_bot_takeover', { playerId });
  }
  
  private startTurnTimer(state: GameState): void {
    if (state.phase !== 'playing' && state.phase !== 'challenge_window') return;
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isBot) return; // Bots have their own timing
    
    turnTimer.startTimer(
      state.roomId,
      currentPlayer.id,
      state.turnTimerSeconds,
      async (roomId, playerId) => {
        // Auto-draw on timeout
        try {
          const newState = await this.processDrawCard(roomId, playerId);
          await this.broadcastState(roomId, newState);
          this.emit(roomId, 'turn_timeout', { playerId });
        } catch (err) {
          logger.error('Turn timer error', err);
        }
      }
    );
  }
  
  private async scheduleBotTurnIfNeeded(state: GameState): Promise<void> {
    if (state.phase !== 'playing') return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer?.isBot) return;
    
    // Add human-like delay
    const delay = 1000 + Math.random() * 1500;
    setTimeout(() => this.executeBotTurn(state.roomId), delay);
  }
  
  private async executeBotTurn(roomId: string): Promise<void> {
    try {
      const state = await this.getGameState(roomId);
      if (!state || state.phase !== 'playing') return;
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (!currentPlayer?.isBot) return;
      
      const botAction = getBotAction(state, currentPlayer.id);
      
      let newState: GameState;
      if (botAction.action === 'play' && botAction.cardId) {
        newState = await this.processPlayCard(roomId, currentPlayer.id, botAction.cardId, botAction.chosenColor);
      } else {
        newState = await this.processDrawCard(roomId, currentPlayer.id);
      }
      
      // Emit to all players with their personalized state
      await this.broadcastState(roomId, newState);
      
      if (newState.phase === 'finished') {
        this.emit(roomId, 'game_over', { winner: newState.winner, players: newState.players.map(p => ({ id: p.id, score: p.score })) });
      }
    } catch (err) {
      logger.error('Bot turn error', err);
    }
  }
  
  async finishGame(state: GameState): Promise<void> {
    turnTimer.clearTimer(state.roomId);
    
    // Save to database
    try {
      await prisma.gameSession.update({
        where: { id: state.sessionId },
        data: {
          status: 'FINISHED',
          finishedAt: new Date(),
          winnerId: state.winner,
        },
      });
      
      // Update player stats
      for (const player of state.players) {
        if (player.isBot) continue;
        
        const isWinner = player.id === state.winner;
        
        await prisma.userStats.upsert({
          where: { userId: player.id },
          create: {
            userId: player.id,
            totalGames: 1,
            wins: isWinner ? 1 : 0,
            losses: isWinner ? 0 : 1,
            winRate: isWinner ? 100 : 0,
            highestScore: player.score,
            currentRating: isWinner ? 1025 : 975,
            level: 1,
            xp: isWinner ? 100 : 25,
          },
          update: {
            totalGames: { increment: 1 },
            wins: isWinner ? { increment: 1 } : undefined,
            losses: isWinner ? undefined : { increment: 1 },
            xp: { increment: isWinner ? 100 : 25 },
            currentRating: { increment: isWinner ? 25 : -15 },
          },
        });
        
        // Update win rate
        const stats = await prisma.userStats.findUnique({ where: { userId: player.id } });
        if (stats) {
          const winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;
          await prisma.userStats.update({
            where: { userId: player.id },
            data: {
              winRate,
              highestScore: Math.max(stats.highestScore, player.score),
              level: Math.floor(stats.xp / 500) + 1,
            },
          });
        }
        
        await prisma.matchHistory.create({
          data: {
            userId: player.id,
            sessionId: state.sessionId,
            result: isWinner ? 'WIN' : 'LOSS',
            score: player.score,
            duration: Math.floor((Date.now() - state.turnStartedAt) / 1000),
          },
        });
      }
    } catch (err) {
      logger.error('Error finishing game', err);
    }
    
    this.games.delete(state.roomId);
  }
  
  getPublicState(state: GameState, viewingPlayerId: string): PublicGameState {
    return getPublicGameState(state, viewingPlayerId);
  }
}

export const gameService = new GameService();
