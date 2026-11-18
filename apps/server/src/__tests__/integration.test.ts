import { describe, it, expect } from 'vitest';
import { playCard } from '../modules/game/actions/playCard';
import { drawCard } from '../modules/game/actions/drawCard';
import { declareUno } from '../modules/game/actions/declareUno';
import { getPublicGameState } from '../modules/game/engine/gameState';
import { createMockCard, createMockPlayer, createMockGameState } from './testHelpers';

describe('Game Integration & State Obfuscation', () => {
  it('hides opponent hands and previous hand in public game state', () => {
    const p1Card = createMockCard('red', '1', 'p1-c1');
    const p2Card = createMockCard('blue', '2', 'p2-c1');

    const state = createMockGameState({
      players: [
        createMockPlayer('p1', 'Alice', [p1Card]),
        createMockPlayer('p2', 'Bob', [p2Card]),
      ],
      challengeWindow: {
        active: true,
        challengedPlayerId: 'p2',
        previousColor: 'yellow',
        previousHand: [createMockCard('yellow', '9')],
      },
    });

    const publicAlice = getPublicGameState(state, 'p1');

    // Alice sees her own hand
    const alicePlayer = publicAlice.players.find(p => p.id === 'p1');
    expect(alicePlayer?.hand).toEqual([p1Card]);

    // Alice does NOT see Bob's hand
    const bobPlayer = publicAlice.players.find(p => p.id === 'p2');
    expect(bobPlayer?.hand).toBeUndefined();
    expect(bobPlayer?.cardCount).toBe(1);

    // Alice does NOT see previousHand inside challengeWindow
    expect((publicAlice.challengeWindow as any)?.previousHand).toBeUndefined();
    expect(publicAlice.challengeWindow?.active).toBe(true);
    expect(publicAlice.challengeWindow?.previousColor).toBe('yellow');
  });

  it('simulates a short complete match from start to finish', () => {
    const c1 = createMockCard('red', '5', 'c1');
    const c2 = createMockCard('red', '7', 'c2');
    const c3 = createMockCard('red', '7', 'c3'); // P2 plays matching number 7
    const c4 = createMockCard('blue', '7', 'c4');

    const p1 = createMockPlayer('p1', 'Alice', [c1, c2]);
    const p2 = createMockPlayer('p2', 'Bob', [c3]);
    const p3 = createMockPlayer('p3', 'Charlie', [c4]);

    let state = createMockGameState({
      players: [p1, p2, p3],
      currentColor: 'red',
      discardPile: [createMockCard('red', '1')],
      currentPlayerIndex: 0,
    });

    // P1 plays red 5
    state = playCard(state, 'c1', 'p1');
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.currentColor).toBe('red');

    // P2 has 1 card left and declares UNO
    state = declareUno(state, 'p2');
    expect(state.players[1].hasCalledUno).toBe(true);

    // P2 plays red 7, winning the game!
    state = playCard(state, 'c3', 'p2');

    expect(state.phase).toBe('finished');
    expect(state.winner).toBe('p2');
    // Scores: P1 has c2 (red 7 -> 7 pts), P3 has c4 (blue 7 -> 7 pts) = 14 pts
    expect(state.players[1].score).toBe(14);
  });
});
