import { UnoCard, CardColor } from '../../engine/card';
import { isValidPlay } from '../../engine/rules';
import { HouseRules } from '../../engine/gameState';
import { randomInt } from 'crypto';

export function mediumStrategy(
  hand: UnoCard[],
  topCard: UnoCard,
  currentColor: CardColor,
  gameMode: string,
  houseRules: HouseRules,
  opponentCardCounts: number[]
): UnoCard | null {
  const validCards = hand.filter(card =>
    isValidPlay(card, topCard, currentColor, hand, gameMode, houseRules)
  );
  if (validCards.length === 0) return null;
  
  const hasOpponentWithFewCards = opponentCardCounts.some(c => c <= 3);
  
  // Priority: action cards when opponent is close to winning
  if (hasOpponentWithFewCards) {
    const actionCard = validCards.find(c =>
      ['skip', 'reverse', 'draw_two', 'wild_draw_four'].includes(c.value)
    );
    if (actionCard) return actionCard;
  }
  
  // Prefer color-matching cards (save wilds)
  const colorMatch = validCards.filter(c => c.color === currentColor && c.color !== 'wild');
  if (colorMatch.length > 0) {
    return colorMatch[randomInt(0, colorMatch.length)];
  }
  
  // Last resort: any valid card (prefer non-wild)
  const nonWild = validCards.filter(c => c.color !== 'wild');
  if (nonWild.length > 0) {
    return nonWild[randomInt(0, nonWild.length)];
  }
  
  return validCards[randomInt(0, validCards.length)];
}

export function mediumChooseColor(hand: UnoCard[]): CardColor {
  const counts: Record<string, number> = {};
  for (const card of hand) {
    if (card.color !== 'wild') counts[card.color] = (counts[card.color] || 0) + 1;
  }
  const colors: CardColor[] = ['red', 'green', 'blue', 'yellow'];
  return colors.reduce((a, b) => (counts[a] || 0) >= (counts[b] || 0) ? a : b);
}
