import { create } from 'zustand';
import { PublicGameState, UnoCard, CardColor } from '../types/game';

interface GameStore {
  gameState: PublicGameState | null;
  myHand: UnoCard[];
  selectedCard: UnoCard | null;
  showColorPicker: boolean;
  showChallengeWindow: boolean;
  lastEvent: string | null;
  isMyTurn: boolean;
  isSubmittingPlay: boolean;
  
  setGameState: (state: PublicGameState) => void;
  setMyHand: (hand: UnoCard[]) => void;
  selectCard: (card: UnoCard | null) => void;
  setShowColorPicker: (show: boolean) => void;
  setShowChallengeWindow: (show: boolean) => void;
  setLastEvent: (event: string | null) => void;
  setIsSubmittingPlay: (submitting: boolean) => void;
  optimisticPlayCard: (cardId: string, chosenColor?: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  myHand: [],
  selectedCard: null,
  showColorPicker: false,
  showChallengeWindow: false,
  lastEvent: null,
  isMyTurn: false,
  isSubmittingPlay: false,
  
  setGameState: (state) => {
    set((prev) => ({
      gameState: state,
      myHand: state.myHand !== undefined ? state.myHand : prev.myHand,
      showColorPicker: state.phase === 'choosing_color',
      showChallengeWindow: state.phase === 'challenge_window',
      isSubmittingPlay: false,
    }));
  },
  
  setMyHand: (hand) => set({ myHand: hand }),
  selectCard: (card) => set({ selectedCard: card }),
  setShowColorPicker: (show) => set({ showColorPicker: show }),
  setShowChallengeWindow: (show) => set({ showChallengeWindow: show }),
  setLastEvent: (event) => set({ lastEvent: event, isSubmittingPlay: false }),
  setIsSubmittingPlay: (submitting) => set({ isSubmittingPlay: submitting }),

  optimisticPlayCard: (cardId: string, chosenColor?: string) => {
    set((prev) => {
      if (!prev.gameState) return prev;
      const card = prev.myHand.find(c => c.id === cardId);
      if (!card) return prev;
      const newHand = prev.myHand.filter(c => c.id !== cardId);
      const newDiscardPile = [...prev.gameState.discardPile, card];
      const newColor = (chosenColor as CardColor) || (card.color !== 'wild' ? card.color : prev.gameState.currentColor);

      return {
        ...prev,
        isSubmittingPlay: true,
        myHand: newHand,
        gameState: {
          ...prev.gameState,
          discardPile: newDiscardPile,
          lastPlayedCard: card,
          currentColor: newColor,
          myHand: newHand,
        },
      };
    });
  },

  reset: () => set({ gameState: null, myHand: [], selectedCard: null, showColorPicker: false, lastEvent: null, isSubmittingPlay: false }),
}));
