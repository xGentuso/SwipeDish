// This wrapper prevents the Google Sign-In module from being imported in Expo Go
// which causes the native module error

let GoogleSigninModule: any = null;
let isModuleLoaded = false;

export const loadGoogleSignInModule = async () => {
  if (isModuleLoaded) {
    return GoogleSigninModule;
  }

  // Check if we're in Expo Go
  const isExpoGo = __DEV__ && !global.__EXPO_NATIVE__;
  
  if (isExpoGo) {
    isModuleLoaded = true;
    return null;
  }

  try {
    // Only import the module if we're not in Expo Go
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    GoogleSigninModule = GoogleSignin;
    isModuleLoaded = true;
    return GoogleSigninModule;
  } catch (error) {
    console.warn('⚠️ Failed to load Google Sign-In module:', error);
    isModuleLoaded = true;
    return null;
  }
};

export const isGoogleSignInAvailable = () => {
  const isExpoGo = __DEV__ && !global.__EXPO_NATIVE__;
  return !isExpoGo && isModuleLoaded && GoogleSigninModule !== null;
};
