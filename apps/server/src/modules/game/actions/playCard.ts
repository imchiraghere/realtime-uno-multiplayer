import { GameState } from '../engine/gameState';
import { CardColor } from '../engine/card';
import { isValidPlay, getNextPlayerIndex, reshuffleIfNeeded, isGameOver, getWinner, calculateScores } from '../engine/rules';
import { UnoCard } from '../engine/card';
import { shuffleDeck } from '../engine/deck';

export function playCard(
  state: GameState,
  cardId: string,
  playerId: string,
  chosenColor?: CardColor
): GameState {
  if (state.phase !== 'playing' && state.phase !== 'challenge_window') {
    throw new Error('Not in playing phase');
  }
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    throw new Error('Not your turn');
  }
  
  const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) throw new Error('Card not in hand');
  
  const card = currentPlayer.hand[cardIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];
  
  if (!isValidPlay(card, topCard, state.currentColor, currentPlayer.hand, state.gameMode, state.houseRules)) {
    throw new Error('Invalid card play');
  }
  
  // Remove card from hand
  const newHand = [...currentPlayer.hand];
  newHand.splice(cardIndex, 1);
  
  const updatedPlayers = state.players.map(p =>
    p.id === playerId ? { ...p, hand: newHand, hasCalledUno: false } : p
  );
  
  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    discardPile: [...state.discardPile, card],
    lastPlayedCard: card,
    challengeWindow: null,
    turnNumber: state.turnNumber + 1,
  };
  
  // Apply card effects
  newState = applyCardEffect(newState, card, playerId, chosenColor);
  
  // Check game over
  if (isGameOver(newState)) {
    const winner = getWinner(newState);
    const scores = calculateScores(newState.players);
    newState = {
      ...newState,
      phase: 'finished',
      winner: winner?.id ?? null,
      players: newState.players.map(p => ({ ...p, score: scores[p.id] ?? 0 })),
    };
  }
  
  return newState;
}

function applyCardEffect(
  state: GameState,
  card: UnoCard,
  playerId: string,
  chosenColor?: CardColor
): GameState {
  const playerCount = state.players.length;
  const isTwoPlayer = playerCount === 2;
  
  switch (card.value) {
    case 'skip': {
      if (isTwoPlayer) {
        // Acts like extra turn for current player
        return {
          ...state,
          currentColor: card.color,
          phase: 'playing',
          turnStartedAt: Date.now(),
        };
      }
      const afterSkipIdx = getNextPlayerIndex(getNextPlayerIndex_helper(state));
      return {
        ...state,
        currentPlayerIndex: afterSkipIdx,
        currentColor: card.color,
        phase: 'playing',
        turnStartedAt: Date.now(),
      };
    }
    
    case 'reverse': {
      const newDirection = (state.direction * -1) as 1 | -1;
      if (isTwoPlayer) {
        // Acts like skip in 2-player
        return {
          ...state,
          direction: newDirection,
          currentColor: card.color,
          phase: 'playing',
          turnStartedAt: Date.now(),
        };
      }
      const nextIdx = getNextPlayerIndex({ ...state, direction: newDirection });
      return {
        ...state,
        direction: newDirection,
        currentPlayerIndex: nextIdx,
        currentColor: card.color,
        phase: 'playing',
        turnStartedAt: Date.now(),
      };
    }
    
    case 'draw_two': {
      const nextIdx = getNextPlayerIndex(state);
      const nextPlayer = state.players[nextIdx];
      // Draw 2 cards for next player (reshuffle if needed)
      const tempState = reshuffleIfNeeded(state);
      const drawnCards = tempState.drawPile.slice(0, 2);
      const newDraw = tempState.drawPile.slice(2);
      const updatedPlayers = tempState.players.map(p =>
        p.id === nextPlayer.id ? { ...p, hand: [...p.hand, ...drawnCards] } : p
      );
      const skipIdx = getNextPlayerIndex({ ...tempState, currentPlayerIndex: nextIdx });
      return {
        ...tempState,
        players: updatedPlayers,
        drawPile: newDraw,
        currentPlayerIndex: skipIdx,
        currentColor: card.color,
        phase: 'playing',
        pendingDrawCount: 0,
        turnStartedAt: Date.now(),
      };
    }
    
    case 'wild': {
      if (chosenColor && chosenColor !== 'wild') {
        const nextIdx = getNextPlayerIndex(state);
        return {
          ...state,
          currentColor: chosenColor,
          currentPlayerIndex: nextIdx,
          phase: 'playing',
          turnStartedAt: Date.now(),
        };
      }
      return { ...state, phase: 'choosing_color' };
    }
    
    case 'wild_draw_four': {
      // Store challenge window info
      const currentPlayerState = state.players[state.currentPlayerIndex];
      const challengeWindow = {
        active: true,
        challengedPlayerId: playerId,
        previousColor: state.currentColor,
        previousHand: [...(currentPlayerState?.hand ?? [])],
      };
      
      if (chosenColor && chosenColor !== 'wild') {
        const nextIdx = getNextPlayerIndex(state);
        return {
          ...state,
          currentColor: chosenColor,
          currentPlayerIndex: nextIdx,
          pendingDrawCount: 4,
          challengeWindow,
          phase: 'challenge_window',
          turnStartedAt: Date.now(),
        };
      }
      return { ...state, challengeWindow, phase: 'choosing_color' };
    }

    case 'wild_shuffle': {
      // Wild Shuffle Hands rule:
      // 1. Collect all remaining cards from every player's hand
      const allCards: UnoCard[] = [];
      state.players.forEach(p => {
        allCards.push(...p.hand);
      });

      // 2. Shuffle all collected cards thoroughly
      const shuffled = shuffleDeck(allCards);

      // 3. Deal cards back out starting with the next player in current turn direction
      const count = state.players.length;
      const newHands: UnoCard[][] = state.players.map(() => []);

      let dealSeat = ((state.currentPlayerIndex + state.direction) % count + count) % count;
      shuffled.forEach(c => {
        newHands[dealSeat].push(c);
        dealSeat = ((dealSeat + state.direction) % count + count) % count;
      });

      // 4. Update all players with their redistributed hands and reset hasCalledUno
      const updatedPlayers = state.players.map((p, idx) => ({
        ...p,
        hand: newHands[idx],
        hasCalledUno: false,
      }));

      // 5. If color was chosen, advance to next player; otherwise prompt for color
      if (chosenColor && chosenColor !== 'wild') {
        const nextIdx = getNextPlayerIndex(state);
        return {
          ...state,
          players: updatedPlayers,
          currentColor: chosenColor,
          currentPlayerIndex: nextIdx,
          phase: 'playing',
          turnStartedAt: Date.now(),
        };
      }

      return {
        ...state,
        players: updatedPlayers,
        phase: 'choosing_color',
      };
    }
    
    default: {
      // Number card
      const nextIdx = getNextPlayerIndex(state);
      return {
        ...state,
        currentPlayerIndex: nextIdx,
        currentColor: card.color as CardColor,
        phase: 'playing',
        turnStartedAt: Date.now(),
      };
    }
  }
}

// Helper to get the state with the next player as current (for skip's double-next)
function getNextPlayerIndex_helper(state: GameState): GameState {
  return { ...state, currentPlayerIndex: getNextPlayerIndex(state) };
}
