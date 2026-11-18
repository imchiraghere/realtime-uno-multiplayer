import { describe, it, expect } from 'vitest';
import { easyStrategy, easyChooseColor } from '../modules/game/bots/strategies/easy';
import { mediumStrategy, mediumChooseColor } from '../modules/game/bots/strategies/medium';
import { hardStrategy, hardChooseColor } from '../modules/game/bots/strategies/hard';
import { getBotAction } from '../modules/game/bots/bot';
import { DEFAULT_HOUSE_RULES } from '../modules/game/engine/gameState';
import { createMockCard, createMockPlayer, createMockGameState } from './testHelpers';

describe('Bot AI Strategies and Behaviors', () => {
  const defaultRules = { ...DEFAULT_HOUSE_RULES };

  describe('Easy Strategy', () => {
    it('selects a valid playable card from hand', () => {
      const topCard = createMockCard('red', '5');
      const playable = createMockCard('red', '8', 'play-1');
      const unplayable = createMockCard('blue', '2', 'unplay-1');

      const hand = [unplayable, playable];
      const selected = easyStrategy(hand, topCard, 'red', 'classic', defaultRules);

      expect(selected).not.toBeNull();
      expect(selected?.id).toBe('play-1');
    });

    it('returns null when no cards are playable', () => {
      const topCard = createMockCard('red', '5');
      const hand = [
        createMockCard('blue', '2'),
        createMockCard('green', '3'),
      ];

      const selected = easyStrategy(hand, topCard, 'red', 'classic', defaultRules);
      expect(selected).toBeNull();
    });

    it('chooses the most frequent color in hand', () => {
      const hand = [
        createMockCard('green', '1'),
        createMockCard('green', '4'),
        createMockCard('red', '2'),
        createMockCard('wild', 'wild'),
      ];

      const color = easyChooseColor(hand);
      expect(color).toBe('green');
    });
  });

  describe('Medium Strategy', () => {
    it('prioritizes action cards when any opponent has <= 3 cards', () => {
      const topCard = createMockCard('blue', '4');
      const numberCard = createMockCard('blue', '7', 'num-card');
      const skipCard = createMockCard('blue', 'skip', 'skip-card');

      const hand = [numberCard, skipCard];
      const opponentCardCounts = [5, 2]; // One opponent has 2 cards (<= 3)

      const selected = mediumStrategy(
        hand,
        topCard,
        'blue',
        'classic',
        defaultRules,
        opponentCardCounts
      );

      expect(selected?.id).toBe('skip-card');
    });

    it('prefers color-matching regular cards over wild cards when opponents have many cards', () => {
      const topCard = createMockCard('yellow', '2');
      const colorCard = createMockCard('yellow', '8', 'color-card');
      const wildCard = createMockCard('wild', 'wild', 'wild-card');

      const hand = [wildCard, colorCard];
      const opponentCardCounts = [6, 7];

      const selected = mediumStrategy(
        hand,
        topCard,
        'yellow',
        'classic',
        defaultRules,
        opponentCardCounts
      );

      expect(selected?.id).toBe('color-card');
    });

    it('returns null when no playable cards are in hand', () => {
      const topCard = createMockCard('red', '5');
      const hand = [createMockCard('green', '1'), createMockCard('blue', '2')];

      const selected = mediumStrategy(
        hand,
        topCard,
        'red',
        'classic',
        defaultRules,
        [5, 5]
      );

      expect(selected).toBeNull();
    });

    it('chooses the most frequent color in hand', () => {
      const hand = [
        createMockCard('blue', '1'),
        createMockCard('blue', '3'),
        createMockCard('yellow', '5'),
      ];

      expect(mediumChooseColor(hand)).toBe('blue');
    });
  });

  describe('Hard Strategy', () => {
    it('plays wild_draw_four, draw_two, or skip when an opponent has 1 card (UNO threat)', () => {
      const topCard = createMockCard('red', '3');
      const wd4 = createMockCard('wild', 'wild_draw_four', 'wd4-card');
      const drawTwo = createMockCard('red', 'draw_two', 'd2-card');
      const numCard = createMockCard('red', '9', 'num-card');

      // Hand has WD4 (legal because no other red cards, wait, here hand has red cards!
      // In classic mode, WD4 is only legal if hand has NO red cards matching currentColor.
      // So if hand has red draw_two and red 9, WD4 is illegal. Let's test with draw_two:
      const handWithDrawTwo = [numCard, drawTwo];
      const opponentCounts = [4, 1]; // Opponent 2 has 1 card!

      const selectedD2 = hardStrategy(
        handWithDrawTwo,
        topCard,
        'red',
        'classic',
        defaultRules,
        opponentCounts
      );

      expect(selectedD2?.id).toBe('d2-card');

      // Now test WD4 when hand has no red cards:
      const handWithWD4 = [createMockCard('blue', '9'), wd4];
      const selectedWD4 = hardStrategy(
        handWithWD4,
        topCard,
        'red',
        'classic',
        defaultRules,
        opponentCounts
      );

      expect(selectedWD4?.id).toBe('wd4-card');
    });

    it('prefers the most represented color and plays highest point card first', () => {
      const topCard = createMockCard('yellow', '1');
      // Bot has dominant yellow hand:
      const lowYellow = createMockCard('yellow', '2', 'y-low'); // 2 pts
      const highYellow = createMockCard('yellow', '9', 'y-high'); // 9 pts
      const drawTwoYellow = createMockCard('yellow', 'draw_two', 'y-d2'); // 20 pts
      const blueCard = createMockCard('blue', '1', 'b-card');

      const hand = [lowYellow, highYellow, drawTwoYellow, blueCard];
      const opponentCounts = [5, 6];

      const selected = hardStrategy(
        hand,
        topCard,
        'yellow',
        'classic',
        defaultRules,
        opponentCounts
      );

      // Should play drawTwoYellow because it has highest points (20) in the dominant yellow color
      expect(selected?.id).toBe('y-d2');
    });

    it('returns null when no valid cards are in hand', () => {
      const topCard = createMockCard('green', '0');
      const hand = [createMockCard('red', '5'), createMockCard('blue', '6')];

      const selected = hardStrategy(
        hand,
        topCard,
        'green',
        'classic',
        defaultRules,
        [4, 4]
      );

      expect(selected).toBeNull();
    });

    it('chooses the most frequent color, or any valid color if hand has only wilds', () => {
      const hand = [createMockCard('red', '5'), createMockCard('red', '7'), createMockCard('blue', '1')];
      expect(hardChooseColor(hand)).toBe('red');

      const allWilds = [createMockCard('wild', 'wild')];
      const color = hardChooseColor(allWilds);
      expect(['red', 'green', 'blue', 'yellow']).toContain(color);
    });
  });

  describe('getBotAction function', () => {
    it('returns action play with chosenColor for Wild cards', () => {
      const wildCard = createMockCard('wild', 'wild', 'wild-bot-1');
      const botPlayer = createMockPlayer('bot-1', 'Bot', [
        wildCard,
        createMockCard('blue', '1'),
        createMockCard('blue', '7'),
      ], {
        isBot: true,
        botDifficulty: 'easy',
      });

      const state = createMockGameState({
        players: [botPlayer, createMockPlayer('p2', 'P2')],
        currentPlayerIndex: 0,
        currentColor: 'red',
        discardPile: [createMockCard('red', '4')],
      });

      const action = getBotAction(state, 'bot-1');

      expect(action.action).toBe('play');
      expect(action.cardId).toBe('wild-bot-1');
      // Blue is the dominant color in hand
      expect(action.chosenColor).toBe('blue');
    });

    it('returns action play without chosenColor for non-wild cards', () => {
      const redCard = createMockCard('red', '9', 'red-bot-9');
      const botPlayer = createMockPlayer('bot-med', 'Bot Med', [redCard], {
        isBot: true,
        botDifficulty: 'medium',
      });

      const state = createMockGameState({
        players: [botPlayer, createMockPlayer('p2', 'P2')],
        currentPlayerIndex: 0,
        currentColor: 'red',
        discardPile: [createMockCard('red', '1')],
      });

      const action = getBotAction(state, 'bot-med');

      expect(action.action).toBe('play');
      expect(action.cardId).toBe('red-bot-9');
      expect(action.chosenColor).toBeUndefined();
    });

    it('returns action draw when bot has no valid plays', () => {
      const botPlayer = createMockPlayer('bot-hard', 'Bot Hard', [
        createMockCard('green', '1'),
        createMockCard('yellow', '2'),
      ], {
        isBot: true,
        botDifficulty: 'hard',
      });

      const state = createMockGameState({
        players: [botPlayer, createMockPlayer('p2', 'P2')],
        currentPlayerIndex: 0,
        currentColor: 'red',
        discardPile: [createMockCard('red', '9')],
      });

      const action = getBotAction(state, 'bot-hard');

      expect(action.action).toBe('draw');
      expect(action.cardId).toBeUndefined();
    });

    it('throws error if bot player is not found in state', () => {
      const state = createMockGameState();
      expect(() => getBotAction(state, 'non-existent-bot')).toThrow('Bot not found');
    });
  });
});
