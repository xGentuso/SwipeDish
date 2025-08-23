import { GoogleSignInService } from './googleSignInService';
import { checkConfiguration, validateConfigurationStrict } from '../utils/configCheck';
import { testGoogleSignInAvailability } from '../utils/testGoogleSignIn';
import { logger } from './loggingService';

export const initializeServices = async () => {
  try {
    // Perform strict configuration validation first
    validateConfigurationStrict();
    
    // Check configuration status
    checkConfiguration();
    
    // Test Google Sign-In availability (non-blocking)
    try {
      await testGoogleSignInAvailability();
      await GoogleSignInService.initialize();
    } catch (googleError) {
      logger.warn('Google Sign-In initialization failed (non-critical)', 'INIT', { googleError });
    }
    
    logger.info('Service initialization completed successfully', 'INIT');
  } catch (error) {
    logger.error('Service initialization failed', 'INIT', { error });
    // Re-throw critical configuration errors
    if (error instanceof Error && error.message.includes('Configuration Error')) {
      throw error;
    }
  }
};
