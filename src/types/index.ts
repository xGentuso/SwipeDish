// User Types
export interface User {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  joinedRooms: string[];
  lastActive: Date;
  createdAt: Date;
  hasCompletedOnboarding?: boolean;
}

// Room Types
export interface Room {
  id: string;
  pin: string;
  name: string;
  createdBy: string;
  members: RoomMember[];
  currentCardIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomMember {
  userId: string;
  displayName: string;
  joinedAt: Date;
  isActive: boolean;
  currentSwipe?: SwipeAction;
}

// Swipe Types
export type SwipeAction = 'like' | 'dislike' | 'superlike';

export interface Swipe {
  id: string;
  roomId: string;
  userId: string;
  cardId: string;
  action: SwipeAction;
  timestamp: Date;
}



// Card Types
export interface FoodCard {
  id: string;
  type: 'restaurant' | 'dish' | 'deal';
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  rating?: number;
  price?: string;
  cuisine?: string;
  distance?: number;
  deliveryTime?: number;
  // Enriched details
  isOpen?: boolean;
  userRatingsTotal?: number;
  // Service availability
  services?: {
    takeout?: boolean;
    delivery?: boolean;
    dineIn?: boolean;
    pickup?: boolean;
  };
  tags: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  externalLinks?: {
    menu?: string;
    delivery?: string;
    reservation?: string;
    website?: string;
    googleMaps?: string;
  };
  // Contact information
  phone?: string;

  
  // Recommendation fields (simplified from AI)
  recommendationScore?: number;
  recommendationReason?: string;
}

// Match Types
export interface Match {
  id: string;
  roomId: string;
  cardId: string;
  matchedAt: Date;
  members: string[];
  isViewed: boolean;
}

// Navigation Types
export type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  Matches: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  RoomJoin: undefined;
  RoomCreate: undefined;
  MatchScreen: { match: Match };
  Settings: undefined;
};

// Firebase Types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// App State Types
export interface AppState {
  user: User | null;
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
