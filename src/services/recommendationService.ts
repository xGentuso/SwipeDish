/**
 * Simple, reliable restaurant recommendation service
 * Replaces the complex AI system with proven recommendation algorithms
 */

import { FoodCard } from '../types';
import { RestaurantService } from './restaurantService';
import { analyticsService, AnalyticsEvent } from './analyticsService';

export interface RecommendationOptions {
  userLocation?: { latitude: number; longitude: number };
  limit?: number;
  minRating?: number;
  maxDistance?: number;
  preferredCuisines?: string[];
  priceRange?: string[];
}

export class RecommendationService {
  private static readonly DEFAULT_LIMIT = 10;
  private static readonly DEFAULT_MIN_RATING = 4.0;
  private static readonly DEFAULT_MAX_DISTANCE = 10; // km

  /**
   * Get recommended restaurants using simple, reliable criteria
   */
  static async getRecommendations(
    userId?: string,
    options: RecommendationOptions = {}
  ): Promise<FoodCard[]> {
    try {
      const startTime = Date.now();
      
      // Get all restaurants
      const allRestaurants = await RestaurantService.getRestaurants(
        undefined, 
        options.userLocation
      );

      if (allRestaurants.length === 0) {
        return [];
      }

      // Apply filters and scoring
      const recommendations = this.scoreAndFilterRestaurants(allRestaurants, options);
      
      // Limit results
      const limitedResults = recommendations.slice(0, options.limit || this.DEFAULT_LIMIT);
      
      // Track analytics
      const responseTime = Date.now() - startTime;
      if (userId) {
        analyticsService.trackEvent(AnalyticsEvent.RECOMMENDATIONS_GENERATED, {
          user_id: userId,
          count: limitedResults.length,
          response_time_ms: responseTime,
          algorithm: 'simple_rating_based'
        });
      }

      return limitedResults;
      
    } catch (error) {
      console.error('RecommendationService: Error generating recommendations:', error);
      
      // Fallback to basic restaurant list
      try {
        const fallbackRestaurants = await RestaurantService.getRestaurants(
          undefined, 
          options.userLocation
        );
        return fallbackRestaurants.slice(0, options.limit || this.DEFAULT_LIMIT);
      } catch (fallbackError) {
        console.error('RecommendationService: Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Score and filter restaurants based on simple, proven criteria
   */
  private static scoreAndFilterRestaurants(
    restaurants: FoodCard[],
    options: RecommendationOptions
  ): FoodCard[] {
    const minRating = options.minRating || this.DEFAULT_MIN_RATING;
    const maxDistance = options.maxDistance || this.DEFAULT_MAX_DISTANCE;

    return restaurants
      .filter(restaurant => {
        // Rating filter
        if (restaurant.rating && restaurant.rating < minRating) {
          return false;
        }

        // Distance filter
        if (restaurant.distance && restaurant.distance > maxDistance) {
          return false;
        }

        // Cuisine preference filter
        if (options.preferredCuisines && options.preferredCuisines.length > 0) {
          if (!restaurant.cuisine || !options.preferredCuisines.includes(restaurant.cuisine)) {
            return false;
          }
        }

        // Price range filter
        if (options.priceRange && options.priceRange.length > 0) {
          if (!restaurant.price || !options.priceRange.includes(restaurant.price)) {
            return false;
          }
        }

        return true;
      })
      .map(restaurant => ({
        ...restaurant,
        recommendationScore: this.calculateRecommendationScore(restaurant, options),
        recommendationReason: this.getRecommendationReason(restaurant)
      }))
      .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
  }

  /**
   * Calculate a simple recommendation score based on multiple factors
   */
  private static calculateRecommendationScore(
    restaurant: FoodCard,
    options: RecommendationOptions
  ): number {
    let score = 0;

    // Rating score (40% of total)
    if (restaurant.rating) {
      score += (restaurant.rating / 5.0) * 0.4;
    }

    // Review count score (20% of total) - more reviews = more reliable
    if (restaurant.userRatingsTotal) {
      const reviewScore = Math.min(restaurant.userRatingsTotal / 1000, 1.0);
      score += reviewScore * 0.2;
    }

    // Distance score (20% of total) - closer is better
    if (restaurant.distance) {
      const distanceScore = Math.max(0, 1.0 - (restaurant.distance / 10));
      score += distanceScore * 0.2;
    }

    // Open status bonus (10% of total)
    if (restaurant.isOpen) {
      score += 0.1;
    }

    // Delivery time bonus (10% of total) - faster is better
    if (restaurant.deliveryTime) {
      const timeScore = Math.max(0, 1.0 - (restaurant.deliveryTime / 60));
      score += timeScore * 0.1;
    }

    return score;
  }

  /**
   * Generate a simple explanation for why this restaurant was recommended
   */
  private static getRecommendationReason(restaurant: FoodCard): string {
    const reasons: string[] = [];

    if (restaurant.rating && restaurant.rating >= 4.5) {
      reasons.push('Highly rated');
    } else if (restaurant.rating && restaurant.rating >= 4.0) {
      reasons.push('Well rated');
    }

    if (restaurant.userRatingsTotal && restaurant.userRatingsTotal > 500) {
      reasons.push('Popular choice');
    }

    if (restaurant.distance && restaurant.distance <= 2) {
      reasons.push('Close to you');
    }

    if (restaurant.isOpen) {
      reasons.push('Open now');
    }

    if (restaurant.deliveryTime && restaurant.deliveryTime <= 30) {
      reasons.push('Quick delivery');
    }

    if (reasons.length === 0) {
      return 'Good option for you';
    }

    return reasons.slice(0, 2).join(' • ');
  }

  /**
   * Get top-rated restaurants (simple high-rating filter)
   */
  static async getTopRated(
    userLocation?: { latitude: number; longitude: number },
    limit: number = 10
  ): Promise<FoodCard[]> {
    return this.getRecommendations(undefined, {
      userLocation,
      limit,
      minRating: 4.5
    });
  }

  /**
   * Get nearby restaurants (distance-based recommendations)
   */
  static async getNearby(
    userLocation?: { latitude: number; longitude: number },
    limit: number = 10
  ): Promise<FoodCard[]> {
    return this.getRecommendations(undefined, {
      userLocation,
      limit,
      maxDistance: 5 // 5km radius
    });
  }

  /**
   * Get quick delivery options
   */
  static async getQuickDelivery(
    userLocation?: { latitude: number; longitude: number },
    limit: number = 10
  ): Promise<FoodCard[]> {
    try {
      const restaurants = await RestaurantService.getRestaurants(undefined, userLocation);
      
      return restaurants
        .filter(restaurant => 
          restaurant.deliveryTime && 
          restaurant.deliveryTime <= 30 &&
          restaurant.isOpen
        )
        .sort((a, b) => (a.deliveryTime || 999) - (b.deliveryTime || 999))
        .slice(0, limit)
        .map(restaurant => ({
          ...restaurant,
          recommendationReason: `${restaurant.deliveryTime} min delivery`
        }));
    } catch (error) {
      console.error('RecommendationService: Error getting quick delivery options:', error);
      return [];
    }
  }
}