import { v4 as uuidv4 } from 'uuid';

export type CardColor = 'red' | 'green' | 'blue' | 'yellow' | 'wild';
export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four' | 'wild_shuffle';

export interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
}

export function createCard(color: CardColor, value: CardValue): UnoCard {
  return { id: uuidv4(), color, value };
}

export function getCardPoints(card: UnoCard): number {
  if (['0','1','2','3','4','5','6','7','8','9'].includes(card.value)) {
    return parseInt(card.value);
  }
  if (['skip', 'reverse', 'draw_two'].includes(card.value)) return 20;
  if (['wild', 'wild_draw_four', 'wild_shuffle'].includes(card.value)) return 50;
  return 0;
}
