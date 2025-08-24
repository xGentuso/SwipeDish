import { create } from 'zustand';
import { PreferencesService } from '../services/preferencesService';
import { logger } from '../services/loggingService';

interface PreferencesState {
  // User Preferences state
  userPreferences: {
    dietaryRestrictions: string[];
    cuisinePreferences: string[];
    priceRange: string[];
    maxDistance: number;
    minRating: number;
  };
  isLoadingPreferences: boolean;

  // Actions
  updateUserPreferences: (preferences: Partial<PreferencesState['userPreferences']>) => void;
  loadUserPreferences: (userId: string) => Promise<void>;
  saveUserPreferences: (userId: string) => Promise<void>;
  resetUserPreferences: () => void;
}

const DEFAULT_PREFERENCES = {
  dietaryRestrictions: [],
  cuisinePreferences: [],
  priceRange: ['$', '$$', '$$$'],
  maxDistance: 5,
  minRating: 3.5,
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  // Initial state
  userPreferences: DEFAULT_PREFERENCES,
  isLoadingPreferences: false,

  // Actions
  updateUserPreferences: (preferences) => {
    set(state => ({
      userPreferences: {
        ...state.userPreferences,
        ...preferences,
      },
    }));
  },

  loadUserPreferences: async (userId: string) => {
    try {
      set({ isLoadingPreferences: true });
      logger.info('Loading user preferences', 'PREFERENCES', { userId });

      const preferences = await PreferencesService.getUserPreferences(userId);
      set({
        userPreferences: { ...DEFAULT_PREFERENCES, ...preferences },
        isLoadingPreferences: false,
      });

      logger.info('User preferences loaded successfully', 'PREFERENCES', { userId });
    } catch (error) {
      logger.error('Failed to load user preferences', 'PREFERENCES', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      set({ isLoadingPreferences: false });
      throw error;
    }
  },

  saveUserPreferences: async (userId: string) => {
    try {
      const { userPreferences } = get();
      logger.info('Saving user preferences', 'PREFERENCES', { userId });

      await PreferencesService.saveUserPreferences(userId, userPreferences);
      logger.info('User preferences saved successfully', 'PREFERENCES', { userId });
    } catch (error) {
      logger.error('Failed to save user preferences', 'PREFERENCES', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  resetUserPreferences: () => {
    set({ userPreferences: DEFAULT_PREFERENCES });
    logger.info('User preferences reset to defaults', 'PREFERENCES');
  },
}));