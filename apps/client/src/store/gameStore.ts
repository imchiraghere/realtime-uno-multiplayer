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
  
  setGameState: (state: PublicGameState) => void;
  setMyHand: (hand: UnoCard[]) => void;
  selectCard: (card: UnoCard | null) => void;
  setShowColorPicker: (show: boolean) => void;
  setShowChallengeWindow: (show: boolean) => void;
  setLastEvent: (event: string | null) => void;
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
  
  setGameState: (state) => {
    set((prev) => ({
      gameState: state,
      myHand: state.myHand !== undefined ? state.myHand : prev.myHand,
      showColorPicker: state.phase === 'choosing_color',
      showChallengeWindow: state.phase === 'challenge_window',
    }));
  },
  
  setMyHand: (hand) => set({ myHand: hand }),
  selectCard: (card) => set({ selectedCard: card }),
  setShowColorPicker: (show) => set({ showColorPicker: show }),
  setShowChallengeWindow: (show) => set({ showChallengeWindow: show }),
  setLastEvent: (event) => set({ lastEvent: event }),
  reset: () => set({ gameState: null, myHand: [], selectedCard: null, showColorPicker: false, lastEvent: null }),
}));
