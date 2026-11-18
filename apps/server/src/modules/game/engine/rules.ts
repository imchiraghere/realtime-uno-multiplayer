import { UnoCard, CardColor, getCardPoints } from './card';
import { GameState, PlayerState, HouseRules } from './gameState';
import { randomInt } from 'crypto';

export function isValidPlay(
  card: UnoCard,
  topCard: UnoCard,
  currentColor: CardColor,
  playerHand: UnoCard[],
  gameMode: string,
  houseRules: HouseRules
): boolean {
  // House rules draw stacking
  if (houseRules.drawStacking) {
    if (topCard.value === 'draw_two' && card.value === 'draw_two') return true;
    if (topCard.value === 'wild_draw_four' && card.value === 'wild_draw_four') return true;
  }

  // Wild cards, Wild Draw Four (+4), and Wild Shuffle cards can always be played on any turn
  if (card.value === 'wild' || card.value === 'wild_draw_four' || card.value === 'wild_shuffle') return true;
  
  // Match color (using currentColor, not topCard.color, for wild)
  if (card.color === currentColor) return true;
  
  // Match value
  if (card.value === topCard.value) return true;
  
  return false;
}

export function canPlayWildDrawFour(
  _card: UnoCard,
  playerHand: UnoCard[],
  currentColor: CardColor
): boolean {
  // Can only play WD4 if no card in hand matches current color
  return !playerHand.some(c => c.color === currentColor && c.value !== 'wild_draw_four' && c.value !== 'wild' && c.value !== 'wild_shuffle');
}

export function getNextPlayerIndex(
  state: GameState,
  skip = 0
): number {
  const count = state.players.length;
  let next = state.currentPlayerIndex;
  for (let i = 0; i <= skip; i++) {
    next = ((next + state.direction) % count + count) % count;
  }
  return next;
}

export function calculateScores(players: PlayerState[]): Record<string, number> {
  const scores: Record<string, number> = {};
  
  for (const player of players) {
    if (player.hand.length === 0) {
      // Winner: sum of all other players' hand values
      let total = 0;
      for (const other of players) {
        if (other.id !== player.id) {
          for (const card of other.hand) {
            total += getCardPoints(card);
          }
        }
      }
      scores[player.id] = total;
    } else {
      scores[player.id] = 0;
    }
  }
  
  return scores;
}

export function reshuffleIfNeeded(state: GameState): GameState {
  if (state.drawPile.length > 0) return state;
  
  if (state.discardPile.length <= 1) {
    // No cards to reshuffle - extremely rare edge case
    return state;
  }
  
  const topCard = state.discardPile[state.discardPile.length - 1];
  const toShuffle = state.discardPile.slice(0, -1);
  
  // Secure Fisher-Yates shuffle
  const shuffled = [...toShuffle];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return {
    ...state,
    drawPile: shuffled,
    discardPile: [topCard],
  };
}

export function isGameOver(state: GameState): boolean {
  return state.players.some(p => p.hand.length === 0);
}

export function getWinner(state: GameState): PlayerState | null {
  return state.players.find(p => p.hand.length === 0) ?? null;
}
