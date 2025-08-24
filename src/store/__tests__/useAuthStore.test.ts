import { useAuthStore } from '../useAuthStore';
import { AuthService } from '../../services/authService';
import { GoogleSignInService } from '../../services/googleSignInService';
import { analyticsService } from '../../services/analyticsService';
import { logger } from '../../services/loggingService';

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../services/googleSignInService');
jest.mock('../../services/analyticsService');
jest.mock('../../services/loggingService');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockGoogleSignInService = GoogleSignInService as jest.Mocked<typeof GoogleSignInService>;
const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setLoading(false);
    useAuthStore.getState().setError(null);
    useAuthStore.getState().setForceAuthScreen(false);
    
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.forceAuthScreen).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and userId', () => {
      const mockUser = { 
        id: 'user123', 
        displayName: 'Test User', 
        email: 'test@example.com',
        joinedRooms: [],
        lastActive: new Date(),
        createdAt: new Date()
      };
      const { setUser } = useAuthStore.getState();
      
      setUser(mockUser);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.userId).toBe('user123');
    });

    it('should clear userId when user is null', () => {
      const { setUser } = useAuthStore.getState();
      
      setUser(null);
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.userId).toBeNull();
    });
  });

  describe('signInAnonymously', () => {
    it('should sign in anonymously successfully', async () => {
      const mockUser = { 
        id: 'anon123', 
        displayName: 'Anonymous', 
        email: null,
        joinedRooms: [],
        lastActive: new Date(),
        createdAt: new Date()
      };
      mockAuthService.signInAnonymously.mockResolvedValue(mockUser);
      
      const { signInAnonymously } = useAuthStore.getState();
      
      await signInAnonymously();
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.userId).toBe('anon123');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockAnalyticsService.setUserId).toHaveBeenCalledWith('anon123');
      expect(mockLogger.setUserId).toHaveBeenCalledWith('anon123');
    });

    it('should handle sign in failure', async () => {
      const errorMessage = 'Anonymous sign in failed';
      mockAuthService.signInAnonymously.mockRejectedValue(new Error(errorMessage));
      
      const { signInAnonymously } = useAuthStore.getState();
      
      await expect(signInAnonymously()).rejects.toThrow(errorMessage);
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('signInWithEmail', () => {
    it('should sign in with email successfully', async () => {
      const mockUser = { 
        id: 'user123', 
        displayName: 'Test User', 
        email: 'test@example.com',
        joinedRooms: [],
        lastActive: new Date(),
        createdAt: new Date()
      };
      mockAuthService.signInWithEmail.mockResolvedValue(mockUser);
      
      const { signInWithEmail } = useAuthStore.getState();
      
      await signInWithEmail('test@example.com', 'password123');
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.userId).toBe('user123');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle timeout', async () => {
      // Make AuthService.signInWithEmail hang
      mockAuthService.signInWithEmail.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 35000))
      );
      
      const { signInWithEmail } = useAuthStore.getState();
      
      await expect(signInWithEmail('test@example.com', 'password123')).rejects.toThrow('Request timeout');
    }, 35000);
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      // Set up initial user state
      const mockUser = { 
        id: 'user123', 
        displayName: 'Test User', 
        email: 'test@example.com',
        joinedRooms: [],
        lastActive: new Date(),
        createdAt: new Date()
      };
      useAuthStore.getState().setUser(mockUser);
      
      mockAuthService.signOut.mockResolvedValue();
      
      const { signOut } = useAuthStore.getState();
      
      await signOut();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.forceAuthScreen).toBe(false);
    });
  });
});