import { 
  signInAnonymously, 
  signInWithPhoneNumber, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';
import { InputValidation, ValidationError } from '../utils/inputValidation';
import { GoogleSignInService } from './googleSignInService';
import { logger } from './loggingService';

export class AuthService {
  // Rate limiting for anonymous sign-ups
  private static anonymousSignUpCount = 0;
  private static lastAnonymousSignUp = 0;
  private static readonly ANONYMOUS_RATE_LIMIT = 10; // 10 per minute
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute

  // Google Sign-In configuration is now handled by GoogleSignInService

  /**
   * Check if username is unique
   */
  static async isUsernameUnique(displayName: string): Promise<boolean> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('displayName', '==', displayName)
      );
      const querySnapshot = await getDocs(usersQuery);
      return querySnapshot.empty;
    } catch (error) {
      logger.error('Username uniqueness check error', 'AUTH', { error });
      // In case of error, allow the username (fail open) but log for debugging
      return true;
    }
  }

  /**
   * Generate unique username
   */
  static async generateUniqueUsername(baseName: string = 'User'): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${baseName}${randomSuffix}`;
      
      if (await this.isUsernameUnique(username)) {
        return username;
      }
      attempts++;
    }

    // Fallback with timestamp if all attempts failed
    return `${baseName}${Date.now()}`;
  }

  /**
   * Check rate limiting for anonymous sign-ups
   */
  private static checkAnonymousRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter if window expired
    if (now - this.lastAnonymousSignUp > this.RATE_LIMIT_WINDOW) {
      this.anonymousSignUpCount = 0;
    }

    // Check if limit exceeded
    if (this.anonymousSignUpCount >= this.ANONYMOUS_RATE_LIMIT) {
      return false;
    }

    this.anonymousSignUpCount++;
    this.lastAnonymousSignUp = now;
    return true;
  }

  static async signInAnonymously(): Promise<User> {
    try {
      // Check rate limiting
      if (!this.checkAnonymousRateLimit()) {
        throw new ValidationError('Too many anonymous sign-ups. Please try again later.');
      }

      const result = await signInAnonymously(auth);
      
      // Generate unique username
      const uniqueUsername = await this.generateUniqueUsername();
      
      const user: User = {
        id: result.user.uid,
        displayName: uniqueUsername,
        joinedRooms: [],
        lastActive: new Date(),
        createdAt: new Date(),
        hasCompletedOnboarding: false,
      };
      
      await setDoc(doc(db, 'users', user.id), {
        ...user,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });
      
      return user;
    } catch (error) {
      logger.error('Anonymous sign in error', 'AUTH', { error });
      throw error;
    }
  }

  static async signInWithPhone(phoneNumber: string, verificationCode: string): Promise<User> {
    try {
      // This would require additional setup with Firebase Phone Auth
      // For now, we'll use anonymous auth
      return await this.signInAnonymously();
    } catch (error) {
      logger.error('Phone sign in error', 'AUTH', { error });
      throw error;
    }
  }

  static async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      // Validate email format
      if (!InputValidation.validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      if (!password || password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as User;
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      logger.error('Email sign in error', 'AUTH', { error });
      throw error;
    }
  }

  static async signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
    try {
      // Validate inputs
      if (!InputValidation.validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      if (!password || password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      if (!InputValidation.validateDisplayName(displayName)) {
        throw new ValidationError('Invalid display name. Only alphanumeric characters, spaces, hyphens, and underscores allowed. Max 50 characters.');
      }

      // Check username uniqueness
      if (!(await this.isUsernameUnique(displayName))) {
        throw new ValidationError('Display name already exists. Please choose a different one.');
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
              const user: User = {
          id: result.user.uid,
          displayName: InputValidation.sanitizeString(displayName),
          email: email.toLowerCase().trim(),
          joinedRooms: [],
          lastActive: new Date(),
          createdAt: new Date(),
          hasCompletedOnboarding: false,
        };
      
      await setDoc(doc(db, 'users', user.id), {
        ...user,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });
      
      return user;
    } catch (error) {
      logger.error('Email sign up error', 'AUTH', { error });
      throw error;
    }
  }

  static async signInWithGoogle(): Promise<User> {
    try {
      // Use the Google Sign-In service
      const { idToken, serverAuthCode } = await GoogleSignInService.signIn();
      
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(
        idToken,
        serverAuthCode
      );

      // Sign-in the user with the credential
      const result = await signInWithCredential(auth, googleCredential);
      
      // Check if user document exists
      const existingUserDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (existingUserDoc.exists()) {
        return existingUserDoc.data() as User;
      } else {
        // Create new user document
        const displayName = result.user.displayName || 'Google User';
        
        // Ensure username is unique
        const uniqueDisplayName = await this.isUsernameUnique(displayName) 
          ? displayName 
          : await this.generateUniqueUsername(displayName.split(' ')[0] || 'User');
        
        const user: User = {
          id: result.user.uid,
          displayName: uniqueDisplayName,
          ...(result.user.email && { email: result.user.email }),
          ...(result.user.photoURL && { photoURL: result.user.photoURL }),
          joinedRooms: [],
          lastActive: new Date(),
          createdAt: new Date(),
          hasCompletedOnboarding: false,
        };
        
        await setDoc(doc(db, 'users', user.id), {
          ...user,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        });
        
        return user;
      }
    } catch (error: any) {
      logger.error('Google sign in error', 'AUTH', { error });
      
      // Handle specific Google Sign-In errors
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new ValidationError('An account already exists with this email. Please sign in with your existing method.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new ValidationError('Invalid Google credentials. Please try again.');
      }
      
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      logger.error('Sign out error', 'AUTH', { error });
      throw error;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      // Validate user ID
      if (!InputValidation.validateUserId(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      // Validate updates
      const sanitizedUpdates: Partial<User> = {};
      
      if (updates.displayName !== undefined) {
        if (!InputValidation.validateDisplayName(updates.displayName)) {
          throw new ValidationError('Invalid display name');
        }
        
        // Check uniqueness if display name is being changed
        if (!(await this.isUsernameUnique(updates.displayName))) {
          throw new ValidationError('Display name already exists');
        }
        
        sanitizedUpdates.displayName = InputValidation.sanitizeString(updates.displayName);
      }

      if (updates.email !== undefined) {
        if (!InputValidation.validateEmail(updates.email)) {
          throw new ValidationError('Invalid email format');
        }
        sanitizedUpdates.email = updates.email.toLowerCase().trim();
      }

      // Copy other safe fields
      if (updates.photoURL !== undefined) sanitizedUpdates.photoURL = updates.photoURL;
      if (updates.joinedRooms !== undefined) sanitizedUpdates.joinedRooms = updates.joinedRooms;

      await updateDoc(doc(db, 'users', userId), {
        ...sanitizedUpdates,
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Update user profile error', 'AUTH', { error });
      throw error;
    }
  }

  static async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        // Ensure hasCompletedOnboarding has a default value for existing users
        return {
          ...userData,
          hasCompletedOnboarding: userData.hasCompletedOnboarding ?? false,
        };
      }
      return null;
    } catch (error) {
      logger.error('Get user error', 'AUTH', { error });
      throw error;
    }
  }

  static async markOnboardingComplete(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        hasCompletedOnboarding: true,
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Mark onboarding complete error', 'AUTH', { error });
      throw error;
    }
  }

  static onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}
