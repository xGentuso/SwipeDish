import { GoogleSignInService } from './googleSignInService';
import { checkConfiguration } from '../utils/configCheck';
import { testGoogleSignInAvailability } from '../utils/testGoogleSignIn';

export const initializeServices = async () => {
  try {
    // Check configuration first
    checkConfiguration();
    
    // Test Google Sign-In availability (non-blocking)
    try {
      await testGoogleSignInAvailability();
      await GoogleSignInService.initialize();
    } catch (googleError) {
      console.warn('Google Sign-In initialization failed (non-critical):', googleError);
    }
  } catch (error) {
    console.warn('⚠️ Service initialization warning:', error);
  }
};
