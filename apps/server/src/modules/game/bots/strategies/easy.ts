import { UnoCard, CardColor } from '../../engine/card';
import { isValidPlay } from '../../engine/rules';
import { HouseRules } from '../../engine/gameState';
import { randomInt } from 'crypto';

export function easyStrategy(
  hand: UnoCard[],
  topCard: UnoCard,
  currentColor: CardColor,
  gameMode: string,
  houseRules: HouseRules
): UnoCard | null {
  const validCards = hand.filter(card =>
    isValidPlay(card, topCard, currentColor, hand, gameMode, houseRules)
  );
  if (validCards.length === 0) return null;
  // Pick random valid card
  return validCards[randomInt(0, validCards.length)];
}

export function easyChooseColor(hand: UnoCard[]): CardColor {
  // Pick most frequent color in hand
  const counts: Record<string, number> = {};
  for (const card of hand) {
    if (card.color !== 'wild') counts[card.color] = (counts[card.color] || 0) + 1;
  }
  const colors: CardColor[] = ['red', 'green', 'blue', 'yellow'];
  return colors.reduce((a, b) => (counts[a] || 0) >= (counts[b] || 0) ? a : b);
}
