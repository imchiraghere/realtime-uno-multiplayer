import { UnoCard, CardColor, getCardPoints } from '../../engine/card';
import { isValidPlay } from '../../engine/rules';
import { HouseRules } from '../../engine/gameState';
import { randomInt } from 'crypto';

export function hardStrategy(
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
  
  const minOpponentCards = Math.min(...opponentCardCounts);
  
  // If any opponent has 1 card, play draw or shuffle card immediately
  if (minOpponentCards <= 1) {
    const drawFour = validCards.find(c => c.value === 'wild_draw_four');
    if (drawFour) return drawFour;
    const shuffle = validCards.find(c => c.value === 'wild_shuffle');
    if (shuffle) return shuffle;
    const drawTwo = validCards.find(c => c.value === 'draw_two');
    if (drawTwo) return drawTwo;
    const skip = validCards.find(c => c.value === 'skip');
    if (skip) return skip;
  }
  
  // Prefer the color most represented in own hand
  const colorCounts: Record<string, number> = {};
  for (const card of hand) {
    if (card.color !== 'wild') colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
  }
  
  // Play non-wild cards that match best color
  const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  const bestColor = sortedColors[0]?.[0] as CardColor | undefined;
  if (bestColor) {
    const bestColorCards = validCards.filter(c => c.color === bestColor && c.color !== 'wild');
    if (bestColorCards.length > 0) {
      // Play highest-value card of best color
      return bestColorCards.sort((a, b) => getCardPoints(b) - getCardPoints(a))[0];
    }
  }
  
  // Play non-wild, non-best-color
  const nonWild = validCards.filter(c => c.color !== 'wild');
  if (nonWild.length > 0) return nonWild[0];
  
  // Wild (save WD4 if possible)
  const wild = validCards.find(c => c.value === 'wild');
  if (wild) return wild;
  
  return validCards[0];
}

export function hardChooseColor(hand: UnoCard[]): CardColor {
  const counts: Record<string, number> = {};
  for (const card of hand) {
    if (card.color !== 'wild') counts[card.color] = (counts[card.color] || 0) + 1;
  }
  const colors: CardColor[] = ['red', 'green', 'blue', 'yellow'];
  if (Object.keys(counts).length === 0) {
    return colors[randomInt(0, colors.length)];
  }
  return colors.reduce((a, b) => (counts[a] || 0) >= (counts[b] || 0) ? a : b);
}
