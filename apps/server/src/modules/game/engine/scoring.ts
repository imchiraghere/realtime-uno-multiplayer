import { PlayerState } from './gameState';
import { getCardPoints } from './card';

export interface GameResult {
  winnerId: string;
  scores: Record<string, number>;
  rankings: { playerId: string; position: number; score: number }[];
}

export function computeGameResult(players: PlayerState[]): GameResult {
  const winner = players.find(p => p.hand.length === 0);
  if (!winner) throw new Error('No winner found');
  
  let winnerScore = 0;
  for (const player of players) {
    if (player.id !== winner.id) {
      winnerScore += player.hand.reduce((sum, card) => sum + getCardPoints(card), 0);
    }
  }
  
  const scores: Record<string, number> = {};
  scores[winner.id] = winnerScore;
  for (const player of players) {
    if (player.id !== winner.id) scores[player.id] = 0;
  }
  
  const rankings = players.map(p => ({
    playerId: p.id,
    position: p.id === winner.id ? 1 : 2,
    score: scores[p.id] ?? 0,
  }));
  
  return { winnerId: winner.id, scores, rankings };
}
