import { GameState } from '../engine/gameState';
import { getNextPlayerIndex, reshuffleIfNeeded } from '../engine/rules';

export function challengeWildDrawFour(state: GameState, challengerId: string): GameState {
  if (!state.challengeWindow?.active) {
    throw new Error('No active challenge window');
  }
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== challengerId) {
    throw new Error('Not your turn to challenge');
  }
  
  const { challengedPlayerId, previousColor, previousHand } = state.challengeWindow;
  
  // Check if challenged player had a card matching previous color
  const hadMatchingCard = previousHand.some(c => c.color === previousColor);
  
  let newState = reshuffleIfNeeded(state);
  
  if (hadMatchingCard) {
    // Challenge SUCCESS: challenged player draws 4
    const drawn = newState.drawPile.slice(0, 4);
    const remaining = newState.drawPile.slice(4);
    const updatedPlayers = newState.players.map(p =>
      p.id === challengedPlayerId ? { ...p, hand: [...p.hand, ...drawn] } : p
    );
    return {
      ...newState,
      players: updatedPlayers,
      drawPile: remaining,
      challengeWindow: null,
      pendingDrawCount: 0,
      phase: 'playing',
      turnStartedAt: Date.now(),
      // Turn stays with challenger (they don't draw)
    };
  } else {
    // Challenge FAILED: challenger draws 6 (4 + 2 penalty)
    const drawn = newState.drawPile.slice(0, 6);
    const remaining = newState.drawPile.slice(6);
    const updatedPlayers = newState.players.map(p =>
      p.id === challengerId ? { ...p, hand: [...p.hand, ...drawn] } : p
    );
    const nextIdx = getNextPlayerIndex(newState);
    return {
      ...newState,
      players: updatedPlayers,
      drawPile: remaining,
      challengeWindow: null,
      pendingDrawCount: 0,
      currentPlayerIndex: nextIdx,
      phase: 'playing',
      turnStartedAt: Date.now(),
    };
  }
}
