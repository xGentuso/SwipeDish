import { create } from 'zustand';
import { FoodCard } from '../types';
import { logger } from '../services/loggingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  // Favorites state
  favorites: FoodCard[];
  isLoadingFavorites: boolean;

  // Actions
  addToFavorites: (restaurant: FoodCard) => void;
  removeFromFavorites: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  loadFavorites: () => Promise<void>;
  clearFavorites: () => void;
}

const FAVORITES_STORAGE_KEY = '@SwipeDish:favorites';

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  // Initial state
  favorites: [],
  isLoadingFavorites: false,

  // Actions
  addToFavorites: (restaurant: FoodCard) => {
    const state = get();
    if (!state.favorites.find(fav => fav.id === restaurant.id)) {
      const newFavorites = [...state.favorites, restaurant];
      set({ favorites: newFavorites });
      
      // Persist to storage
      AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites)).catch(error => {
        logger.error('Failed to save favorites to storage', 'FAVORITES', { error: error.message });
      });
    }
  },

  removeFromFavorites: (restaurantId: string) => {
    const state = get();
    const newFavorites = state.favorites.filter(fav => fav.id !== restaurantId);
    set({ favorites: newFavorites });
    
    // Persist to storage
    AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites)).catch(error => {
      logger.error('Failed to save favorites to storage', 'FAVORITES', { error: error.message });
    });
  },

  isFavorite: (restaurantId: string) => {
    const state = get();
    return state.favorites.some(fav => fav.id === restaurantId);
  },

  loadFavorites: async () => {
    try {
      set({ isLoadingFavorites: true });
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      
      if (favoritesJson) {
        const favorites = JSON.parse(favoritesJson) as FoodCard[];
        set({ favorites, isLoadingFavorites: false });
      } else {
        set({ favorites: [], isLoadingFavorites: false });
      }
    } catch (error) {
      logger.error('Failed to load favorites from storage', 'FAVORITES', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      set({ favorites: [], isLoadingFavorites: false });
    }
  },

  clearFavorites: () => {
    set({ favorites: [] });
    AsyncStorage.removeItem(FAVORITES_STORAGE_KEY).catch(error => {
      logger.error('Failed to clear favorites from storage', 'FAVORITES', { error: error.message });
    });
  },
}));