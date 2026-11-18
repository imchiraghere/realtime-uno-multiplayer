import { describe, it, expect } from 'vitest';
import { playCard } from '../modules/game/actions/playCard';
import { drawCard } from '../modules/game/actions/drawCard';
import { declareUno, catchUno } from '../modules/game/actions/declareUno';
import { challengeWildDrawFour } from '../modules/game/actions/challenge';
import { chooseColor } from '../modules/game/actions/chooseColor';
import { createMockCard, createMockPlayer, createMockGameState } from './testHelpers';

describe('Game Actions', () => {
  describe('playCard action', () => {
    it('plays a standard number card and advances turn to next player', () => {
      const red5 = createMockCard('red', '5', 'card-red-5');
      const p1 = createMockPlayer('p1', 'P1', [red5, createMockCard('blue', '1')]);
      const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '2')]);
      const p3 = createMockPlayer('p3', 'P3', [createMockCard('yellow', '3')]);

      const state = createMockGameState({
        players: [p1, p2, p3],
        currentPlayerIndex: 0,
        currentColor: 'red',
        discardPile: [createMockCard('red', '2')],
      });

      const nextState = playCard(state, 'card-red-5', 'p1');

      // Card removed from hand
      expect(nextState.players[0].hand).toHaveLength(1);
      expect(nextState.players[0].hand.some(c => c.id === 'card-red-5')).toBe(false);

      // Card on top of discard pile
      expect(nextState.discardPile[nextState.discardPile.length - 1].id).toBe('card-red-5');
      expect(nextState.lastPlayedCard?.id).toBe('card-red-5');
      expect(nextState.currentColor).toBe('red');

      // Turn advanced to player 2 (index 1)
      expect(nextState.currentPlayerIndex).toBe(1);
      expect(nextState.turnNumber).toBe(state.turnNumber + 1);
    });

    it('rejects playing card out of turn', () => {
      const state = createMockGameState({ currentPlayerIndex: 0 });
      expect(() => playCard(state, 'any-id', 'p2')).toThrow('Not your turn');
    });

    it('rejects playing card not in hand', () => {
      const state = createMockGameState({ currentPlayerIndex: 0 });
      expect(() => playCard(state, 'non-existent-card', 'p1')).toThrow('Card not in hand');
    });

    it('rejects illegal card plays according to UNO rules', () => {
      const blue7 = createMockCard('blue', '7', 'card-blue-7');
      const p1 = createMockPlayer('p1', 'P1', [blue7]);
      const state = createMockGameState({
        players: [p1],
        currentPlayerIndex: 0,
        currentColor: 'red',
        discardPile: [createMockCard('red', '2')],
      });

      expect(() => playCard(state, 'card-blue-7', 'p1')).toThrow('Invalid card play');
    });

    describe('Skip Card (2-Player vs 3+ Player)', () => {
      it('skips the next player in a 3+ player game', () => {
        const redSkip = createMockCard('red', 'skip', 'skip-1');
        const p1 = createMockPlayer('p1', 'P1', [redSkip]);
        const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '1')]);
        const p3 = createMockPlayer('p3', 'P3', [createMockCard('yellow', '2')]);

        const state = createMockGameState({
          players: [p1, p2, p3],
          currentPlayerIndex: 0,
          direction: 1,
          currentColor: 'red',
          discardPile: [createMockCard('red', '4')],
        });

        const nextState = playCard(state, 'skip-1', 'p1');

        // Player 2 (index 1) skipped -> Player 3 (index 2) gets turn
        expect(nextState.currentPlayerIndex).toBe(2);
      });

      it('gives current player an extra turn in a 2-player game', () => {
        const redSkip = createMockCard('red', 'skip', 'skip-2p');
        const p1 = createMockPlayer('p1', 'P1', [redSkip, createMockCard('red', '1')]);
        const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '1')]);

        const state = createMockGameState({
          players: [p1, p2],
          currentPlayerIndex: 0,
          direction: 1,
          currentColor: 'red',
          discardPile: [createMockCard('red', '4')],
        });

        const nextState = playCard(state, 'skip-2p', 'p1');

        // In 2-player, player 0 plays again
        expect(nextState.currentPlayerIndex).toBe(0);
      });
    });

    describe('Reverse Card (2-Player vs 3+ Player)', () => {
      it('inverts direction and routes turn backwards in a 3+ player game', () => {
        const redRev = createMockCard('red', 'reverse', 'rev-1');
        const p1 = createMockPlayer('p1', 'P1', [redRev]);
        const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '1')]);
        const p3 = createMockPlayer('p3', 'P3', [createMockCard('yellow', '2')]);

        const state = createMockGameState({
          players: [p1, p2, p3],
          currentPlayerIndex: 0,
          direction: 1,
          currentColor: 'red',
          discardPile: [createMockCard('red', '4')],
        });

        const nextState = playCard(state, 'rev-1', 'p1');

        // Direction inverted to -1
        expect(nextState.direction).toBe(-1);
        // Player 3 (index 2) is the previous player in counter-clockwise order
        expect(nextState.currentPlayerIndex).toBe(2);
      });

      it('acts like a skip in a 2-player game (current player plays again)', () => {
        const redRev = createMockCard('red', 'reverse', 'rev-2p');
        const p1 = createMockPlayer('p1', 'P1', [redRev, createMockCard('red', '9')]);
        const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '1')]);

        const state = createMockGameState({
          players: [p1, p2],
          currentPlayerIndex: 0,
          direction: 1,
          currentColor: 'red',
          discardPile: [createMockCard('red', '4')],
        });

        const nextState = playCard(state, 'rev-2p', 'p1');

        expect(nextState.direction).toBe(-1);
        expect(nextState.currentPlayerIndex).toBe(0);
      });
    });

    describe('Draw Two Card', () => {
      it('forces next player to draw 2 cards and skips their turn in 3+ player game', () => {
        const redD2 = createMockCard('red', 'draw_two', 'd2-1');
        const p1 = createMockPlayer('p1', 'P1', [redD2]);
        const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '1')]);
        const p3 = createMockPlayer('p3', 'P3', [createMockCard('yellow', '2')]);

        const dCard1 = createMockCard('blue', '1', 'drawn-1');
        const dCard2 = createMockCard('blue', '2', 'drawn-2');
        const dCard3 = createMockCard('blue', '3', 'drawn-3');

        const state = createMockGameState({
          players: [p1, p2, p3],
          drawPile: [dCard1, dCard2, dCard3],
          currentPlayerIndex: 0,
          direction: 1,
          currentColor: 'red',
          discardPile: [createMockCard('red', '4')],
        });

        const nextState = playCard(state, 'd2-1', 'p1');

        // P2 drew 2 cards
        expect(nextState.players[1].hand).toHaveLength(3);
        expect(nextState.players[1].hand.some(c => c.id === 'drawn-1')).toBe(true);
        expect(nextState.players[1].hand.some(c => c.id === 'drawn-2')).toBe(true);

        // Turn skipped P2 -> lands on P3 (index 2)
        expect(nextState.currentPlayerIndex).toBe(2);
      });

      it('forces opponent to draw 2 cards and gives current player another turn in 2-player game', () => {
        const redD2 = createMockCard('red', 'draw_two', 'd2-2p');
        const p1 = createMockPlayer('p1', 'P1', [redD2, createMockCard('red', '1')]);
        const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '1')]);

        const state = createMockGameState({
          players: [p1, p2],
          drawPile: [createMockCard('blue', '1'), createMockCard('blue', '2')],
          currentPlayerIndex: 0,
          direction: 1,
          currentColor: 'red',
          discardPile: [createMockCard('red', '4')],
        });

        const nextState = playCard(state, 'd2-2p', 'p1');

        expect(nextState.players[1].hand).toHaveLength(3);
        // Turn returns to P1
        expect(nextState.currentPlayerIndex).toBe(0);
      });
    });

    describe('Wild Card Plays', () => {
      it('transitions to choosing_color when Wild played without chosenColor', () => {
        const wild = createMockCard('wild', 'wild', 'wild-1');
        const p1 = createMockPlayer('p1', 'P1', [wild, createMockCard('blue', '1')]);
        const state = createMockGameState({
          players: [p1, createMockPlayer('p2', 'P2', [createMockCard('green', '2')])],
          currentPlayerIndex: 0,
        });

        const nextState = playCard(state, 'wild-1', 'p1');
        expect(nextState.phase).toBe('choosing_color');
      });

      it('applies chosenColor immediately and advances to next player when provided', () => {
        const wild = createMockCard('wild', 'wild', 'wild-2');
        const p1 = createMockPlayer('p1', 'P1', [wild, createMockCard('blue', '1')]);
        const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '2')]);
        const state = createMockGameState({
          players: [p1, p2],
          currentPlayerIndex: 0,
        });

        const nextState = playCard(state, 'wild-2', 'p1', 'green');
        expect(nextState.currentColor).toBe('green');
        expect(nextState.currentPlayerIndex).toBe(1);
        expect(nextState.phase).toBe('playing');
      });
    });

    describe('Wild Draw Four Plays & Challenge Setup', () => {
      it('sets challengeWindow and pendingDrawCount when played with chosenColor', () => {
        const wd4 = createMockCard('wild', 'wild_draw_four', 'wd4-1');
        const remainingCard = createMockCard('blue', '1');
        const p1 = createMockPlayer('p1', 'P1', [wd4, remainingCard]); // Valid: no red cards
        const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '1')]);

        const state = createMockGameState({
          players: [p1, p2],
          currentPlayerIndex: 0,
          currentColor: 'red',
        });

        const nextState = playCard(state, 'wd4-1', 'p1', 'yellow');

        expect(nextState.currentColor).toBe('yellow');
        expect(nextState.pendingDrawCount).toBe(4);
        expect(nextState.phase).toBe('challenge_window');
        expect(nextState.currentPlayerIndex).toBe(1); // p2 can challenge or accept
        expect(nextState.challengeWindow).toEqual({
          active: true,
          challengedPlayerId: 'p1',
          previousColor: 'red',
          previousHand: [remainingCard],
        });
      });
    });

    describe('Wild Shuffle Hands card (wild_shuffle)', () => {
      it('collects all players remaining cards, shuffles and redistributes them evenly', () => {
        const shuffleCard = createMockCard('wild', 'wild_shuffle', 'ws-1');
        const p1Cards = [createMockCard('red', '1', 'r1'), createMockCard('red', '2', 'r2')];
        const p2Cards = [createMockCard('blue', '3', 'b3'), createMockCard('blue', '4', 'b4')];
        const p1 = createMockPlayer('p1', 'P1', [shuffleCard, ...p1Cards]);
        const p2 = createMockPlayer('p2', 'P2', [...p2Cards]);

        const state = createMockGameState({
          players: [p1, p2],
          currentPlayerIndex: 0,
          currentColor: 'red',
        });

        const nextState = playCard(state, 'ws-1', 'p1', 'green');

        // Total remaining cards was 4 (r1, r2, b3, b4) -> dealt 2 each to p1 and p2
        expect(nextState.players[0].hand).toHaveLength(2);
        expect(nextState.players[1].hand).toHaveLength(2);
        expect(nextState.currentColor).toBe('green');
        expect(nextState.currentPlayerIndex).toBe(1);
        expect(nextState.phase).toBe('playing');
      });
    });

    describe('Winning the Game', () => {
      it('ends game and calculates scores when last card is played', () => {
        const lastCard = createMockCard('red', '7', 'last-card');
        const p1 = createMockPlayer('p1', 'P1', [lastCard]);
        const p2 = createMockPlayer('p2', 'P2', [
          createMockCard('blue', 'skip'), // 20
          createMockCard('yellow', '5'), // 5
        ]);

        const state = createMockGameState({
          players: [p1, p2],
          currentPlayerIndex: 0,
          currentColor: 'red',
        });

        const nextState = playCard(state, 'last-card', 'p1');

        expect(nextState.phase).toBe('finished');
        expect(nextState.winner).toBe('p1');
        expect(nextState.players[0].score).toBe(25);
        expect(nextState.players[1].score).toBe(0);
      });
    });
  });

  describe('drawCard action', () => {
    it('draws a single card and passes turn in normal play', () => {
      const drawnCard = createMockCard('yellow', '8', 'd-8');
      const p1 = createMockPlayer('p1', 'P1', [createMockCard('red', '1')]);
      const p2 = createMockPlayer('p2', 'P2', [createMockCard('blue', '2')]);

      const state = createMockGameState({
        players: [p1, p2],
        drawPile: [drawnCard, createMockCard('green', '3')],
        currentPlayerIndex: 0,
        pendingDrawCount: 0,
      });

      const nextState = drawCard(state, 'p1');

      expect(nextState.players[0].hand).toHaveLength(2);
      expect(nextState.players[0].hand[1].id).toBe('d-8');
      expect(nextState.drawPile).toHaveLength(1);
      expect(nextState.currentPlayerIndex).toBe(1);
    });

    it('draws pendingDrawCount cards when pendingDrawCount > 0 and clears challengeWindow', () => {
      const c1 = createMockCard('red', '1', 'c1');
      const c2 = createMockCard('red', '2', 'c2');
      const c3 = createMockCard('red', '3', 'c3');
      const c4 = createMockCard('red', '4', 'c4');

      const p1 = createMockPlayer('p1', 'P1', []);
      const p2 = createMockPlayer('p2', 'P2', []);

      const state = createMockGameState({
        players: [p1, p2],
        drawPile: [c1, c2, c3, c4, createMockCard('blue', '5')],
        currentPlayerIndex: 1,
        pendingDrawCount: 4,
        challengeWindow: {
          active: true,
          challengedPlayerId: 'p1',
          previousColor: 'red',
          previousHand: [],
        },
      });

      const nextState = drawCard(state, 'p2');

      expect(nextState.players[1].hand).toHaveLength(4);
      expect(nextState.pendingDrawCount).toBe(0);
      expect(nextState.challengeWindow).toBeNull();
      expect(nextState.phase).toBe('playing');
      expect(nextState.currentPlayerIndex).toBe(0);
    });

    it('rejects drawCard when not player turn', () => {
      const state = createMockGameState({ currentPlayerIndex: 0 });
      expect(() => drawCard(state, 'p2')).toThrow('Not your turn');
    });
  });

  describe('declareUno and catchUno', () => {
    it('sets hasCalledUno to true when player has exactly 1 card', () => {
      const p1 = createMockPlayer('p1', 'P1', [createMockCard('red', '1')]);
      const state = createMockGameState({ players: [p1] });

      const nextState = declareUno(state, 'p1');

      expect(nextState.players[0].hasCalledUno).toBe(true);
      expect(nextState.unoDeclarations['p1']).toBeGreaterThan(0);
    });

    it('rejects declareUno if player has more than 1 card', () => {
      const p1 = createMockPlayer('p1', 'P1', [
        createMockCard('red', '1'),
        createMockCard('blue', '2'),
      ]);
      const state = createMockGameState({ players: [p1] });

      expect(() => declareUno(state, 'p1')).toThrow('Can only declare UNO with exactly 1 card');
    });

    it('penalizes player with 2 cards when caught not declaring UNO', () => {
      const p1 = createMockPlayer('p1', 'P1', [createMockCard('red', '1')], { hasCalledUno: false });
      const p2 = createMockPlayer('p2', 'P2', [createMockCard('green', '2')]);

      const pen1 = createMockCard('blue', '3', 'pen-1');
      const pen2 = createMockCard('blue', '4', 'pen-2');

      const state = createMockGameState({
        players: [p1, p2],
        drawPile: [pen1, pen2, createMockCard('yellow', '5')],
        unoDeclarations: {}, // Not declared
      });

      const nextState = catchUno(state, 'p2', 'p1');

      expect(nextState.players[0].hand).toHaveLength(3);
      expect(nextState.players[0].hand.some(c => c.id === 'pen-1')).toBe(true);
      expect(nextState.players[0].hand.some(c => c.id === 'pen-2')).toBe(true);
    });

    it('rejects catchUno if player already declared UNO', () => {
      const p1 = createMockPlayer('p1', 'P1', [createMockCard('red', '1')], { hasCalledUno: true });
      const state = createMockGameState({ players: [p1] });

      expect(() => catchUno(state, 'p2', 'p1')).toThrow('Player already declared UNO');
    });

    it('rejects catchUno if target player has more than 1 card', () => {
      const p1 = createMockPlayer('p1', 'P1', [
        createMockCard('red', '1'),
        createMockCard('blue', '2'),
      ]);
      const state = createMockGameState({ players: [p1] });

      expect(() => catchUno(state, 'p2', 'p1')).toThrow('Target does not have 1 card');
    });
  });

  describe('challengeWildDrawFour', () => {
    it('SUCCESS: challenged player had matching color card -> challenged player draws 4, challenger turn continues', () => {
      const p1 = createMockPlayer('p1', 'P1', []); // Challenged
      const p2 = createMockPlayer('p2', 'P2', []); // Challenger

      const d1 = createMockCard('yellow', '1', 'd1');
      const d2 = createMockCard('yellow', '2', 'd2');
      const d3 = createMockCard('yellow', '3', 'd3');
      const d4 = createMockCard('yellow', '4', 'd4');

      const state = createMockGameState({
        players: [p1, p2],
        drawPile: [d1, d2, d3, d4, createMockCard('green', '5')],
        currentPlayerIndex: 1, // Challenger turn
        challengeWindow: {
          active: true,
          challengedPlayerId: 'p1',
          previousColor: 'red',
          // p1 DID have a red card when playing WD4 (illegal play!)
          previousHand: [createMockCard('red', '3'), createMockCard('wild', 'wild_draw_four')],
        },
      });

      const nextState = challengeWildDrawFour(state, 'p2');

      // P1 draws 4 cards as penalty
      expect(nextState.players[0].hand).toHaveLength(4);
      // P2 hand unchanged
      expect(nextState.players[1].hand).toHaveLength(0);
      // P2 retains turn
      expect(nextState.currentPlayerIndex).toBe(1);
      expect(nextState.challengeWindow).toBeNull();
      expect(nextState.pendingDrawCount).toBe(0);
    });

    it('FAILURE: challenged player played legally -> challenger draws 6 cards (4 + 2 penalty) and loses turn', () => {
      const p1 = createMockPlayer('p1', 'P1', []); // Challenged
      const p2 = createMockPlayer('p2', 'P2', []); // Challenger

      const drawCards = Array.from({ length: 6 }, (_, i) =>
        createMockCard('blue', `${i}` as any, `draw-${i}`)
      );

      const state = createMockGameState({
        players: [p1, p2],
        drawPile: [...drawCards, createMockCard('green', '9')],
        currentPlayerIndex: 1, // Challenger turn
        direction: 1,
        challengeWindow: {
          active: true,
          challengedPlayerId: 'p1',
          previousColor: 'red',
          // P1 had NO red cards when playing WD4 (legal play!)
          previousHand: [createMockCard('blue', '3'), createMockCard('wild', 'wild_draw_four')],
        },
      });

      const nextState = challengeWildDrawFour(state, 'p2');

      // Challenger (p2) draws 6 cards
      expect(nextState.players[1].hand).toHaveLength(6);
      // Challenger loses turn -> advances to next player (p1, index 0)
      expect(nextState.currentPlayerIndex).toBe(0);
      expect(nextState.challengeWindow).toBeNull();
      expect(nextState.pendingDrawCount).toBe(0);
    });

    it('rejects challenge if no active challenge window', () => {
      const state = createMockGameState({
        challengeWindow: null,
        currentPlayerIndex: 0,
      });

      expect(() => challengeWildDrawFour(state, 'p1')).toThrow('No active challenge window');
    });

    it('rejects challenge if not challengers turn', () => {
      const state = createMockGameState({
        challengeWindow: {
          active: true,
          challengedPlayerId: 'p1',
          previousColor: 'red',
          previousHand: [],
        },
        currentPlayerIndex: 1,
      });

      expect(() => challengeWildDrawFour(state, 'p1')).toThrow('Not your turn to challenge');
    });
  });

  describe('chooseColor action', () => {
    it('sets currentColor, advances player, and returns to playing phase for Wild card', () => {
      const topWild = createMockCard('wild', 'wild');
      const p1 = createMockPlayer('p1', 'P1');
      const p2 = createMockPlayer('p2', 'P2');

      const state = createMockGameState({
        players: [p1, p2],
        discardPile: [topWild],
        currentPlayerIndex: 0,
        phase: 'choosing_color',
      });

      const nextState = chooseColor(state, 'p1', 'blue');

      expect(nextState.currentColor).toBe('blue');
      expect(nextState.phase).toBe('playing');
      expect(nextState.currentPlayerIndex).toBe(1);
    });

    it('sets challenge_window phase and pendingDrawCount 4 for Wild Draw Four card', () => {
      const topWd4 = createMockCard('wild', 'wild_draw_four');
      const p1 = createMockPlayer('p1', 'P1');
      const p2 = createMockPlayer('p2', 'P2');

      const state = createMockGameState({
        players: [p1, p2],
        discardPile: [topWd4],
        currentPlayerIndex: 0,
        phase: 'choosing_color',
        challengeWindow: {
          active: false,
          challengedPlayerId: 'p1',
          previousColor: 'green',
          previousHand: [],
        },
      });

      const nextState = chooseColor(state, 'p1', 'yellow');

      expect(nextState.currentColor).toBe('yellow');
      expect(nextState.currentPlayerIndex).toBe(1);
      expect(nextState.phase).toBe('challenge_window');
      expect(nextState.pendingDrawCount).toBe(4);
      expect(nextState.challengeWindow?.active).toBe(true);
    });

    it('rejects wild as chosen color', () => {
      const state = createMockGameState({
        phase: 'choosing_color',
        currentPlayerIndex: 0,
      });

      expect(() => chooseColor(state, 'p1', 'wild')).toThrow('Cannot choose wild as color');
    });

    it('rejects chooseColor when not in choosing_color phase', () => {
      const state = createMockGameState({
        phase: 'playing',
        currentPlayerIndex: 0,
      });

      expect(() => chooseColor(state, 'p1', 'green')).toThrow('Not in color choosing phase');
    });
  });
});
