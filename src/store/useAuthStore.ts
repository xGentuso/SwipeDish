import { create } from 'zustand';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { GoogleSignInService } from '../services/googleSignInService';
import { analyticsService, AnalyticsEvent } from '../services/analyticsService';
import { logger } from '../services/loggingService';

interface AuthState {
  // Auth state
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  forceAuthScreen: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setForceAuthScreen: (forceAuthScreen: boolean) => void;

  // Auth operations
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  userId: null,
  isLoading: false,
  error: null,
  forceAuthScreen: false,

  // Actions
  setUser: (user) => {
    set({ user, userId: user?.id || null });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setForceAuthScreen: (forceAuthScreen) => set({ forceAuthScreen }),

  // Auth operations
  signInAnonymously: async () => {
    try {
      logger.info('Starting anonymous sign in', 'AUTH');
      set({ isLoading: true, error: null });

      const user = await AuthService.signInAnonymously();
      if (!user) {
        throw new Error('Anonymous sign in failed');
      }

      analyticsService.setUserId(user.id);
      logger.setUserId(user.id);
      analyticsService.trackEvent(AnalyticsEvent.USER_LOGIN, { method: 'anonymous' });
      logger.info('Anonymous sign in successful', 'AUTH', { userId: user.id });

      set({ user, userId: user.id, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Anonymous sign in failed';
      logger.error('Anonymous sign in failed', 'AUTH', { error: errorMessage });
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      logger.info('Starting email sign in', 'AUTH');
      set({ isLoading: true, error: null });

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      const user = await Promise.race([
        AuthService.signInWithEmail(email, password),
        timeoutPromise
      ]);

      if (!user) {
        throw new Error('Email sign in failed');
      }

      analyticsService.setUserId(user.id);
      logger.setUserId(user.id);
      analyticsService.trackEvent(AnalyticsEvent.USER_LOGIN, { method: 'email' });
      logger.info('Email sign in successful', 'AUTH', { userId: user.id });

      set({ user, userId: user.id, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      logger.error('Email sign in failed', 'AUTH', { error: errorMessage });
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signUpWithEmail: async (email: string, password: string, displayName: string) => {
    try {
      logger.info('Starting email sign up', 'AUTH');
      set({ isLoading: true, error: null });

      const user = await AuthService.signUpWithEmail(email, password, displayName);
      if (!user) {
        throw new Error('Email sign up failed');
      }

      analyticsService.setUserId(user.id);
      logger.setUserId(user.id);
      analyticsService.trackEvent(AnalyticsEvent.USER_SIGNUP, { method: 'email' });
      logger.info('Email sign up successful', 'AUTH', { userId: user.id });

      set({ user, userId: user.id, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      logger.error('Email sign up failed', 'AUTH', { error: errorMessage });
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      logger.info('Starting Google sign in', 'AUTH');
      set({ isLoading: true, error: null });

      const result = await GoogleSignInService.signIn();
      if (!result?.idToken) {
        throw new Error('Google sign in failed');
      }

      // Create a user object from Google sign-in result
      // In a real app, you would exchange the tokens with your backend for user data
      const user = {
        id: 'google_user_' + Date.now(), // Temporary ID - replace with actual user ID from your backend
        displayName: 'Google User', // Replace with actual user name from Google profile
        email: null, // Replace with actual email from Google profile
        joinedRooms: [] as string[],
        lastActive: new Date(),
        createdAt: new Date(),
      };

      analyticsService.setUserId(user.id);
      logger.setUserId(user.id);
      analyticsService.trackEvent(AnalyticsEvent.USER_LOGIN, { method: 'google' });
      logger.info('Google sign in successful', 'AUTH', { userId: user.id });

      set({ user, userId: user.id, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      logger.error('Google sign in failed', 'AUTH', { error: errorMessage });
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      logger.info('Starting sign out', 'AUTH');
      set({ isLoading: true, error: null });

      await AuthService.signOut();
      analyticsService.trackEvent(AnalyticsEvent.USER_LOGOUT);
      logger.info('Sign out successful', 'AUTH');

      set({
        user: null,
        userId: null,
        isLoading: false,
        error: null,
        forceAuthScreen: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      logger.error('Sign out failed', 'AUTH', { error: errorMessage });
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));