import { Platform } from 'react-native';
import { loadGoogleSignInModule, isGoogleSignInAvailable } from './googleSignInWrapper';
import { logger } from './loggingService';

export class GoogleSignInService {
  private static isInitialized = false;
  private static isAvailable = false;
  private static GoogleSignin: any = null;

  static async initialize() {
    if (this.isInitialized) return;

    try {
      // Load the module using the wrapper
      this.GoogleSignin = await loadGoogleSignInModule();
      
      if (!this.GoogleSignin) {
        this.isInitialized = true;
        this.isAvailable = false;
        return;
      }

      // Get web client ID from environment variables only
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      
      if (!webClientId) {
        logger.warn('Google Web Client ID not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID environment variable.', 'GOOGLE_SIGNIN');
        this.isInitialized = true;
        this.isAvailable = false;
        return;
      }
      
      this.GoogleSignin.configure({
        webClientId,
        offlineAccess: true,
      });
      
      this.isInitialized = true;
      this.isAvailable = true;
    } catch (error) {
      logger.warn('Google Sign-In initialization failed', 'GOOGLE_SIGNIN', { error });
      this.isInitialized = true;
      this.isAvailable = false;
    }
  }

  static async signIn() {
    try {
      await this.initialize();
      
      if (!this.isAvailable || !this.GoogleSignin) {
        throw new Error('Google Sign-In is not available in this environment. Please use a development build or physical device.');
      }
      
      // Check if device supports Google Play (Android only)
      if (Platform.OS === 'android') {
        await this.GoogleSignin.hasPlayServices();
      }
      
      // Get the users ID token
      const userInfo = await this.GoogleSignin.signIn();
      
      return {
        idToken: userInfo.idToken,
        serverAuthCode: userInfo.serverAuthCode,
      };
    } catch (error: any) {
      logger.error('Google Sign-In error', 'GOOGLE_SIGNIN', { error });
      throw error;
    }
  }

  static async signOut() {
    try {
      await this.initialize();
      
      if (!this.isAvailable || !this.GoogleSignin) {
        return;
      }
      
      await this.GoogleSignin.signOut();
    } catch (error: any) {
      logger.error('Google Sign-Out error', 'GOOGLE_SIGNIN', { error });
      throw error;
    }
  }

  static isGoogleSignInAvailable() {
    return this.isAvailable && isGoogleSignInAvailable();
  }
}
