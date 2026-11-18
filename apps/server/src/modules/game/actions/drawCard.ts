import { GameState } from '../engine/gameState';
import { reshuffleIfNeeded, getNextPlayerIndex, isGameOver, getWinner, calculateScores } from '../engine/rules';

export function drawCard(state: GameState, playerId: string): GameState {
  if (state.phase !== 'playing' && state.phase !== 'challenge_window') {
    throw new Error('Not in playing phase');
  }
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    throw new Error('Not your turn');
  }
  
  let newState = reshuffleIfNeeded(state);
  
  if (state.pendingDrawCount > 0) {
    // Forced draw (from draw_two or wild_draw_four)
    const count = state.pendingDrawCount;
    const drawn = newState.drawPile.slice(0, count);
    const remaining = newState.drawPile.slice(count);
    const updatedPlayers = newState.players.map(p =>
      p.id === playerId ? { ...p, hand: [...p.hand, ...drawn] } : p
    );
    const nextIdx = getNextPlayerIndex(newState);
    return {
      ...newState,
      players: updatedPlayers,
      drawPile: remaining,
      currentPlayerIndex: nextIdx,
      pendingDrawCount: 0,
      challengeWindow: null,
      phase: 'playing',
      turnStartedAt: Date.now(),
    };
  }
  
  // Normal draw: draw 1 card
  if (newState.drawPile.length === 0) {
    throw new Error('Draw pile is empty');
  }
  
  const [drawnCard, ...rest] = newState.drawPile;
  const updatedPlayers = newState.players.map(p =>
    p.id === playerId ? { ...p, hand: [...p.hand, drawnCard] } : p
  );
  
  newState = {
    ...newState,
    players: updatedPlayers,
    drawPile: rest,
    lastPlayedCard: null,
    phase: 'playing',
    turnStartedAt: Date.now(),
  };
  
  // Check if game over (extremely rare but possible)
  if (isGameOver(newState)) {
    const winner = getWinner(newState);
    const scores = calculateScores(newState.players);
    return {
      ...newState,
      phase: 'finished',
      winner: winner?.id ?? null,
      players: newState.players.map(p => ({ ...p, score: scores[p.id] ?? 0 })),
    };
  }
  
  // After drawing, end turn (player must draw and pass)
  const nextIdx = getNextPlayerIndex(newState);
  return {
    ...newState,
    currentPlayerIndex: nextIdx,
    phase: 'playing',
    turnStartedAt: Date.now(),
  };
}
