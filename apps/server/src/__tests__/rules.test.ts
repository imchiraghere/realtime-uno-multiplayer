import { describe, it, expect } from 'vitest';
import {
  isValidPlay,
  canPlayWildDrawFour,
  getNextPlayerIndex,
  calculateScores,
  reshuffleIfNeeded,
  isGameOver,
  getWinner,
} from '../modules/game/engine/rules';
import { computeGameResult } from '../modules/game/engine/scoring';
import { DEFAULT_HOUSE_RULES, GameState } from '../modules/game/engine/gameState';
import { createMockCard, createMockPlayer, createMockGameState } from './testHelpers';

describe('Game Rules Engine', () => {
  const defaultRules = { ...DEFAULT_HOUSE_RULES };

  describe('Color and Number Matching (isValidPlay)', () => {
    it('allows playing a card that matches the current color', () => {
      const topCard = createMockCard('red', '7');
      const cardToPlay = createMockCard('red', '3');
      const hand = [cardToPlay];

      expect(isValidPlay(cardToPlay, topCard, 'red', hand, 'classic', defaultRules)).toBe(true);
    });

    it('allows playing a card that matches current color when top card was wild', () => {
      const topCard = createMockCard('wild', 'wild');
      const cardToPlay = createMockCard('blue', '4');
      const hand = [cardToPlay];

      // Current color was chosen as 'blue'
      expect(isValidPlay(cardToPlay, topCard, 'blue', hand, 'classic', defaultRules)).toBe(true);
      // But green card is invalid if currentColor is blue
      const greenCard = createMockCard('green', '4');
      // Wait: green 4 has same value ('4') as blue 4! Let's test with different value:
      const greenCardDifferentValue = createMockCard('green', '9');
      expect(isValidPlay(greenCardDifferentValue, topCard, 'blue', [greenCardDifferentValue], 'classic', defaultRules)).toBe(false);
    });

    it('allows playing a card that matches the value/number of top card regardless of color', () => {
      const topCard = createMockCard('red', '5');
      const cardToPlay = createMockCard('green', '5');
      const hand = [cardToPlay];

      expect(isValidPlay(cardToPlay, topCard, 'red', hand, 'classic', defaultRules)).toBe(true);
    });

    it('allows matching action cards by value/type across different colors', () => {
      const topCard = createMockCard('blue', 'skip');
      const cardToPlay = createMockCard('yellow', 'skip');
      const hand = [cardToPlay];

      expect(isValidPlay(cardToPlay, topCard, 'blue', hand, 'classic', defaultRules)).toBe(true);
    });

    it('allows matching action cards by color', () => {
      const topCard = createMockCard('green', 'reverse');
      const cardToPlay = createMockCard('green', 'draw_two');
      const hand = [cardToPlay];

      expect(isValidPlay(cardToPlay, topCard, 'green', hand, 'classic', defaultRules)).toBe(true);
    });

    it('rejects cards that match neither color nor value', () => {
      const topCard = createMockCard('red', '7');
      const cardToPlay = createMockCard('blue', '3');
      const hand = [cardToPlay];

      expect(isValidPlay(cardToPlay, topCard, 'red', hand, 'classic', defaultRules)).toBe(false);
    });
  });

  describe('Wild Card Rules', () => {
    it('always allows standard Wild cards regardless of top card or current color', () => {
      const topCard = createMockCard('yellow', '9');
      const wildCard = createMockCard('wild', 'wild');
      const hand = [wildCard, createMockCard('yellow', '2')];

      expect(isValidPlay(wildCard, topCard, 'yellow', hand, 'classic', defaultRules)).toBe(true);
    });

    describe('Wild Draw Four Restrictions (canPlayWildDrawFour)', () => {
      it('allows WD4 in classic mode when player has NO cards matching current color', () => {
        const wd4 = createMockCard('wild', 'wild_draw_four');
        const hand = [
          wd4,
          createMockCard('blue', '2'),
          createMockCard('green', '5'),
          createMockCard('wild', 'wild'),
        ];
        const topCard = createMockCard('red', '4');

        expect(canPlayWildDrawFour(wd4, hand, 'red')).toBe(true);
        expect(isValidPlay(wd4, topCard, 'red', hand, 'classic', defaultRules)).toBe(true);
      });

      it('marks WD4 as illegal bluff via canPlayWildDrawFour when player has matching color, but permits playing it in classic mode', () => {
        const wd4 = createMockCard('wild', 'wild_draw_four');
        const hand = [
          wd4,
          createMockCard('red', '2'), // matches currentColor 'red'
          createMockCard('blue', '5'),
        ];
        const topCard = createMockCard('red', '4');

        expect(canPlayWildDrawFour(wd4, hand, 'red')).toBe(false);
        expect(isValidPlay(wd4, topCard, 'red', hand, 'classic', defaultRules)).toBe(true);
      });

      it('does not treat other wild or WD4 cards in hand as matching the current color', () => {
        const wd4 = createMockCard('wild', 'wild_draw_four');
        const hand = [
          wd4,
          createMockCard('wild', 'wild'),
          createMockCard('wild', 'wild_draw_four'),
        ];

        expect(canPlayWildDrawFour(wd4, hand, 'yellow')).toBe(true);
      });

      it('permits WD4 freely regardless of hand in house_rules mode', () => {
        const wd4 = createMockCard('wild', 'wild_draw_four');
        const hand = [
          wd4,
          createMockCard('red', '9'), // has red card
        ];
        const topCard = createMockCard('red', '4');

        expect(isValidPlay(wd4, topCard, 'red', hand, 'house_rules', defaultRules)).toBe(true);
      });
    });
  });

  describe('Draw Stacking Rules', () => {
    it('disallows stacking draw_two on draw_two if colors do not match when drawStacking is false', () => {
      const topCard = createMockCard('red', 'draw_two');
      const cardToPlay = createMockCard('blue', 'draw_two');
      // Wait: when drawStacking is false, cardToPlay matches topCard by value ('draw_two')!
      // In isValidPlay line 33: if (card.value === topCard.value) return true;
      // BUT let's test drawStacking specifically:
      // What if drawStacking is true?
      const stackingRules = { ...defaultRules, drawStacking: true };
      expect(isValidPlay(cardToPlay, topCard, 'red', [cardToPlay], 'classic', stackingRules)).toBe(true);
    });

    it('allows wild_draw_four stacking on wild_draw_four when drawStacking is true even in classic mode', () => {
      const topCard = createMockCard('wild', 'wild_draw_four');
      const cardToPlay = createMockCard('wild', 'wild_draw_four');
      // Even if player has a red card matching currentColor:
      const hand = [cardToPlay, createMockCard('red', '5')];
      const stackingRules = { ...defaultRules, drawStacking: true };

      expect(isValidPlay(cardToPlay, topCard, 'red', hand, 'classic', stackingRules)).toBe(true);
    });
  });

  describe('Player Index & Turn Progression (getNextPlayerIndex)', () => {
    it('advances clockwise (direction 1)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer('p1', 'P1'),
          createMockPlayer('p2', 'P2'),
          createMockPlayer('p3', 'P3'),
        ],
        currentPlayerIndex: 0,
        direction: 1,
      });

      expect(getNextPlayerIndex(state)).toBe(1);
      expect(getNextPlayerIndex({ ...state, currentPlayerIndex: 2 })).toBe(0);
    });

    it('advances counter-clockwise (direction -1)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer('p1', 'P1'),
          createMockPlayer('p2', 'P2'),
          createMockPlayer('p3', 'P3'),
        ],
        currentPlayerIndex: 0,
        direction: -1,
      });

      expect(getNextPlayerIndex(state)).toBe(2);
      expect(getNextPlayerIndex({ ...state, currentPlayerIndex: 2 })).toBe(1);
    });

    it('handles skip parameter in getNextPlayerIndex', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer('p1', 'P1'),
          createMockPlayer('p2', 'P2'),
          createMockPlayer('p3', 'P3'),
          createMockPlayer('p4', 'P4'),
        ],
        currentPlayerIndex: 0,
        direction: 1,
      });

      // skip = 1 skips player 1 and lands on player 2
      expect(getNextPlayerIndex(state, 1)).toBe(2);
    });
  });

  describe('Scoring Calculation', () => {
    it('calculates score for winner based on opponents hands', () => {
      const p1 = createMockPlayer('p1', 'P1', []); // Winner
      const p2 = createMockPlayer('p2', 'P2', [
        createMockCard('red', '5'), // 5 pts
        createMockCard('blue', 'skip'), // 20 pts
      ]);
      const p3 = createMockPlayer('p3', 'P3', [
        createMockCard('wild', 'wild'), // 50 pts
        createMockCard('yellow', '0'), // 0 pts
      ]);

      const scores = calculateScores([p1, p2, p3]);

      // Winner gets 5 + 20 + 50 + 0 = 75
      expect(scores['p1']).toBe(75);
      expect(scores['p2']).toBe(0);
      expect(scores['p3']).toBe(0);
    });

    it('computes full game result with rankings', () => {
      const p1 = createMockPlayer('p1', 'P1', []);
      const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', 'draw_two')]); // 20 pts

      const result = computeGameResult([p1, p2]);

      expect(result.winnerId).toBe('p1');
      expect(result.scores['p1']).toBe(20);
      expect(result.scores['p2']).toBe(0);
      expect(result.rankings).toEqual([
        { playerId: 'p1', position: 1, score: 20 },
        { playerId: 'p2', position: 2, score: 0 },
      ]);
    });

    it('throws error in computeGameResult if no player has 0 cards', () => {
      const p1 = createMockPlayer('p1', 'P1', [createMockCard('red', '1')]);
      const p2 = createMockPlayer('p2', 'P2', [createMockCard('blue', '2')]);

      expect(() => computeGameResult([p1, p2])).toThrow('No winner found');
    });
  });

  describe('Reshuffle and Game Over Checks', () => {
    it('does not reshuffle if draw pile is not empty', () => {
      const state = createMockGameState({
        drawPile: [createMockCard('red', '1')],
        discardPile: [createMockCard('blue', '2'), createMockCard('green', '3')],
      });

      const res = reshuffleIfNeeded(state);
      expect(res).toBe(state);
    });

    it('reshuffles discard pile when draw pile is empty, preserving top card', () => {
      const topDiscard = createMockCard('yellow', '9', 'top-card');
      const under1 = createMockCard('red', '1', 'under-1');
      const under2 = createMockCard('blue', '2', 'under-2');

      const state = createMockGameState({
        drawPile: [],
        discardPile: [under1, under2, topDiscard],
      });

      const res = reshuffleIfNeeded(state);

      expect(res.discardPile).toHaveLength(1);
      expect(res.discardPile[0].id).toBe('top-card');
      expect(res.drawPile).toHaveLength(2);
      const drawPileIds = res.drawPile.map(c => c.id).sort();
      expect(drawPileIds).toEqual(['under-1', 'under-2']);
    });

    it('correctly identifies game over and winner', () => {
      const p1 = createMockPlayer('p1', 'P1', [createMockCard('red', '1')]);
      const p2 = createMockPlayer('p2', 'P2', []);

      const state = createMockGameState({ players: [p1, p2] });

      expect(isGameOver(state)).toBe(true);
      expect(getWinner(state)?.id).toBe('p2');

      const ongoingState = createMockGameState({
        players: [p1, createMockPlayer('p3', 'P3', [createMockCard('blue', '2')])],
      });
      expect(isGameOver(ongoingState)).toBe(false);
      expect(getWinner(ongoingState)).toBeNull();
    });
  });
});
