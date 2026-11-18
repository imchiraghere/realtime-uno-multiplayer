import { randomInt } from 'crypto';
import { UnoCard, CardColor, CardValue, createCard } from './card';

const COLORS: CardColor[] = ['red', 'green', 'blue', 'yellow'];
const NUMBER_VALUES: CardValue[] = ['0','1','2','3','4','5','6','7','8','9'];
const ACTION_VALUES: CardValue[] = ['skip', 'reverse', 'draw_two'];

export function createDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  
  for (const color of COLORS) {
    // One '0' per color
    deck.push(createCard(color, '0'));
    // Two of each 1-9 and action cards per color
    for (const value of [...NUMBER_VALUES.slice(1), ...ACTION_VALUES]) {
      deck.push(createCard(color, value));
      deck.push(createCard(color, value));
    }
  }
  
  // 4 Wild + 4 Wild Draw Four + 2 Wild Shuffle Hands
  for (let i = 0; i < 4; i++) {
    deck.push(createCard('wild', 'wild'));
    deck.push(createCard('wild', 'wild_draw_four'));
  }
  // 2 Wild Shuffle Hands cards (Special Modern UNO feature)
  deck.push(createCard('wild', 'wild_shuffle'));
  deck.push(createCard('wild', 'wild_shuffle'));
  
  return deck; // 110 cards total
}

export function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function verifyDeckComposition(deck: UnoCard[]): boolean {
  if (deck.length !== 110) return false;
  
  let coloredCards = 0;
  let wildCards = 0;
  
  for (const card of deck) {
    if (card.color === 'wild') wildCards++;
    else coloredCards++;
  }
  
  return coloredCards === 100 && wildCards === 10;
}
