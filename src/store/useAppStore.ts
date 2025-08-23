import { create } from 'zustand';
import { User, Room, Match, FoodCard } from '../types';
import { AuthService } from '../services/authService';
import { RoomService } from '../services/roomService';
import { cleanRestaurantForFirestore } from '../utils/firestoreUtils';
import { analyticsService, AnalyticsEvent } from '../services/analyticsService';
import { logger } from '../services/loggingService';

import { FirestoreErrorHandler } from '../utils/firestoreErrorHandler';

interface AppState {
  // User state
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  // Location state
  userLocation: { latitude: number; longitude: number } | null;
  // Matches state
  isLoadingMatches: boolean;
  lastMatchesRoomId: string | null;
  lastMatchesLoadedAt: number | null;
  indexRequiredForMatches: boolean;
  
  // Room state
  currentRoom: Room | null;
  matches: Match[];
  
  // Card state
  currentCards: FoodCard[];
  currentCardIndex: number;
  
  // Favorites state
  favorites: FoodCard[];
  isLoadingFavorites: boolean;
  
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
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentRoom: (room: Room | null) => void;
  setMatches: (matches: Match[]) => void;
  setCurrentCards: (cards: FoodCard[]) => void;
  setCurrentCardIndex: (index: number) => void;
  setUserLocation: (loc: { latitude: number; longitude: number } | null) => void;
  
  // Auth actions
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Room actions
  createRoom: (name: string, displayName: string) => Promise<void>;
  joinRoom: (pin: string, displayName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  submitSwipe: (cardId: string, action: 'like' | 'dislike' | 'superlike') => Promise<void>;
  loadMatches: () => Promise<void>;
  listenToRoomUpdates: (roomId: string) => void;
  stopListeningToRoomUpdates: () => void;
  
  // Card actions
  nextCard: () => void;
  resetCards: () => void;
  
  // Favorites actions
  addToFavorites: (restaurant: FoodCard) => void;
  removeFromFavorites: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  loadFavorites: () => Promise<void>;
  clearFavorites: () => void;
  
  // User Preferences actions
  updateUserPreferences: (preferences: Partial<AppState['userPreferences']>) => void;
  loadUserPreferences: () => Promise<void>;
  saveUserPreferences: () => Promise<void>;
  resetUserPreferences: () => void;
  
  // Real-time listeners
  unsubscribeRoom?: () => void;
  unsubscribeMatches?: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  userId: null,
  isLoading: false,
  error: null,
  currentRoom: null,
  matches: [],
  currentCards: [],
  currentCardIndex: 0,
  userLocation: null,
  isLoadingMatches: false,
  lastMatchesRoomId: null,
  lastMatchesLoadedAt: null,
  indexRequiredForMatches: false,
  favorites: [],
  isLoadingFavorites: false,
  userPreferences: {
    dietaryRestrictions: [],
    cuisinePreferences: [], // Start with no preferences - user must set them
    priceRange: ['$', '$$', '$$$'],
    maxDistance: 10,
    minRating: 3.5,
  },
  isLoadingPreferences: false,

  // State setters
  setUser: (user) => {
    set({ user, userId: user?.id || null });
  },
  setLoading: (isLoading) => {
    set({ isLoading });
  },
  setError: (error: string | null) => {
    set({ error });
    if (error) {
      console.error('AppStore Error:', error);
      // Log to analytics
      try {
        analyticsService.trackEvent(AnalyticsEvent.APP_ERROR, { error });
      } catch (analyticsError) {
        console.log('Failed to log error to analytics:', analyticsError);
      }
    }
  },
  setCurrentRoom: (currentRoom) => set({ currentRoom }),
  setMatches: (matches) => set({ matches }),
  setCurrentCards: (currentCards: FoodCard[]) => {
    // Validate cards before setting
    const validatedCards = currentCards.filter(card => 
      card && card.id && card.title && card.imageUrl
    );
    
    set({ 
      currentCards: validatedCards, 
      currentCardIndex: 0,
      error: null 
    });
  },
  setCurrentCardIndex: (currentCardIndex: number) => {
    const { currentCards } = get();
    
    // Validate index bounds
    if (currentCardIndex < 0 || currentCardIndex >= currentCards.length) {
      console.warn(`AppStore: Invalid card index ${currentCardIndex}, max: ${currentCards.length - 1}`);
      return;
    }
    
    set({ currentCardIndex });
  },
  setUserLocation: (userLocation) => set({ userLocation }),
  


  // Auth actions
  signInAnonymously: async () => {
    try {
      logger.info('Starting anonymous sign in', 'AUTH');
      set({ isLoading: true, error: null });
      
      const user = await AuthService.signInAnonymously();
      
      analyticsService.setUserId(user.id);
      logger.setUserId(user.id);
      analyticsService.trackEvent(AnalyticsEvent.USER_LOGIN, { method: 'anonymous' });
      logger.info('Anonymous sign in successful', 'AUTH', { userId: user.id });
      
      set({ user, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      logger.error('Anonymous sign in failed', 'AUTH', { error: errorMessage });
      analyticsService.trackError(error as Error, 'AUTH_SIGNIN');
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      logger.info('Starting email sign in', 'AUTH');
      set({ isLoading: true, error: null });
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );
      
      const user = await Promise.race([
        AuthService.signInWithEmail(email, password),
        timeoutPromise
      ]);
      
      analyticsService.setUserId(user.id);
      logger.setUserId(user.id);
      analyticsService.trackEvent(AnalyticsEvent.USER_LOGIN, { method: 'email' });
      logger.info('Email sign in successful', 'AUTH', { userId: user.id });
      
      set({ user, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email sign in failed';
      logger.error('Email sign in failed', 'AUTH', { error: errorMessage });
      analyticsService.trackError(error as Error, 'AUTH_EMAIL_SIGNIN');
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      // Don't re-throw the error to prevent infinite loading
    }
  },

  signUpWithEmail: async (email: string, password: string, displayName: string) => {
    try {
      logger.info('Starting email sign up', 'AUTH');
      set({ isLoading: true, error: null });
      
      const user = await AuthService.signUpWithEmail(email, password, displayName);
      
      analyticsService.setUserId(user.id);
      logger.setUserId(user.id);
      analyticsService.trackEvent(AnalyticsEvent.USER_LOGIN, { method: 'email_signup' });
      logger.info('Email sign up successful', 'AUTH', { userId: user.id });
      
      set({ user, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email sign up failed';
      logger.error('Email sign up failed', 'AUTH', { error: errorMessage });
      analyticsService.trackError(error as Error, 'AUTH_EMAIL_SIGNUP');
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      // Don't re-throw the error to prevent infinite loading
    }
  },

  signInWithGoogle: async () => {
    try {
      logger.info('Starting Google sign in', 'AUTH');
      set({ isLoading: true, error: null });
      
      const user = await AuthService.signInWithGoogle();
      
      analyticsService.setUserId(user.id);
      logger.setUserId(user.id);
      analyticsService.trackEvent(AnalyticsEvent.USER_LOGIN, { method: 'google' });
      logger.info('Google sign in successful', 'AUTH', { userId: user.id });
      
      set({ user, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      logger.error('Google sign in failed', 'AUTH', { error: errorMessage });
      analyticsService.trackError(error as Error, 'AUTH_GOOGLE_SIGNIN');
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      // Don't re-throw the error to prevent infinite loading
    }
  },

  signOut: async () => {
    try {
      logger.info('Starting sign out', 'AUTH');
      set({ isLoading: true, error: null });
      
      await AuthService.signOut();
      
      // Also sign out from Google if signed in
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      const isGoogleSignedIn = await GoogleSignin.isSignedIn();
      if (isGoogleSignedIn) {
        await GoogleSignin.signOut();
      }
      
      analyticsService.trackEvent(AnalyticsEvent.USER_LOGOUT);
      logger.info('Sign out successful', 'AUTH');
      
      analyticsService.setUserId(null);
      logger.setUserId(undefined);
      
      set({ 
        user: null, 
        currentRoom: null, 
        matches: [], 
        currentCards: [], 
        currentCardIndex: 0,
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      logger.error('Sign out failed', 'AUTH', { error: errorMessage });
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
    }
  },

  // Room actions
  createRoom: async (name: string, displayName: string) => {
    try {
      logger.info('Creating room', 'ROOM', { name, displayName });
      set({ isLoading: true, error: null });
      
      const { user } = get();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const room = await RoomService.createRoom(name, user.id, displayName);
      
      analyticsService.trackEvent(AnalyticsEvent.ROOM_CREATED, { 
        roomId: room.id, 
        roomName: name 
      });
      logger.logRoomOperation('created', room.id, { name, displayName, pin: room.pin });
      
      set({ currentRoom: room, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      logger.error('Failed to create room', 'ROOM', { error: errorMessage, name, displayName });
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      // Re-throw the error so the UI can handle it while keeping store state updated
      throw error;
    }
  },

  joinRoom: async (pin: string, displayName: string) => {
    try {
      logger.info('Joining room', 'ROOM', { pin, displayName });
      set({ isLoading: true, error: null });
      
      const { user } = get();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const room = await RoomService.joinRoom(pin, user.id, displayName);
      
      analyticsService.trackEvent(AnalyticsEvent.ROOM_JOINED, { 
        roomId: room.id, 
        pin 
      });
      logger.logRoomOperation('joined', room.id, { pin, displayName, memberCount: room.members.length });
      
      set({ currentRoom: room, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      logger.error('Failed to join room', 'ROOM', { error: errorMessage, pin, displayName });
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      // Re-throw the error so the UI can handle it while keeping store state updated
      throw error;
    }
  },

  leaveRoom: async () => {
    try {
      const { currentRoom, user } = get();
      if (!currentRoom || !user) return;

      logger.info('Leaving room', 'ROOM', { roomId: currentRoom.id });
      set({ isLoading: true, error: null });

      await RoomService.leaveRoom(currentRoom.id, user.id);
      
      analyticsService.trackEvent(AnalyticsEvent.ROOM_LEFT, { 
        roomId: currentRoom.id 
      });
      logger.logRoomOperation('left', currentRoom.id);
      
      get().stopListeningToRoomUpdates();
      set({ 
        currentRoom: null, 
        matches: [], 
        currentCards: [], 
        currentCardIndex: 0,
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave room';
      logger.error('Failed to leave room', 'ROOM', { error: errorMessage });
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
    }
  },

  submitSwipe: async (cardId: string, action: 'like' | 'dislike' | 'superlike') => {
    const { currentRoom, user, currentCardIndex, currentCards } = get();
    if (!currentRoom || !user) return;

    const currentCard = currentCards[currentCardIndex];
    const swipeStart = Date.now();

    try {
      // Optimistic update - move to next card immediately
      const nextCardIndex = currentCardIndex < currentCards.length - 1 ? currentCardIndex + 1 : currentCardIndex;
      set({ currentCardIndex: nextCardIndex });

      // Track swipe analytics
      const analyticsEvent = action === 'like' 
        ? AnalyticsEvent.RESTAURANT_SWIPED_RIGHT 
        : action === 'superlike' 
        ? AnalyticsEvent.RESTAURANT_SUPER_LIKED 
        : AnalyticsEvent.RESTAURANT_SWIPED_LEFT;
      
      analyticsService.trackEvent(analyticsEvent, {
        cardId,
        restaurantName: currentCard?.title,
        roomId: currentRoom.id,
        cardIndex: currentCardIndex,
      });

      logger.info(`Swipe ${action}`, 'SWIPE', { 
        cardId, 
        restaurantName: currentCard?.title, 
        roomId: currentRoom.id 
      });

      // Submit swipe to backend
      await RoomService.submitSwipe(currentRoom.id, user.id, cardId, action);
      
      // Check for match
      const match = await RoomService.checkForMatch(currentRoom.id, cardId);
      if (match) {
        // Atomic match update
        set(state => ({ 
          matches: [match, ...state.matches],
          error: null 
        }));
        
        analyticsService.trackEvent(AnalyticsEvent.MATCH_CREATED, {
          matchId: match.id,
          cardId,
          restaurantName: currentCard?.title,
          roomId: currentRoom.id,
        });
        logger.logMatchOperation('created', match.id, { cardId, restaurantName: currentCard?.title });
        
        console.log('🎉 Match found! Everyone liked this restaurant!');
      }

      // Log performance
      const swipeDuration = Date.now() - swipeStart;
      logger.info('Swipe action performance', 'PERFORMANCE', {
        duration: swipeDuration,
        unit: 'ms'
      });
      logger.logPerformance('swipe_action', swipeDuration, 'ms', 'SWIPE');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit swipe';
      logger.error('Failed to submit swipe', 'SWIPE', { 
        error: errorMessage, 
        cardId, 
        action, 
        roomId: currentRoom.id 
      });
      
      // Revert optimistic update on error
      set({ 
        currentCardIndex,
        error: errorMessage
      });
    }
  },

  // Card actions
  nextCard: () => {
    const { currentCardIndex, currentCards } = get();
    if (currentCardIndex < currentCards.length - 1) {
      set({ currentCardIndex: currentCardIndex + 1 });
    }
  },

  resetCards: () => {
    set({ currentCardIndex: 0 });
  },

  // Favorites actions
  addToFavorites: async (restaurant: FoodCard) => {
    const state = get();
    const userId = state.user?.id;
    if (!userId) {
      console.log('❌ addToFavorites: No user ID available');
      return;
    }
    
    console.log(`🔄 addToFavorites: Adding "${restaurant.title}" (ID: ${restaurant.id})`);
    
    // Check if already favorited
    if (state.isFavorite(restaurant.id)) {
      console.log(`⚠️ addToFavorites: "${restaurant.title}" is already in favorites`);
      return;
    }
    
    // Optimistic update
    set(prevState => ({ 
      ...prevState,
      favorites: [...prevState.favorites, restaurant],
      error: null
    }));
    
    console.log(`📝 addToFavorites: Optimistic update complete. Total favorites: ${state.favorites.length + 1}`);
    
    try {
      await RoomService.saveFavorite(userId, restaurant);
      console.log(`✅ addToFavorites: Successfully saved "${restaurant.title}" to Firestore`);
    } catch (error) {
      // Revert optimistic update on error
      set(prevState => ({ 
        ...prevState,
        favorites: prevState.favorites.filter(f => f.id !== restaurant.id),
        error: error instanceof Error ? error.message : 'Failed to add to favorites'
      }));
      console.error('❌ addToFavorites: Failed to save to Firestore:', error);
    }
  },
  removeFromFavorites: async (restaurantId: string) => {
    const state = get();
    const userId = state.user?.id;
    if (!userId) return;
    
    // Store original favorite for potential revert
    const originalFavorite = state.favorites.find(f => f.id === restaurantId);
    if (!originalFavorite) return;
    
    // Optimistic update
    set(prevState => ({ 
      ...prevState,
      favorites: prevState.favorites.filter(f => f.id !== restaurantId),
      error: null
    }));
    
    try {
      await RoomService.removeFavorite(userId, restaurantId);
      console.log(`Successfully removed restaurant ${restaurantId} from favorites`);
    } catch (error) {
      // Revert optimistic update on error
      set(prevState => ({ 
        ...prevState,
        favorites: [...prevState.favorites, originalFavorite],
        error: error instanceof Error ? error.message : 'Failed to remove from favorites'
      }));
      console.error('Failed to remove from favorites:', error);
    }
  },
  isFavorite: (restaurantId: string) => {
    return get().favorites.some(f => f.id === restaurantId);
  },
  loadFavorites: async () => {
    const state = get();
    const userId = state.user?.id;
    if (!userId) {
      console.log('❌ loadFavorites: No user ID available');
      return;
    }
    if (state.isLoadingFavorites) {
      console.log('⏳ loadFavorites: Already loading favorites');
      return;
    }
    
    console.log(`🔄 loadFavorites: Loading favorites for user ${userId}`);
    
    // Atomic loading state
    set(prevState => ({ 
      ...prevState, 
      isLoadingFavorites: true,
      error: null
    }));
    
    try {
      const favorites = await RoomService.getFavorites(userId);
      
      console.log(`✅ loadFavorites: Loaded ${favorites.length} favorites from Firestore`);
      if (favorites.length > 0) {
        console.log('📋 loadFavorites: Favorites loaded:', favorites.map(f => f.title));
      }
      
      // Atomic success state
      set(prevState => ({ 
        ...prevState, 
        favorites, 
        isLoadingFavorites: false 
      }));
    } catch (error: any) {
      // Handle Firestore errors gracefully using centralized error handler
      const errorMessage = FirestoreErrorHandler.getUserFriendlyMessage(error, 'favorites');
      FirestoreErrorHandler.logError(error, 'loadFavorites');
      
      console.error('❌ loadFavorites: Failed to load favorites:', error);
      
      // Atomic error state
      set(prevState => ({ 
        ...prevState, 
        isLoadingFavorites: false,
        error: errorMessage
      }));
    }
  },
  clearFavorites: () => {
    set({ favorites: [] });
  },

  // Real-time functionality
  loadMatches: async () => {
    const state = get();
    const now = Date.now();
    
    // Early validation
    if (!state.currentRoom?.id || state.isLoadingMatches) return;
    
    // Smart throttling - avoid redundant calls
    if (state.lastMatchesRoomId === state.currentRoom.id && 
        state.lastMatchesLoadedAt && 
        now - state.lastMatchesLoadedAt < 20000) {
      return;
    }

    try {
      // Atomic loading state update
      set(prevState => ({ 
        ...prevState,
        isLoadingMatches: true, 
        indexRequiredForMatches: false,
        error: null
      }));
      
      const matches = await RoomService.getMatches(state.currentRoom!.id);
      
      // Atomic success state update
      set(prevState => ({
        ...prevState,
        matches, 
        lastMatchesRoomId: state.currentRoom!.id, 
        lastMatchesLoadedAt: now, 
        isLoadingMatches: false
      }));
    } catch (error: any) {
      const message = String(error?.message || '');
      
      if (message.includes('The query requires an index')) {
        // Atomic index requirement update
        set(prevState => ({
          ...prevState,
          indexRequiredForMatches: true, 
          isLoadingMatches: false, 
          lastMatchesRoomId: state.currentRoom!.id, 
          lastMatchesLoadedAt: now
        }));
        console.warn('Firestore index required for matches. Create it from the console link in the logs.');
      } else {
        // Atomic error state update
        set(prevState => ({
          ...prevState,
          isLoadingMatches: false,
          error: error instanceof Error ? error.message : 'Failed to load matches'
        }));
        console.error('Failed to load matches:', error);
      }
    }
  },

  listenToRoomUpdates: (roomId: string) => {
    const state = get();
    
    // Clean up existing listener
    if (state.unsubscribeRoom) {
      state.unsubscribeRoom();
    }

    const unsubscribe = RoomService.onRoomUpdate(roomId, (room) => {
      // Atomic room update
      set(prevState => ({ 
        ...prevState, 
        currentRoom: room,
        error: null 
      }));
    });

    // Atomic listener registration
    set(prevState => ({ 
      ...prevState, 
      unsubscribeRoom: unsubscribe 
    }));
  },

  stopListeningToRoomUpdates: () => {
    const state = get();
    
    // Clean up listeners
    if (state.unsubscribeRoom) {
      state.unsubscribeRoom();
    }
    if (state.unsubscribeMatches) {
      state.unsubscribeMatches();
    }
    
    // Atomic cleanup
    set(prevState => ({ 
      ...prevState, 
      unsubscribeRoom: undefined, 
      unsubscribeMatches: undefined 
    }));
  },

  // User Preferences actions
  updateUserPreferences: (preferences) => {
    const state = get();
    console.log('🔄 updateUserPreferences: Updating preferences:', preferences);
    
    set(prevState => ({
      ...prevState,
      userPreferences: {
        ...prevState.userPreferences,
        ...preferences
      }
    }));
    
    // Auto-save preferences when they're updated
    setTimeout(() => {
      get().saveUserPreferences();
    }, 100);
  },

  loadUserPreferences: async () => {
    const state = get();
    const userId = state.user?.id;
    if (!userId || state.isLoadingPreferences) return;
    
    console.log('🔄 loadUserPreferences: Loading preferences for user:', userId);
    
    set(prevState => ({ 
      ...prevState, 
      isLoadingPreferences: true,
      error: null
    }));
    
    try {
      // Check if we already have preferences set (don't overwrite them)
      const currentPreferences = state.userPreferences;
      const hasExistingPreferences = currentPreferences.cuisinePreferences.length > 0 || 
                                   currentPreferences.dietaryRestrictions.length > 0;
      
      if (hasExistingPreferences) {
        console.log('✅ loadUserPreferences: Using existing preferences:', currentPreferences);
        set(prevState => ({ 
          ...prevState, 
          isLoadingPreferences: false 
        }));
        return;
      }
      
      // Only load defaults if no preferences are set
      const defaultPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [], // Start with no preferences - user must set them
        priceRange: ['$', '$$', '$$$'],
        maxDistance: 10,
        minRating: 3.5,
      };
      
      set(prevState => ({ 
        ...prevState, 
        userPreferences: defaultPreferences,
        isLoadingPreferences: false 
      }));
      
      console.log('✅ loadUserPreferences: Loaded default preferences (no existing preferences found)');
    } catch (error) {
      console.error('❌ loadUserPreferences: Failed to load preferences:', error);
      set(prevState => ({ 
        ...prevState, 
        isLoadingPreferences: false,
        error: error instanceof Error ? error.message : 'Failed to load preferences'
      }));
    }
  },

  saveUserPreferences: async () => {
    const state = get();
    const userId = state.user?.id;
    if (!userId) {
      console.log('❌ saveUserPreferences: No user ID available');
      return;
    }
    
    console.log('🔄 saveUserPreferences: Saving preferences for user:', userId);
    console.log('📝 saveUserPreferences: Preferences to save:', state.userPreferences);
    
    try {
      // For now, save to localStorage for persistence
      // In the future, this would save to Firestore
      const preferencesKey = `userPreferences_${userId}`;
      const preferencesData = JSON.stringify(state.userPreferences);
      
      // In React Native, we'll use AsyncStorage (but for now, just log)
      // await AsyncStorage.setItem(preferencesKey, preferencesData);
      
      console.log('✅ saveUserPreferences: Preferences saved successfully to localStorage');
      console.log('💾 saveUserPreferences: Saved data:', preferencesData);
    } catch (error) {
      console.error('❌ saveUserPreferences: Failed to save preferences:', error);
      set(prevState => ({ 
        ...prevState, 
        error: error instanceof Error ? error.message : 'Failed to save preferences'
      }));
    }
  },

  resetUserPreferences: () => {
    console.log('🔄 resetUserPreferences: Resetting to default preferences');
    
    const defaultPreferences = {
      dietaryRestrictions: [],
      cuisinePreferences: [], // Start with no preferences - user must set them
      priceRange: ['$', '$$', '$$$'],
      maxDistance: 10,
      minRating: 3.5,
    };
    
    set(prevState => ({ 
      ...prevState, 
      userPreferences: defaultPreferences
    }));
    
    console.log('✅ resetUserPreferences: Preferences reset successfully');
  },
}));

// Add computed getters for convenience
export const useUserId = () => useAppStore(state => state.user?.id);
export const useIsAuthenticated = () => useAppStore(state => !!state.user);
