import { GameState } from '../engine/gameState';
import { CardColor } from '../engine/card';
import { getNextPlayerIndex } from '../engine/rules';

export function chooseColor(state: GameState, playerId: string, color: CardColor): GameState {
  if (state.phase !== 'choosing_color') {
    throw new Error('Not in color choosing phase');
  }
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    throw new Error('Not your turn');
  }
  
  if (color === 'wild') throw new Error('Cannot choose wild as color');
  
  const lastCard = state.discardPile[state.discardPile.length - 1];
  
  if (lastCard?.value === 'wild_draw_four') {
    // After WD4 color choice, next player enters challenge window
    const nextIdx = getNextPlayerIndex(state);
    const challengeWindow = state.challengeWindow
      ? { ...state.challengeWindow, active: true }
      : null;
    return {
      ...state,
      currentColor: color,
      currentPlayerIndex: nextIdx,
      challengeWindow,
      pendingDrawCount: 4,
      phase: challengeWindow ? 'challenge_window' : 'playing',
      turnStartedAt: Date.now(),
    };
  }
  
  // Wild card
  const nextIdx = getNextPlayerIndex(state);
  return {
    ...state,
    currentColor: color,
    currentPlayerIndex: nextIdx,
    phase: 'playing',
    turnStartedAt: Date.now(),
  };
}
