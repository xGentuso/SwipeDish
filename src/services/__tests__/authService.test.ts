import { AuthService } from '../authService';
import { ValidationError } from '../../utils/inputValidation';
import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, setDoc, getDocs } from 'firebase/firestore';

jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../loggingService', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }
}));

const mockSignInAnonymously = signInAnonymously as jest.MockedFunction<typeof signInAnonymously>;
const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>;
const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rate limiting
    (AuthService as any).anonymousSignUpCount = 0;
    (AuthService as any).lastAnonymousSignUp = 0;
  });

  describe('signInAnonymously', () => {
    it('should sign in anonymously and create user document', async () => {
      const mockUser = {
        user: { uid: 'test-uid-123' }
      };
      
      mockSignInAnonymously.mockResolvedValue(mockUser as any);
      mockGetDocs.mockResolvedValue({ empty: true } as any);
      mockSetDoc.mockResolvedValue(undefined as any);

      const result = await AuthService.signInAnonymously();

      expect(mockSignInAnonymously).toHaveBeenCalledWith(expect.anything());
      expect(mockSetDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'test-uid-123',
        joinedRooms: [],
        hasCompletedOnboarding: false,
      });
      expect(result.displayName).toMatch(/^User\d{4}$/);
    });

    it('should enforce rate limiting for anonymous sign-ups', async () => {
      // Simulate reaching rate limit
      for (let i = 0; i < 10; i++) {
        await AuthService.signInAnonymously().catch(() => {}); // Ignore errors for setup
      }

      // This should fail due to rate limiting
      await expect(AuthService.signInAnonymously()).rejects.toThrow(
        'Too many anonymous sign-ups. Please try again later.'
      );
    });
  });

  describe('signUpWithEmail', () => {
    it('should create user with valid email and password', async () => {
      const mockUser = {
        user: { uid: 'test-uid-123' }
      };
      
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUser as any);
      mockGetDocs.mockResolvedValue({ empty: true } as any); // Username is unique
      mockSetDoc.mockResolvedValue(undefined as any);

      const result = await AuthService.signUpWithEmail(
        'test@example.com',
        'password123',
        'TestUser'
      );

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result.email).toBe('test@example.com');
      expect(result.displayName).toBe('TestUser');
    });

    it('should validate email format', async () => {
      await expect(
        AuthService.signUpWithEmail('invalid-email', 'password123', 'TestUser')
      ).rejects.toThrow(ValidationError);
    });

    it('should validate password length', async () => {
      await expect(
        AuthService.signUpWithEmail('test@example.com', '123', 'TestUser')
      ).rejects.toThrow(ValidationError);
    });

    it('should validate display name format', async () => {
      await expect(
        AuthService.signUpWithEmail('test@example.com', 'password123', 'Invalid<Name>')
      ).rejects.toThrow(ValidationError);
    });

    it('should check username uniqueness', async () => {
      mockGetDocs.mockResolvedValue({ empty: false } as any); // Username exists

      await expect(
        AuthService.signUpWithEmail('test@example.com', 'password123', 'ExistingUser')
      ).rejects.toThrow('Display name already exists');
    });
  });

  describe('signInWithEmail', () => {
    it('should sign in with valid credentials', async () => {
      const mockUser = {
        user: { uid: 'test-uid-123' }
      };
      const mockUserData = {
        id: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'TestUser',
      };

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUser as any);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      const result = await AuthService.signInWithEmail('test@example.com', 'password123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toMatchObject(mockUserData);
    });

    it('should validate email format on sign in', async () => {
      await expect(
        AuthService.signInWithEmail('invalid-email', 'password123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if user document not found', async () => {
      const mockUser = {
        user: { uid: 'test-uid-123' }
      };

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUser as any);
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(
        AuthService.signInWithEmail('test@example.com', 'password123')
      ).rejects.toThrow('User not found');
    });
  });

  describe('isUsernameUnique', () => {
    it('should return true for unique username', async () => {
      mockGetDocs.mockResolvedValue({ empty: true } as any);

      const result = await AuthService.isUsernameUnique('UniqueUser');

      expect(result).toBe(true);
    });

    it('should return false for existing username', async () => {
      mockGetDocs.mockResolvedValue({ empty: false } as any);

      const result = await AuthService.isUsernameUnique('ExistingUser');

      expect(result).toBe(false);
    });

    it('should return true on error (fail open)', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.isUsernameUnique('TestUser');

      expect(result).toBe(true);
    });
  });

  describe('generateUniqueUsername', () => {
    it('should generate unique username with base name', async () => {
      mockGetDocs.mockResolvedValue({ empty: true } as any);

      const result = await AuthService.generateUniqueUsername('TestBase');

      expect(result).toMatch(/^TestBase\d{4}$/);
    });

    it('should retry if username exists', async () => {
      mockGetDocs
        .mockResolvedValueOnce({ empty: false } as any) // First attempt fails
        .mockResolvedValueOnce({ empty: true } as any); // Second attempt succeeds

      const result = await AuthService.generateUniqueUsername('TestBase');

      expect(result).toMatch(/^TestBase\d{4}$/);
      expect(mockGetDocs).toHaveBeenCalledTimes(2);
    });

    it('should use timestamp fallback after max attempts', async () => {
      mockGetDocs.mockResolvedValue({ empty: false } as any); // Always fails

      const result = await AuthService.generateUniqueUsername('TestBase');

      expect(result).toMatch(/^TestBase\d{13}$/); // Timestamp has 13 digits
    });
  });
});