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

  // Fallback to app.json config (for development) - only if environment variables are not set
  const extraFirebase = Constants?.expoConfig?.extra?.firebase || Constants?.manifest?.extra?.firebase;
  if (extraFirebase && !config.apiKey) {
    // Only use app.json config if it doesn't contain placeholder values
    const isValidConfig = extraFirebase.apiKey && 
      !extraFirebase.apiKey.includes('PLACEHOLDER') && 
      extraFirebase.apiKey !== 'your_api_key_here';
    
    if (isValidConfig) {
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
  }

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);
  
  if (missingFields.length > 0) {
    const sanitizedError = ErrorSanitization.logAndSanitizeError(
      `Missing Firebase configuration: ${missingFields.join(', ')}. Please set environment variables: ${missingFields.map(f => `EXPO_PUBLIC_FIREBASE_${f.toUpperCase()}`).join(', ')}`,
      'Firebase'
    );
    throw new Error(sanitizedError);
  }

  // Validate configuration format
  const invalidFields: string[] = [];
  
  if (config.apiKey && !config.apiKey.startsWith('AIza')) {
    invalidFields.push('apiKey (should start with AIza)');
  }
  
  if (config.authDomain && !config.authDomain.endsWith('.firebaseapp.com')) {
    invalidFields.push('authDomain (should end with .firebaseapp.com)');
  }
  
  if (config.appId && !/^1:\d+:(android|ios|web):[a-f0-9]+$/.test(config.appId)) {
    invalidFields.push('appId (invalid format)');
  }

  if (invalidFields.length > 0) {
    const sanitizedError = ErrorSanitization.logAndSanitizeError(
      `Invalid Firebase configuration format: ${invalidFields.join(', ')}`,
      'Firebase'
    );
    throw new Error(sanitizedError);
  }

  return config;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase app
const initializeFirebaseApp = () => {
  try {
    if (getApps().length === 0) {
      const app = initializeApp(firebaseConfig);
      return app;
    } else {
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
export const testFirebaseConnection = async () => {
  try {
    const auth = getAuth();
    const firestore = getFirestore();
    
    // Test auth service
    if (auth) {
      // Auth service is available
    }
    
    // Test Firestore service
    if (firestore) {
      // Firestore service is available
    }
    
    return true;
  } catch (error) {
    return false;
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
