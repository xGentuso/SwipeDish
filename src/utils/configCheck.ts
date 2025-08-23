import { GoogleSignInService } from '../services/googleSignInService';

export const checkConfiguration = () => {
  const config = {
    firebase: {
      apiKey: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      appId: !!process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
    googleSignIn: {
      webClientId: !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    },
    yelp: {
      apiKey: !!process.env.EXPO_PUBLIC_YELP_API_KEY,
    },
  };

  const allConfigured = Object.values(config).every(service => 
    Object.values(service).every(Boolean)
  );

  if (!allConfigured) {
    console.warn('⚠️ Some services are missing configuration');
  }

  return config;
};
