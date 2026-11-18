export type CardColor = 'red' | 'green' | 'blue' | 'yellow' | 'wild';
export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four' | 'wild_shuffle';

export interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
}

export type GamePhase = 'waiting' | 'playing' | 'choosing_color' | 'challenge_window' | 'finished';

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
  challengeWindow: { active: boolean; challengedPlayerId: string; previousColor: CardColor } | null;
  gameMode: string;
  houseRules: Record<string, unknown>;
  turnTimerSeconds: number;
  turnNumber: number;
  myHand?: UnoCard[];
}
