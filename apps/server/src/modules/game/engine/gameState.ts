import { UnoCard, CardColor } from './card';

export interface HouseRules {
  drawStacking: boolean;
  jumpIn: boolean;
  sevenZeroSwap: boolean;
  forcePlay: boolean;
  startingHandSize: number;
  customTurnTimer: number | null;
  customScoreLimit: number | null;
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  drawStacking: false,
  jumpIn: false,
  sevenZeroSwap: false,
  forcePlay: false,
  startingHandSize: 7,
  customTurnTimer: null,
  customScoreLimit: null,
};

export interface PlayerState {
  id: string;
  username: string;
  seat: number;
  hand: UnoCard[];
  hasCalledUno: boolean;
  isConnected: boolean;
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  score: number;
  avatarUrl?: string;
}

export interface ChallengeWindow {
  active: boolean;
  challengedPlayerId: string;
  previousColor: CardColor;
  previousHand: UnoCard[];
}

export type GamePhase =
  | 'waiting'
  | 'playing'
  | 'choosing_color'
  | 'challenge_window'
  | 'finished';

export type GameMode = 'classic' | 'house_rules' | 'quick_match';

export interface GameState {
  sessionId: string;
  roomId: string;
  players: PlayerState[];
  drawPile: UnoCard[];
  discardPile: UnoCard[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  currentColor: CardColor;
  phase: GamePhase;
  pendingDrawCount: number;
  lastPlayedCard: UnoCard | null;
  winner: string | null;
  turnStartedAt: number;
  unoDeclarations: Record<string, number>;
  challengeWindow: ChallengeWindow | null;
  gameMode: GameMode;
  houseRules: HouseRules;
  turnTimerSeconds: number;
  turnNumber: number;
}

export interface PublicPlayerState {
  id: string;
  username: string;
  seat: number;
  cardCount: number;
  hasCalledUno: boolean;
  isConnected: boolean;
  isBot: boolean;
  score: number;
  avatarUrl?: string;
  hand?: UnoCard[];
}

export interface PublicGameState {
  sessionId: string;
  roomId: string;
  players: PublicPlayerState[];
  discardPile: UnoCard[];
  drawPileCount: number;
  currentPlayerIndex: number;
  direction: 1 | -1;
  currentColor: CardColor;
  phase: GamePhase;
  pendingDrawCount: number;
  lastPlayedCard: UnoCard | null;
  winner: string | null;
  turnStartedAt: number;
  challengeWindow: Omit<ChallengeWindow, 'previousHand'> | null;
  gameMode: GameMode;
  houseRules: HouseRules;
  turnTimerSeconds: number;
  turnNumber: number;
  myHand?: UnoCard[];
}

export function getPublicGameState(state: GameState, viewingPlayerId: string): PublicGameState {
  return {
    sessionId: state.sessionId,
    roomId: state.roomId,
    players: state.players.map(p => ({
      id: p.id,
      username: p.username,
      seat: p.seat,
      cardCount: p.hand.length,
      hasCalledUno: p.hasCalledUno,
      isConnected: p.isConnected,
      isBot: p.isBot,
      score: p.score,
      avatarUrl: p.avatarUrl,
      ...(p.id === viewingPlayerId ? { hand: p.hand } : {}),
    })),
    discardPile: state.discardPile,
    drawPileCount: state.drawPile.length,
    currentPlayerIndex: state.currentPlayerIndex,
    direction: state.direction,
    currentColor: state.currentColor,
    phase: state.phase,
    pendingDrawCount: state.pendingDrawCount,
    lastPlayedCard: state.lastPlayedCard,
    winner: state.winner,
    turnStartedAt: state.turnStartedAt,
    challengeWindow: state.challengeWindow
      ? {
          active: state.challengeWindow.active,
          challengedPlayerId: state.challengeWindow.challengedPlayerId,
          previousColor: state.challengeWindow.previousColor,
        }
      : null,
    gameMode: state.gameMode,
    houseRules: state.houseRules,
    turnTimerSeconds: state.turnTimerSeconds,
    turnNumber: state.turnNumber,
    myHand: state.players.find(p => p.id === viewingPlayerId)?.hand,
  };
}
