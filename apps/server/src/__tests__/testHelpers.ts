import { UnoCard, CardColor, CardValue } from '../modules/game/engine/card';
import { GameState, PlayerState, DEFAULT_HOUSE_RULES } from '../modules/game/engine/gameState';

let cardCounter = 0;

export function createMockCard(color: CardColor, value: CardValue, id?: string): UnoCard {
  return {
    id: id || `test-card-${++cardCounter}`,
    color,
    value,
  };
}

export function createMockPlayer(
  id: string,
  username: string,
  hand: UnoCard[] = [],
  overrides: Partial<PlayerState> = {}
): PlayerState {
  return {
    id,
    username,
    seat: 0,
    hand,
    hasCalledUno: false,
    isConnected: true,
    isBot: false,
    score: 0,
    ...overrides,
  };
}

export function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const p1 = createMockPlayer('p1', 'Player 1', [
    createMockCard('red', '5'),
    createMockCard('blue', '3'),
  ]);
  const p2 = createMockPlayer('p2', 'Player 2', [
    createMockCard('green', '7'),
    createMockCard('yellow', '2'),
  ]);
  const p3 = createMockPlayer('p3', 'Player 3', [
    createMockCard('red', '9'),
    createMockCard('yellow', '5'),
  ]);

  const topCard = createMockCard('red', '1');

  return {
    sessionId: 'session-123',
    roomId: 'room-456',
    players: [p1, p2, p3],
    drawPile: [
      createMockCard('blue', '1'),
      createMockCard('green', '2'),
      createMockCard('yellow', '3'),
      createMockCard('red', '4'),
    ],
    discardPile: [topCard],
    currentPlayerIndex: 0,
    direction: 1,
    currentColor: 'red',
    phase: 'playing',
    pendingDrawCount: 0,
    lastPlayedCard: topCard,
    winner: null,
    turnStartedAt: Date.now(),
    unoDeclarations: {},
    challengeWindow: null,
    gameMode: 'classic',
    houseRules: { ...DEFAULT_HOUSE_RULES },
    turnTimerSeconds: 30,
    turnNumber: 1,
    ...overrides,
  };
}
