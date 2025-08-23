import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { FoodCard } from '../types';

export interface SwipeContext {
  id?: string;
  userId: string;
  cardId: string;
  action: 'like' | 'dislike' | 'superlike';
  timestamp: Date;
  
  // Session Context
  sessionId: string;
  swipePosition: number; // Position in the current session
  sessionDuration: number; // How long user has been swiping
  
  // Card Context
  cardTitle: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  distance?: number;
  deliveryTime?: number;
  
  // User Context
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  weatherCondition?: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  
  // Behavioral Context
  swipeSpeed: number; // Time spent viewing card before swipe
  previousAction?: 'like' | 'dislike' | 'superlike'; // Previous swipe action
  consecutiveActions: number; // Streak of same action
  hesitation: boolean; // Did user pause before swiping
  
  // UI Context
  swipeMethod: 'gesture' | 'button'; // How user swiped
  cardPosition: 'first' | 'second' | 'third'; // Position in stack
  
  // Recommendation Context
  wasRecommended: boolean; // Was this card AI recommended
  recommendationReason?: string;
  recommendationScore?: number;
  
  // Additional metadata
  deviceType?: 'ios' | 'android';
  appVersion?: string;
  experimentGroup?: string; // For A/B testing
}

export interface SwipeSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  totalSwipes: number;
  likes: number;
  dislikes: number;
  superlikes: number;
  averageSwipeTime: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  context: {
    timeOfDay: string;
    dayOfWeek: string;
    weather?: string;
  };
}

export class SwipeTrackingService {
  private static currentSessionId: string | null = null;
  private static sessionStartTime: Date | null = null;
  private static swipeCount = 0;
  private static lastSwipeTime: Date | null = null;
  private static lastAction: 'like' | 'dislike' | 'superlike' | null = null;
  private static consecutiveCount = 0;

  // Initialize a new swipe session
  static startSession(userId: string, location?: { latitude: number; longitude: number }): string {
    this.currentSessionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = new Date();
    this.swipeCount = 0;
    this.lastSwipeTime = null;
    this.lastAction = null;
    this.consecutiveCount = 0;

    return this.currentSessionId;
  }

  // End current session
  static async endSession(): Promise<void> {
    if (!this.currentSessionId || !this.sessionStartTime) return;

    const endTime = new Date();
    const duration = endTime.getTime() - this.sessionStartTime.getTime();

    // Reset session variables
    this.currentSessionId = null;
    this.sessionStartTime = null;
    this.swipeCount = 0;
    this.lastSwipeTime = null;
    this.lastAction = null;
    this.consecutiveCount = 0;
  }

  // Track a swipe with rich context
  static async trackSwipe(
    userId: string,
    card: FoodCard,
    action: 'like' | 'dislike' | 'superlike',
    swipeMethod: 'gesture' | 'button' = 'gesture',
    cardViewTime?: number,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      const now = new Date();
      
      // Ensure we have a session
      if (!this.currentSessionId) {
        this.startSession(userId, userLocation);
      }

      // Calculate behavioral metrics
      const swipeSpeed = cardViewTime || (this.lastSwipeTime ? now.getTime() - this.lastSwipeTime.getTime() : 0);
      const hesitation = swipeSpeed > 5000; // More than 5 seconds considered hesitation
      
      // Update consecutive actions
      if (this.lastAction === action) {
        this.consecutiveCount++;
      } else {
        this.consecutiveCount = 1;
      }

      // Calculate session metrics
      const sessionDuration = this.sessionStartTime ? now.getTime() - this.sessionStartTime.getTime() : 0;
      this.swipeCount++;

      // Determine time context
      const hour = now.getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
      if (hour >= 5 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
      else timeOfDay = 'night';

      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

      // Create rich swipe context
      const swipeContext: Omit<SwipeContext, 'id'> = {
        userId,
        cardId: card.id,
        action,
        timestamp: now,
        
        // Session Context
        sessionId: this.currentSessionId!,
        swipePosition: this.swipeCount,
        sessionDuration,
        
        // Card Context
        cardTitle: card.title,
        cuisine: card.cuisine || 'Unknown',
        priceRange: card.price || '$',
        rating: card.rating || 0,
        distance: card.distance,
        deliveryTime: card.deliveryTime,
        
        // User Context
        timeOfDay,
        dayOfWeek,
        userLocation,
        
        // Behavioral Context
        swipeSpeed,
        previousAction: this.lastAction || undefined,
        consecutiveActions: this.consecutiveCount,
        hesitation,
        
        // UI Context
        swipeMethod,
        cardPosition: 'first', // Assuming first card in stack
        
        // Recommendation Context
        wasRecommended: false, // Will be updated by AI service
        
        // Device Context
        deviceType: 'ios', // Will be detected dynamically in real app
        appVersion: '1.0.0',
      };

      // Save to Firestore (disabled to avoid Firebase permission errors)
      // await addDoc(collection(db, 'swipeContexts'), {
      //   ...swipeContext,
      //   timestamp: serverTimestamp(),
      // });

      // Track AI metrics if this was a recommended card (disabled to avoid Firebase permission errors)
      // We'll import AIMetricsService dynamically to avoid circular dependencies
      // try {
      //   const { AIMetricsService } = await import('./aiMetricsService');
      //   await AIMetricsService.trackRecommendationInteraction(
      //     userId, 
      //     card.id, 
      //     action === 'superlike' ? 'like' : action, // Normalize superlike to like
      //     this.currentSessionId || undefined
      //   );
      // } catch (error) {
      //   // AIMetricsService might not be available, that's OK
      //   console.log('SwipeTracking: AI metrics not available, continuing...');
      // }

      // Update tracking state
      this.lastSwipeTime = now;
      this.lastAction = action;

          } catch (error) {
        // Failed to track swipe
      }
  }

  // Get user's swipe patterns for AI analysis
  static async getUserSwipePatterns(userId: string, days = 30): Promise<SwipeContext[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const swipesQuery = query(
        collection(db, 'swipeContexts'),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(swipesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as SwipeContext[];

    } catch (error) {
      return [];
    }
  }

  // Get behavioral insights for AI recommendations
  static async getUserBehavioralInsights(userId: string): Promise<{
    preferredCuisines: string[];
    preferredPriceRanges: string[];
    peakSwipeTimes: string[];
    averageSwipeSpeed: number;
    hesitationRate: number;
    likeRate: number;
    timePatterns: Record<string, number>;
    cuisinePreferences: Record<string, { likes: number; total: number; preference: number }>;
  }> {
    try {
      const patterns = await this.getUserSwipePatterns(userId);
      
      if (patterns.length === 0) {
        return {
          preferredCuisines: [],
          preferredPriceRanges: [],
          peakSwipeTimes: [],
          averageSwipeSpeed: 0,
          hesitationRate: 0,
          likeRate: 0,
          timePatterns: {},
          cuisinePreferences: {},
        };
      }

      // Analyze cuisine preferences
      const cuisineStats: Record<string, { likes: number; total: number }> = {};
      const priceStats: Record<string, { likes: number; total: number }> = {};
      const timeStats: Record<string, number> = {};
      
      let totalSwipeTime = 0;
      let hesitationCount = 0;
      let likeCount = 0;

      patterns.forEach(swipe => {
        // Cuisine analysis
        if (!cuisineStats[swipe.cuisine]) {
          cuisineStats[swipe.cuisine] = { likes: 0, total: 0 };
        }
        cuisineStats[swipe.cuisine].total++;
        if (swipe.action === 'like' || swipe.action === 'superlike') {
          cuisineStats[swipe.cuisine].likes++;
          likeCount++;
        }

        // Price analysis
        if (!priceStats[swipe.priceRange]) {
          priceStats[swipe.priceRange] = { likes: 0, total: 0 };
        }
        priceStats[swipe.priceRange].total++;
        if (swipe.action === 'like' || swipe.action === 'superlike') {
          priceStats[swipe.priceRange].likes++;
        }

        // Time pattern analysis
        const timeKey = `${swipe.dayOfWeek}-${swipe.timeOfDay}`;
        timeStats[timeKey] = (timeStats[timeKey] || 0) + 1;

        // Behavioral metrics
        totalSwipeTime += swipe.swipeSpeed;
        if (swipe.hesitation) hesitationCount++;
      });

      // Calculate preferences
      const cuisinePreferences: Record<string, { likes: number; total: number; preference: number }> = {};
      Object.entries(cuisineStats).forEach(([cuisine, stats]) => {
        const preference = stats.total > 0 ? stats.likes / stats.total : 0;
        cuisinePreferences[cuisine] = {
          likes: stats.likes,
          total: stats.total,
          preference,
        };
      });

      // Get top preferences
      const preferredCuisines = Object.entries(cuisinePreferences)
        .filter(([_, stats]) => stats.total >= 3) // Minimum sample size
        .sort(([_, a], [__, b]) => b.preference - a.preference)
        .slice(0, 5)
        .map(([cuisine]) => cuisine);

      const preferredPriceRanges = Object.entries(priceStats)
        .filter(([_, stats]) => stats.total >= 3)
        .sort(([_, a], [__, b]) => (b.likes / b.total) - (a.likes / a.total))
        .slice(0, 3)
        .map(([price]) => price);

      const peakSwipeTimes = Object.entries(timeStats)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 3)
        .map(([time]) => time);

      return {
        preferredCuisines,
        preferredPriceRanges,
        peakSwipeTimes,
        averageSwipeSpeed: patterns.length > 0 ? totalSwipeTime / patterns.length : 0,
        hesitationRate: patterns.length > 0 ? hesitationCount / patterns.length : 0,
        likeRate: patterns.length > 0 ? likeCount / patterns.length : 0,
        timePatterns: timeStats,
        cuisinePreferences,
      };

    } catch (error) {
      console.error('SwipeTracking: Failed to get behavioral insights:', error);
      return {
        preferredCuisines: [],
        preferredPriceRanges: [],
        peakSwipeTimes: [],
        averageSwipeSpeed: 0,
        hesitationRate: 0,
        likeRate: 0,
        timePatterns: {},
        cuisinePreferences: {},
      };
    }
  }

  // Mark swipes that were AI recommended
  static async markRecommendedSwipes(
    userId: string, 
    cardIds: string[], 
    reason: string, 
    scores: Record<string, number>
  ): Promise<void> {
    try {
      // This would update existing swipe records to mark them as recommended
      // Implementation would depend on specific requirements
          } catch (error) {
        // Failed to mark recommended swipes
      }
  }

  // Get current session ID
  static getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Get session statistics
  static getSessionStats(): {
    sessionId: string | null;
    duration: number;
    swipeCount: number;
    averageSwipeTime: number;
  } {
    const duration = this.sessionStartTime ? Date.now() - this.sessionStartTime.getTime() : 0;
    return {
      sessionId: this.currentSessionId,
      duration,
      swipeCount: this.swipeCount,
      averageSwipeTime: this.lastSwipeTime && this.swipeCount > 0 ? duration / this.swipeCount : 0,
    };
  }
}