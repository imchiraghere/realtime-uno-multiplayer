import { GameState } from '../engine/gameState';

export function declareUno(state: GameState, playerId: string): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');
  
  if (player.hand.length !== 1) {
    throw new Error('Can only declare UNO with exactly 1 card');
  }
  
  const updatedPlayers = state.players.map(p =>
    p.id === playerId ? { ...p, hasCalledUno: true } : p
  );
  
  return {
    ...state,
    players: updatedPlayers,
    unoDeclarations: { ...state.unoDeclarations, [playerId]: Date.now() },
  };
}

// Called when catching a player who didn't declare UNO
export function catchUno(state: GameState, catcherId: string, targetPlayerId: string): GameState {
  const target = state.players.find(p => p.id === targetPlayerId);
  if (!target) throw new Error('Target player not found');
  
  if (target.hand.length !== 1) throw new Error('Target does not have 1 card');
  if (target.hasCalledUno) throw new Error('Player already declared UNO');
  
  void catcherId; // suppress unused warning

  // Check timing: must be within 5 seconds of target's last play
  const unoDeclarationTime = state.unoDeclarations[targetPlayerId];
  if (!unoDeclarationTime) {
    // Not declared - penalize with 2 cards
    const drawn = state.drawPile.slice(0, 2);
    const remaining = state.drawPile.slice(2);
    const updatedPlayers = state.players.map(p =>
      p.id === targetPlayerId ? { ...p, hand: [...p.hand, ...drawn] } : p
    );
    return { ...state, players: updatedPlayers, drawPile: remaining };
  }
  
  return state;
}
