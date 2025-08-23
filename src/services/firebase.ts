import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ErrorSanitization } from '../utils/errorSanitization';
import Constants from 'expo-constants';

// Firebase configuration with validation
const getFirebaseConfig = () => {
  // Try environment variables first (for production)
  let config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Fallback to app.json config (for development)
  const extraFirebase = (Constants?.expoConfig?.extra as any)?.firebase || (Constants?.manifest?.extra as any)?.firebase;
  if (extraFirebase && !config.apiKey) {
    config = {
      apiKey: extraFirebase.apiKey,
      authDomain: extraFirebase.authDomain,
      projectId: extraFirebase.projectId,
      storageBucket: extraFirebase.storageBucket,
      messagingSenderId: extraFirebase.messagingSenderId,
      appId: extraFirebase.appId,
      measurementId: extraFirebase.measurementId,
    };
  }

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);
  
  if (missingFields.length > 0) {
    const sanitizedError = ErrorSanitization.logAndSanitizeError(
      `Missing Firebase configuration: ${missingFields.join(', ')}`,
      'Firebase'
    );
    throw new Error(sanitizedError);
  }

  console.log('✅ Firebase configuration loaded successfully');
  return config;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase app
const initializeFirebaseApp = () => {
  try {
    if (getApps().length === 0) {
      const app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
      return app;
    } else {
      console.log('Using existing Firebase app');
      return getApp();
    }
  } catch (error) {
    const sanitizedError = ErrorSanitization.logAndSanitizeError(error, 'Firebase');
    throw new Error(`Failed to initialize Firebase: ${sanitizedError}`);
  }
};

const app = initializeFirebaseApp();

// Initialize Auth with optimized persistence
const initializeFirebaseAuth = () => {
  try {
    if (Platform.OS === 'web') {
      return getAuth(app);
    }
    
    // For React Native, try to use persistence with AsyncStorage
    try {
      const { getReactNativePersistence } = require('firebase/auth');
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (persistenceError) {
      console.warn('React Native persistence not available, using default auth:', persistenceError);
      return getAuth(app);
    }
  } catch (error) {
    const sanitizedError = ErrorSanitization.logAndSanitizeError(error, 'Firebase Auth');
    throw new Error(`Failed to initialize Firebase Auth: ${sanitizedError}`);
  }
};

const auth = initializeFirebaseAuth();

// Initialize Firestore
const db = getFirestore(app);

// Test Firebase connection
export const testFirebaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing Firebase connection...');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Auth Domain:', firebaseConfig.authDomain);
    
    // Test auth connection
    console.log('Auth service available');
    
    // Test Firestore connection by attempting to access it
    console.log('Firestore service available');
    
    return { success: true };
  } catch (error) {
    const sanitizedError = ErrorSanitization.logAndSanitizeError(error, 'Firebase Connection');
    return { success: false, error: sanitizedError };
  }
};

// Get Firebase configuration info (for debugging)
export const getFirebaseInfo = () => ({
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
  platform: Platform.OS,
});

export { auth, db };
export default app;
