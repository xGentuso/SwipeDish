import { create } from 'zustand';
import { FoodCard } from '../types';

interface CardsState {
  // Card state
  currentCards: FoodCard[];
  currentCardIndex: number;
  
  // Location state
  userLocation: { latitude: number; longitude: number } | null;

  // Actions
  setCurrentCards: (cards: FoodCard[]) => void;
  setCurrentCardIndex: (index: number) => void;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
  nextCard: () => void;
  resetCards: () => void;
}

export const useCardsStore = create<CardsState>((set, get) => ({
  // Initial state
  currentCards: [],
  currentCardIndex: 0,
  userLocation: null,

  // Actions
  setCurrentCards: (currentCards) => set({ currentCards }),
  setCurrentCardIndex: (currentCardIndex) => set({ currentCardIndex }),
  setUserLocation: (userLocation) => set({ userLocation }),

  nextCard: () => {
    const state = get();
    if (state.currentCardIndex < state.currentCards.length - 1) {
      set({ currentCardIndex: state.currentCardIndex + 1 });
    }
  },

  resetCards: () => {
    set({ currentCards: [], currentCardIndex: 0 });
  },
}));