# SwipeDish API & Services Documentation

This document provides comprehensive documentation for all external APIs and services used in SwipeDish, including setup instructions, usage patterns, and troubleshooting.

## 📋 Table of Contents

- [Overview](#overview)
- [Yelp Fusion API](#yelp-fusion-api)
- [Firebase Services](#firebase-services)
- [Google Services](#google-services)
- [Authentication Flow](#authentication-flow)
- [Real-time Data](#real-time-data)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## 🌐 Overview

SwipeDish integrates with several external services to provide comprehensive restaurant discovery and social features:

| Service                | Purpose                  | Required    | Fallback            |
| ---------------------- | ------------------------ | ----------- | ------------------- |
| **Yelp Fusion API**    | Restaurant data & search | ✅ Yes      | Local fallback data |
| **Firebase Auth**      | User authentication      | ✅ Yes      | Anonymous auth      |
| **Firebase Firestore** | Real-time database       | ✅ Yes      | Local storage only  |
| **Google Maps API**    | Maps & directions        | ❌ Optional | Apple Maps fallback |
| **Google Sign-In**     | Social authentication    | ❌ Optional | Email/password auth |

## 🍽️ Yelp Fusion API

### Setup & Configuration

1. **Create Yelp Developer Account**
   - Visit [Yelp Developers](https://www.yelp.com/developers)
   - Create a new app to get your API key
   - Add to `.env`: `EXPO_PUBLIC_YELP_API_KEY=your_api_key`

2. **Rate Limits**
   - Free tier: 5,000 requests/day
   - Rate limit: 5,000 requests per hour
   - Burst limit: 25 requests per second

### API Integration (`yelpService.ts`)

#### Search Restaurants

```typescript
interface YelpSearchParams {
  latitude: number;
  longitude: number;
  radius?: number; // Max 40,000 meters
  categories?: string; // 'restaurants,food'
  price?: string; // '1,2,3,4'
  limit?: number; // Max 50
  sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance';
  open_now?: boolean;
}

// Usage
const restaurants = await YelpService.searchRestaurants({
  latitude: 40.7128,
  longitude: -74.006,
  radius: 8000,
  categories: 'restaurants',
  limit: 50,
  sort_by: 'best_match',
});
```

#### Business Details

```typescript
const businessDetails = await YelpService.getBusinessDetails('yelp-business-id');
```

#### Data Transformation

```typescript
// Yelp data is transformed to internal FoodCard format
const transformYelpToFoodCard = (business: YelpBusiness): FoodCard => ({
  id: business.id,
  type: 'restaurant',
  title: business.name,
  subtitle: business.categories?.[0]?.title || 'Restaurant',
  description: business.categories?.map(cat => cat.title).join(', ') || '',
  imageUrl: business.image_url || DEFAULT_IMAGE,
  rating: business.rating,
  reviewCount: business.review_count,
  priceRange: business.price || '$$',
  distance: business.distance ? Math.round((business.distance / 1609.34) * 10) / 10 : undefined,
  location: {
    latitude: business.coordinates.latitude,
    longitude: business.coordinates.longitude,
  },
  address: business.location.display_address.join(', '),
  phone: business.phone,
  isOpen: !business.is_closed,
  url: business.url,
  photos: business.photos || [],
});
```

### Error Handling

```typescript
// Common Yelp API errors
const handleYelpError = (error: any): string => {
  switch (error.response?.status) {
    case 400:
      return 'Invalid search parameters';
    case 401:
      return 'Invalid API key';
    case 403:
      return 'API key permissions insufficient';
    case 429:
      return 'Rate limit exceeded';
    case 500:
      return 'Yelp service temporarily unavailable';
    default:
      return 'Restaurant search failed';
  }
};
```

### Caching Strategy

```typescript
// Location-based caching with TTL
interface CachedRestaurants {
  data: FoodCard[];
  timestamp: number;
  location: Location;
  ttl: number;
}

const CACHE_TTL = 300000; // 5 minutes
const CACHE_RADIUS = 1000; // 1km radius for cache hits

// Cache key generation
const getCacheKey = (location: Location, filters?: RestaurantFilters): string => {
  const lat = Math.round(location.latitude * 1000) / 1000;
  const lng = Math.round(location.longitude * 1000) / 1000;
  const filtersKey = filters ? JSON.stringify(filters) : 'default';
  return `restaurants_${lat}_${lng}_${filtersKey}`;
};
```

## 🔥 Firebase Services

### Setup & Configuration

1. **Create Firebase Project**

   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools

   # Login and init project
   firebase login
   firebase init
   ```

2. **Environment Variables**
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### Authentication Service

#### Configuration (`authService.ts`)

```typescript
// Email/Password Authentication
export class AuthService {
  static async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return this.transformFirebaseUser(credential.user);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static async signUpWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile
      await updateProfile(credential.user, { displayName });

      // Create user document in Firestore
      await this.createUserDocument(credential.user.uid, {
        displayName,
        email,
        createdAt: new Date(),
      });

      return this.transformFirebaseUser(credential.user);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }
}
```

#### Error Handling

```typescript
private static handleAuthError(error: any): Error {
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };

  const message = errorMessages[error.code] || 'Authentication failed. Please try again.';
  return new Error(message);
}
```

### Firestore Database

#### Collection Structure

```typescript
// Database Schema
interface DatabaseSchema {
  users: {
    [userId: string]: {
      displayName: string;
      email: string | null;
      joinedRooms: string[];
      lastActive: Timestamp;
      createdAt: Timestamp;
      preferences?: UserPreferences;
    };
  };

  rooms: {
    [roomId: string]: {
      id: string;
      pin: string;
      name: string;
      createdBy: string;
      members: RoomMember[];
      currentCardIndex: number;
      isActive: boolean;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    };
  };

  matches: {
    [matchId: string]: {
      id: string;
      roomId: string;
      restaurantId: string;
      restaurantData: FoodCard;
      members: string[];
      createdAt: Timestamp;
      viewedBy: string[];
    };
  };

  swipes: {
    [swipeId: string]: {
      userId: string;
      roomId: string;
      cardId: string;
      action: 'like' | 'dislike' | 'superlike';
      timestamp: Timestamp;
    };
  };
}
```

#### Real-time Listeners (`roomService.ts`)

```typescript
export class RoomService {
  // Listen to room updates
  static listenToRoom(roomId: string, callback: (room: Room | null) => void): () => void {
    const unsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
      doc => {
        if (doc.exists()) {
          const room = { id: doc.id, ...doc.data() } as Room;
          callback(room);
        } else {
          callback(null);
        }
      },
      error => {
        logger.error('Room listener error', 'FIRESTORE', { error, roomId });
        callback(null);
      }
    );

    return unsubscribe;
  }

  // Listen to matches
  static listenToMatches(roomId: string, callback: (matches: Match[]) => void): () => void {
    const q = query(
      collection(db, 'matches'),
      where('roomId', '==', roomId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, snapshot => {
      const matches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];

      callback(matches);
    });
  }
}
```

#### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Room members can read/write room data
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        (request.auth.uid == resource.data.createdBy ||
         request.auth.uid in resource.data.memberIds);
    }

    // Swipes can be created by authenticated users
    match /swipes/{swipeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // Matches readable by room members
    match /matches/{matchId} {
      allow read: if request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/rooms/$(resource.data.roomId)).data.memberIds;
    }
  }
}
```

## 🗺️ Google Services

### Google Maps API

#### Setup

1. Enable APIs in Google Cloud Console:
   - Maps JavaScript API
   - Places API (optional)
   - Directions API (optional)

2. Environment Configuration:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
   ```

#### Implementation (`mapService.ts`)

```typescript
export class MapService {
  static openInGoogleMaps(latitude: number, longitude: number): void {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  static openDirections(fromLat: number, fromLng: number, toLat: number, toLng: number): void {
    const url = `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
    Linking.openURL(url);
  }

  static async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch place details');
    }

    return response.json();
  }
}
```

### Google Sign-In

#### Setup

```typescript
// Configure Google Sign-In
export class GoogleSignInService {
  static async initialize(): Promise<void> {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    if (!webClientId) {
      throw new Error('Google Web Client ID not configured');
    }

    await GoogleSignin.configure({
      webClientId,
      offlineAccess: true,
    });
  }

  static async signIn(): Promise<{ idToken: string; user: any }> {
    await this.initialize();

    const userInfo = await GoogleSignin.signIn();
    return {
      idToken: userInfo.idToken,
      user: userInfo.user,
    };
  }
}
```

#### Integration with Firebase Auth

```typescript
const signInWithGoogle = async (): Promise<User> => {
  try {
    const { idToken } = await GoogleSignInService.signIn();

    // Create Firebase credential
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase
    const result = await signInWithCredential(auth, credential);

    return transformFirebaseUser(result.user);
  } catch (error) {
    throw new Error('Google sign-in failed');
  }
};
```

## 🔐 Authentication Flow

### Complete Auth Flow

```typescript
// Authentication state machine
enum AuthState {
  INITIAL = 'initial',
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error',
}

// Auth store implementation
export const useAuthStore = create<AuthState>((set, get) => ({
  state: AuthState.INITIAL,
  user: null,
  error: null,

  // Initialize auth listener
  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        const user = transformFirebaseUser(firebaseUser);
        set({ state: AuthState.AUTHENTICATED, user, error: null });
      } else {
        set({ state: AuthState.UNAUTHENTICATED, user: null, error: null });
      }
    });

    return unsubscribe;
  },

  // Sign in methods
  signInWithEmail: async (email: string, password: string) => {
    set({ state: AuthState.LOADING, error: null });
    try {
      const user = await AuthService.signInWithEmail(email, password);
      set({ state: AuthState.AUTHENTICATED, user, error: null });
    } catch (error) {
      set({ state: AuthState.ERROR, error: error.message, user: null });
      throw error;
    }
  },

  // Other auth methods...
}));
```

## 📡 Real-time Data

### Firestore Real-time Updates

```typescript
// Room synchronization pattern
class RoomSyncManager {
  private listeners = new Map<string, () => void>();

  subscribeToRoom(roomId: string, callback: (room: Room) => void): void {
    // Unsubscribe existing listener
    this.unsubscribeFromRoom(roomId);

    // Create new listener
    const unsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
      doc => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as Room);
        }
      },
      error => {
        logger.error('Room subscription error', 'FIRESTORE', { error, roomId });
      }
    );

    // Store cleanup function
    this.listeners.set(roomId, unsubscribe);
  }

  unsubscribeFromRoom(roomId: string): void {
    const unsubscribe = this.listeners.get(roomId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(roomId);
    }
  }

  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
```

### Match Detection Algorithm

```typescript
// Server-side match detection (Cloud Function)
export const detectMatch = functions.firestore
  .document('swipes/{swipeId}')
  .onCreate(async (snap, context) => {
    const swipe = snap.data();
    const { roomId, cardId, action, userId } = swipe;

    if (action !== 'like') return; // Only check likes

    // Get room data
    const roomDoc = await admin.firestore().collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) return;

    const room = roomDoc.data() as Room;

    // Get all swipes for this card in this room
    const swipesQuery = await admin
      .firestore()
      .collection('swipes')
      .where('roomId', '==', roomId)
      .where('cardId', '==', cardId)
      .where('action', '==', 'like')
      .get();

    const likedByUsers = new Set(swipesQuery.docs.map(doc => doc.data().userId));
    const roomMemberIds = new Set(room.members.map(member => member.userId));

    // Check if all room members have liked this card
    const allMembersLiked = room.members.every(member => likedByUsers.has(member.userId));

    if (allMembersLiked) {
      // Create match document
      await admin
        .firestore()
        .collection('matches')
        .add({
          roomId,
          cardId,
          restaurantData: swipe.restaurantData,
          members: Array.from(roomMemberIds),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          viewedBy: [],
        });

      logger.log('Match created', { roomId, cardId, members: roomMemberIds.size });
    }
  });
```

## ❌ Error Handling

### Centralized Error Handling

```typescript
export class APIErrorHandler {
  static handle(error: any, context: string): Error {
    // Log error for development/debugging
    if (__DEV__) {
      console.error(`${context} Error:`, error);
    }

    // Analytics tracking
    analyticsService.trackEvent(AnalyticsEvent.API_CALL_ERROR, {
      context,
      error: error.message,
      stack: error.stack,
    });

    // Return user-friendly error
    return new Error(this.getUserFriendlyMessage(error, context));
  }

  private static getUserFriendlyMessage(error: any, context: string): string {
    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
      return 'Network connection error. Please check your internet and try again.';
    }

    // API-specific errors
    if (context === 'YELP_API') {
      return this.getYelpErrorMessage(error);
    }

    if (context === 'FIREBASE') {
      return this.getFirebaseErrorMessage(error);
    }

    // Generic fallback
    return 'Something went wrong. Please try again later.';
  }

  private static getYelpErrorMessage(error: any): string {
    switch (error.response?.status) {
      case 429:
        return 'Too many requests. Please try again in a few minutes.';
      case 401:
        return 'Service configuration error. Please contact support.';
      case 500:
        return 'Restaurant service temporarily unavailable.';
      default:
        return 'Failed to load restaurants. Please try again.';
    }
  }
}
```

### Retry Logic

```typescript
export class RetryManager {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (400-499)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = delayMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}
```

## ⏱️ Rate Limiting

### Yelp API Rate Limiting

```typescript
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

    // Check if we've hit the limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        logger.info('Rate limit reached, waiting', 'RATE_LIMITER', { waitTime });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record this request
    this.requests.push(now);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const recentRequests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    ).length;

    return Math.max(0, this.maxRequests - recentRequests);
  }
}

// Usage in YelpService
const rateLimiter = new RateLimiter(5000, 3600000); // 5000 requests/hour

export class YelpService {
  static async searchRestaurants(params: YelpSearchParams): Promise<YelpBusiness[]> {
    await rateLimiter.waitIfNeeded();

    // Make API request...
  }
}
```

---

This documentation provides comprehensive coverage of all external APIs and services used in SwipeDish. For implementation details, refer to the respective service files in `/src/services/`.
