import { describe, it, expect } from 'vitest';
import { createDeck, shuffleDeck, verifyDeckComposition } from '../modules/game/engine/deck';
import { getCardPoints, createCard, CardColor, CardValue } from '../modules/game/engine/card';

describe('Deck Composition and Mechanics', () => {
  it('creates an official 110-card UNO deck with Wild Shuffle Hands', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(110);
    expect(verifyDeckComposition(deck)).toBe(true);
  });

  it('contains unique IDs for all cards in the deck', () => {
    const deck = createDeck();
    const ids = new Set(deck.map(c => c.id));
    expect(ids.size).toBe(110);
  });

  it('has exact color distribution: 25 cards per color (100 total colored cards)', () => {
    const deck = createDeck();
    const colors: CardColor[] = ['red', 'green', 'blue', 'yellow'];

    for (const color of colors) {
      const colorCards = deck.filter(c => c.color === color);
      expect(colorCards).toHaveLength(25);
    }
  });

  it('has exactly 1 zero card per color', () => {
    const deck = createDeck();
    const colors: CardColor[] = ['red', 'green', 'blue', 'yellow'];

    for (const color of colors) {
      const zeros = deck.filter(c => c.color === color && c.value === '0');
      expect(zeros).toHaveLength(1);
    }
  });

  it('has exactly 2 of each number card 1-9 per color', () => {
    const deck = createDeck();
    const colors: CardColor[] = ['red', 'green', 'blue', 'yellow'];
    const numbers: CardValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    for (const color of colors) {
      for (const num of numbers) {
        const matching = deck.filter(c => c.color === color && c.value === num);
        expect(matching).toHaveLength(2);
      }
    }
  });

  it('has exactly 2 of each action card (skip, reverse, draw_two) per color', () => {
    const deck = createDeck();
    const colors: CardColor[] = ['red', 'green', 'blue', 'yellow'];
    const actions: CardValue[] = ['skip', 'reverse', 'draw_two'];

    for (const color of colors) {
      for (const action of actions) {
        const matching = deck.filter(c => c.color === color && c.value === action);
        expect(matching).toHaveLength(2);
      }
    }
  });

  it('has exactly 4 Wild, 4 Wild Draw Four, and 2 Wild Shuffle Hands cards (10 wild cards total)', () => {
    const deck = createDeck();
    const wilds = deck.filter(c => c.color === 'wild' && c.value === 'wild');
    const wildDrawFours = deck.filter(c => c.color === 'wild' && c.value === 'wild_draw_four');
    const wildShuffles = deck.filter(c => c.color === 'wild' && c.value === 'wild_shuffle');
    const allWilds = deck.filter(c => c.color === 'wild');

    expect(wilds).toHaveLength(4);
    expect(wildDrawFours).toHaveLength(4);
    expect(wildShuffles).toHaveLength(2);
    expect(allWilds).toHaveLength(10);
  });

  it('verifyDeckComposition correctly detects invalid decks', () => {
    const validDeck = createDeck();
    expect(verifyDeckComposition(validDeck)).toBe(true);

    // Too few cards
    expect(verifyDeckComposition(validDeck.slice(1))).toBe(false);

    // Wrong color balance
    const alteredDeck = [...validDeck];
    alteredDeck[0] = createCard('wild', 'wild');
    expect(verifyDeckComposition(alteredDeck)).toBe(false);
  });

  describe('Card Points (Scoring Values)', () => {
    it('returns face value points for number cards 0-9', () => {
      const numbers: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      for (const num of numbers) {
        const card = createCard('red', num);
        expect(getCardPoints(card)).toBe(parseInt(num, 10));
      }
    });

    it('returns 20 points for action cards (skip, reverse, draw_two)', () => {
      expect(getCardPoints(createCard('green', 'skip'))).toBe(20);
      expect(getCardPoints(createCard('blue', 'reverse'))).toBe(20);
      expect(getCardPoints(createCard('yellow', 'draw_two'))).toBe(20);
    });

    it('returns 50 points for wild and wild_draw_four cards', () => {
      expect(getCardPoints(createCard('wild', 'wild'))).toBe(50);
      expect(getCardPoints(createCard('wild', 'wild_draw_four'))).toBe(50);
    });
  });

  describe('Fisher-Yates Shuffle', () => {
    it('preserves all cards without loss or duplication (card conservation)', () => {
      const originalDeck = createDeck();
      const shuffled = shuffleDeck(originalDeck);

      expect(shuffled).toHaveLength(originalDeck.length);

      const originalIds = originalDeck.map(c => c.id).sort();
      const shuffledIds = shuffled.map(c => c.id).sort();
      expect(shuffledIds).toEqual(originalIds);
    });

    it('does not mutate the original deck array', () => {
      const originalDeck = createDeck();
      const firstCardId = originalDeck[0].id;
      const lastCardId = originalDeck[originalDeck.length - 1].id;

      shuffleDeck(originalDeck);

      expect(originalDeck[0].id).toBe(firstCardId);
      expect(originalDeck[originalDeck.length - 1].id).toBe(lastCardId);
    });

    it('produces randomized permutations', () => {
      const originalDeck = createDeck();
      const shuffled1 = shuffleDeck(originalDeck);
      const shuffled2 = shuffleDeck(originalDeck);

      // Shuffled deck should not match the original unshuffled order
      const originalIds = originalDeck.map(c => c.id);
      const s1Ids = shuffled1.map(c => c.id);
      const s2Ids = shuffled2.map(c => c.id);

      expect(s1Ids).not.toEqual(originalIds);
      expect(s2Ids).not.toEqual(originalIds);
      expect(s1Ids).not.toEqual(s2Ids);
    });
  });
});
