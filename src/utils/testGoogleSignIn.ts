import { loadGoogleSignInModule, isGoogleSignInAvailable } from '../services/googleSignInWrapper';

export const testGoogleSignInAvailability = async () => {
  try {
    const module = await loadGoogleSignInModule();
    const isAvailable = isGoogleSignInAvailable();
    
    return { module: !!module, isAvailable };
  } catch (error) {
    console.error('Error testing Google Sign-In:', error);
    return { module: false, isAvailable: false };
  }
};
