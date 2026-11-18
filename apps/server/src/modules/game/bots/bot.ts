import { GameState } from '../engine/gameState';
import { CardColor } from '../engine/card';
import { easyStrategy, easyChooseColor } from './strategies/easy';
import { mediumStrategy, mediumChooseColor } from './strategies/medium';
import { hardStrategy, hardChooseColor } from './strategies/hard';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export function getBotAction(
  state: GameState,
  botPlayerId: string
): { action: 'play' | 'draw'; cardId?: string; chosenColor?: CardColor } {
  const bot = state.players.find(p => p.id === botPlayerId);
  if (!bot) throw new Error('Bot not found');
  
  const topCard = state.discardPile[state.discardPile.length - 1];
  const opponentCardCounts = state.players
    .filter(p => p.id !== botPlayerId)
    .map(p => p.hand.length);
  
  const difficulty: BotDifficulty = (bot.botDifficulty as BotDifficulty) || 'easy';
  
  let selectedCard = null;
  
  switch (difficulty) {
    case 'easy':
      selectedCard = easyStrategy(bot.hand, topCard, state.currentColor, state.gameMode, state.houseRules);
      break;
    case 'medium':
      selectedCard = mediumStrategy(bot.hand, topCard, state.currentColor, state.gameMode, state.houseRules, opponentCardCounts);
      break;
    case 'hard':
      selectedCard = hardStrategy(bot.hand, topCard, state.currentColor, state.gameMode, state.houseRules, opponentCardCounts);
      break;
  }
  
  if (!selectedCard) return { action: 'draw' };
  
  let chosenColor: CardColor | undefined;
  if (selectedCard.value === 'wild' || selectedCard.value === 'wild_draw_four' || selectedCard.value === 'wild_shuffle') {
    const handWithoutCard = bot.hand.filter(c => c.id !== selectedCard!.id);
    switch (difficulty) {
      case 'easy': chosenColor = easyChooseColor(handWithoutCard); break;
      case 'medium': chosenColor = mediumChooseColor(handWithoutCard); break;
      case 'hard': chosenColor = hardChooseColor(handWithoutCard); break;
    }
  }
  
  return { action: 'play', cardId: selectedCard.id, chosenColor };
}
