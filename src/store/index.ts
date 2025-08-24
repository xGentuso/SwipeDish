// Export individual stores
export { useAuthStore } from './useAuthStore';
export { useRoomStore } from './useRoomStore';
export { useCardsStore } from './useCardsStore';
export { useFavoritesStore } from './useFavoritesStore';
export { usePreferencesStore } from './usePreferencesStore';

// Import individual stores internally
import { useAuthStore } from './useAuthStore';
import { useRoomStore } from './useRoomStore';
import { useCardsStore } from './useCardsStore';
import { useFavoritesStore } from './useFavoritesStore';
import { usePreferencesStore } from './usePreferencesStore';

// Combined store hook for backward compatibility and convenience
export const useAppStore = () => {
  const auth = useAuthStore();
  const room = useRoomStore();
  const cards = useCardsStore();
  const favorites = useFavoritesStore();
  const preferences = usePreferencesStore();

  return {
    // Auth state
    user: auth.user,
    userId: auth.userId,
    isLoading: auth.isLoading,
    error: auth.error,
    forceAuthScreen: auth.forceAuthScreen,
    
    // Auth actions
    setUser: auth.setUser,
    setLoading: auth.setLoading,
    setError: auth.setError,
    setForceAuthScreen: auth.setForceAuthScreen,
    signInAnonymously: auth.signInAnonymously,
    signInWithEmail: auth.signInWithEmail,
    signUpWithEmail: auth.signUpWithEmail,
    signInWithGoogle: auth.signInWithGoogle,
    signOut: auth.signOut,

    // Room state
    currentRoom: room.currentRoom,
    matches: room.matches,
    isLoadingMatches: room.isLoadingMatches,
    lastMatchesRoomId: room.lastMatchesRoomId,
    lastMatchesLoadedAt: room.lastMatchesLoadedAt,
    indexRequiredForMatches: room.indexRequiredForMatches,
    
    // Room actions
    setCurrentRoom: room.setCurrentRoom,
    setMatches: room.setMatches,
    createRoom: async (name: string, displayName: string) => {
      if (!auth.userId) throw new Error('User not authenticated');
      return await room.createRoom(name, displayName, auth.userId);
    },
    joinRoom: async (pin: string, displayName: string) => {
      if (!auth.userId) throw new Error('User not authenticated');
      return await room.joinRoom(pin, displayName, auth.userId);
    },
    leaveRoom: () => {
      if (!auth.userId) throw new Error('User not authenticated');
      return room.leaveRoom(auth.userId);
    },
    submitSwipe: (cardId: string, action: 'like' | 'dislike' | 'superlike') => {
      if (!auth.userId) throw new Error('User not authenticated');
      return room.submitSwipe(cardId, action, auth.userId);
    },
    loadMatches: () => {
      if (!auth.userId) throw new Error('User not authenticated');
      return room.loadMatches(auth.userId);
    },
    listenToRoomUpdates: room.listenToRoomUpdates,
    stopListeningToRoomUpdates: room.stopListeningToRoomUpdates,

    // Cards state
    currentCards: cards.currentCards,
    currentCardIndex: cards.currentCardIndex,
    userLocation: cards.userLocation,
    
    // Cards actions
    setCurrentCards: cards.setCurrentCards,
    setCurrentCardIndex: cards.setCurrentCardIndex,
    setUserLocation: cards.setUserLocation,
    nextCard: cards.nextCard,
    resetCards: cards.resetCards,

    // Favorites state
    favorites: favorites.favorites,
    isLoadingFavorites: favorites.isLoadingFavorites,
    
    // Favorites actions
    addToFavorites: favorites.addToFavorites,
    removeFromFavorites: favorites.removeFromFavorites,
    isFavorite: favorites.isFavorite,
    loadFavorites: favorites.loadFavorites,
    clearFavorites: favorites.clearFavorites,

    // Preferences state
    userPreferences: preferences.userPreferences,
    isLoadingPreferences: preferences.isLoadingPreferences,
    
    // Preferences actions
    updateUserPreferences: preferences.updateUserPreferences,
    loadUserPreferences: () => {
      if (!auth.userId) throw new Error('User not authenticated');
      return preferences.loadUserPreferences(auth.userId);
    },
    saveUserPreferences: () => {
      if (!auth.userId) throw new Error('User not authenticated');
      return preferences.saveUserPreferences(auth.userId);
    },
    resetUserPreferences: preferences.resetUserPreferences,
  };
};

// Additional convenience hooks
export const useUserId = () => {
  const auth = useAuthStore();
  return auth.userId;
};