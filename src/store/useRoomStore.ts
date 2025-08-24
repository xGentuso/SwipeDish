import { create } from 'zustand';
import { Room, Match } from '../types';
import { RoomService } from '../services/roomService';
import { cleanRestaurantForFirestore } from '../utils/firestoreUtils';
import { analyticsService, AnalyticsEvent } from '../services/analyticsService';
import { logger } from '../services/loggingService';
import { FirestoreErrorHandler } from '../utils/firestoreErrorHandler';

interface RoomState {
  // Room state
  currentRoom: Room | null;
  matches: Match[];
  isLoadingMatches: boolean;
  lastMatchesRoomId: string | null;
  lastMatchesLoadedAt: number | null;
  indexRequiredForMatches: boolean;

  // Real-time listeners
  unsubscribeRoom?: () => void;
  unsubscribeMatches?: () => void;

  // Actions
  setCurrentRoom: (room: Room | null) => void;
  setMatches: (matches: Match[]) => void;

  // Room operations
  createRoom: (name: string, displayName: string, userId: string) => Promise<Room>;
  joinRoom: (pin: string, displayName: string, userId: string) => Promise<Room | null>;
  leaveRoom: (userId?: string) => Promise<void>;
  submitSwipe: (cardId: string, action: 'like' | 'dislike' | 'superlike', userId: string) => Promise<void>;
  loadMatches: (userId: string) => Promise<void>;
  listenToRoomUpdates: (roomId: string) => void;
  stopListeningToRoomUpdates: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  // Initial state
  currentRoom: null,
  matches: [],
  isLoadingMatches: false,
  lastMatchesRoomId: null,
  lastMatchesLoadedAt: null,
  indexRequiredForMatches: false,
  unsubscribeRoom: undefined,
  unsubscribeMatches: undefined,

  // Actions
  setCurrentRoom: (currentRoom) => set({ currentRoom }),
  setMatches: (matches) => set({ matches }),

  // Room operations
  createRoom: async (name: string, displayName: string, userId: string) => {
    try {
      logger.info('Creating room', 'ROOM', { name, displayName });

      const room = await RoomService.createRoom(name, userId, displayName);
      analyticsService.trackEvent(AnalyticsEvent.ROOM_CREATED, {
        roomId: room.id,
        roomPin: room.pin,
      });
      logger.info('Room created successfully', 'ROOM', { roomId: room.id, pin: room.pin });

      set({ currentRoom: room });
      return room;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      logger.error('Failed to create room', 'ROOM', { error: errorMessage });
      throw error;
    }
  },

  joinRoom: async (pin: string, displayName: string, userId: string) => {
    try {
      logger.info('Joining room', 'ROOM', { pin, displayName });

      const room = await RoomService.joinRoom(pin, userId, displayName);
      if (room) {
        analyticsService.trackEvent(AnalyticsEvent.ROOM_JOINED, {
          roomId: room.id,
          roomPin: room.pin,
        });
        logger.info('Room joined successfully', 'ROOM', { roomId: room.id, pin: room.pin });

        set({ currentRoom: room });
      }
      return room;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      logger.error('Failed to join room', 'ROOM', { error: errorMessage });
      throw error;
    }
  },

  leaveRoom: async (userId?: string) => {
    const state = get();
    const { currentRoom } = state;

    try {
      if (currentRoom && userId) {
        logger.info('Leaving room', 'ROOM', { roomId: currentRoom.id });
        await RoomService.leaveRoom(currentRoom.id, userId);
        analyticsService.trackEvent(AnalyticsEvent.ROOM_LEFT, { roomId: currentRoom.id });
        logger.info('Left room successfully', 'ROOM', { roomId: currentRoom.id });
      }

      get().stopListeningToRoomUpdates();
      set({
        currentRoom: null,
        matches: [],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave room';
      logger.error('Failed to leave room', 'ROOM', { error: errorMessage });
      throw error;
    }
  },

  submitSwipe: async (cardId: string, action: 'like' | 'dislike' | 'superlike', userId: string) => {
    const state = get();
    const { currentRoom } = state;

    if (!currentRoom || !userId) {
      logger.warn('Cannot submit swipe: no room or user', 'ROOM');
      return;
    }

    try {
      logger.info('Submitting swipe', 'ROOM', { cardId, action, roomId: currentRoom.id });

      await RoomService.submitSwipe(currentRoom.id, userId, cardId, action);
      
      // Track the appropriate swipe event based on action
      const eventMap = {
        'like': AnalyticsEvent.RESTAURANT_SWIPED_RIGHT,
        'dislike': AnalyticsEvent.RESTAURANT_SWIPED_LEFT,
        'superlike': AnalyticsEvent.RESTAURANT_SUPER_LIKED,
      } as const;
      
      analyticsService.trackEvent(eventMap[action], {
        cardId,
        action,
        roomId: currentRoom.id,
      });
      logger.info('Swipe submitted successfully', 'ROOM', { cardId, action });
    } catch (error) {
      const errorMessage = FirestoreErrorHandler.getErrorMessage(error);
      logger.error('Failed to submit swipe', 'ROOM', { error: errorMessage, cardId, action });
      throw error;
    }
  },

  loadMatches: async (userId: string) => {
    const state = get();
    const { currentRoom, lastMatchesRoomId, lastMatchesLoadedAt } = state;

    if (!currentRoom || !userId) {
      logger.warn('Cannot load matches: no room or user', 'MATCHES');
      return;
    }

    // Avoid reloading if we just loaded matches for this room
    if (
      lastMatchesRoomId === currentRoom.id &&
      lastMatchesLoadedAt &&
      Date.now() - lastMatchesLoadedAt < 5000
    ) {
      logger.info('Skipping matches reload - recently loaded', 'MATCHES');
      return;
    }

    try {
      set({ isLoadingMatches: true });
      logger.info('Loading matches', 'MATCHES', { roomId: currentRoom.id });

      const matches = await RoomService.getMatches(currentRoom.id);
      logger.info('Matches loaded successfully', 'MATCHES', {
        roomId: currentRoom.id,
        matchesCount: matches.length,
      });

      set({
        matches,
        isLoadingMatches: false,
        lastMatchesRoomId: currentRoom.id,
        lastMatchesLoadedAt: Date.now(),
      });
    } catch (error) {
      const errorMessage = FirestoreErrorHandler.getErrorMessage(error);
      logger.error('Failed to load matches', 'MATCHES', { error: errorMessage });

      if (errorMessage.includes('index')) {
        set({ indexRequiredForMatches: true });
      }

      set({ isLoadingMatches: false });
      throw error;
    }
  },

  listenToRoomUpdates: (roomId: string) => {
    const state = get();

    // Clean up existing listener
    if (state.unsubscribeRoom) {
      state.unsubscribeRoom();
    }

    const unsubscribe = RoomService.onRoomUpdate(roomId, (room) => {
      set(prevState => ({
        ...prevState,
        currentRoom: room,
      }));
    });

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

    set(prevState => ({
      ...prevState,
      unsubscribeRoom: undefined,
      unsubscribeMatches: undefined
    }));
  },
}));