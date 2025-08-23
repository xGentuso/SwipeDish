import { FoodCard } from '../types';

import { InputValidation, ValidationError } from '../utils/inputValidation';
import { ErrorSanitization } from '../utils/errorSanitization';
import { logger } from './loggingService';
import Constants from 'expo-constants';

export interface YelpBusiness {
  id: string;
  name: string;
  image_url: string;
  url: string;
  review_count: number;
  categories: Array<{ alias: string; title: string }>;
  rating: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  transactions: string[];
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance: number;
  is_closed: boolean;
}

export interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
  region: {
    center: {
      longitude: number;
      latitude: number;
    };
  };
}

export class YelpService {
  private static readonly BASE_URL = 'https://api.yelp.com/v3';
  
  // Location-based caching
  private static locationCache = new Map<string, {
    restaurants: FoodCard[];
    timestamp: number;
    location: { latitude: number; longitude: number };
  }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly LOCATION_THRESHOLD = 0.01; // ~1km threshold for cache reuse
  
  private static readonly API_KEY = (() => {
    // Try environment variable first (production)
    if (process.env.EXPO_PUBLIC_YELP_API_KEY && process.env.EXPO_PUBLIC_YELP_API_KEY !== 'your_yelp_api_key_here') {
      return process.env.EXPO_PUBLIC_YELP_API_KEY;
    }
    
    // Fallback to app.json config (development)
    const extraYelpKey = (Constants?.expoConfig?.extra as any)?.yelpApiKey || (Constants?.manifest?.extra as any)?.yelpApiKey;
    if (extraYelpKey && extraYelpKey !== 'YOUR_YELP_API_KEY_HERE') {
      return extraYelpKey;
    }
    

    
    // No valid API key found
    logger.warn('No valid Yelp API key found. Please configure EXPO_PUBLIC_YELP_API_KEY in your .env file or yelpApiKey in app.json', 'YELP_API');
    return '';
  })();

  // Rate limiting and retry configuration - More conservative to avoid 429 errors
  private static readonly RATE_LIMIT_DELAY = 1000; // 1 second delay to respect rate limits
  private static readonly MAX_RETRIES = 2; // Reduced retries to avoid excessive calls
  private static lastRequestTime = 0;
  private static requestCount = 0;
  private static readonly MAX_REQUESTS_PER_MINUTE = 50; // Conservative limit to avoid 429

  /**
   * Rate limiting helper method
   */
  private static async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Reset counter if a minute has passed
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0;
    }
    
    // Check if we're at the rate limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - timeSinceLastRequest;
      logger.warn(`Rate limit reached. Waiting ${waitTime}ms before next request.`, 'YELP_API');
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
    }
    
    // Enforce minimum delay between requests
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Retry wrapper for API calls
   */
  private static async retryApiCall<T>(
    apiCall: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      await this.enforceRateLimit();
      return await apiCall();
    } catch (error) {
      if (retries > 0 && error instanceof Error && error.message.includes('429')) {
        logger.warn(`Rate limit hit, retrying in ${this.RATE_LIMIT_DELAY}ms... (${retries} retries left)`, 'YELP_API');
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
        return this.retryApiCall(apiCall, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Search for restaurants using Yelp Fusion API
   */
  static async getRestaurants(
    latitude: number,
    longitude: number,
    options: {
      radius?: number; // in meters, max 40000
      categories?: string; // e.g., 'restaurants,food'
      price?: string; // '1,2,3,4' for $, $$, $$$, $$$$
      limit?: number; // max 50
      sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance';
      term?: string; // search term
    } = {}
  ): Promise<FoodCard[]> {
    try {
      // Validate coordinates
      const validatedCoords = InputValidation.validateCoordinates(latitude, longitude);
      if (!validatedCoords) {
        throw new ValidationError('Invalid coordinates provided');
      }

      if (!this.API_KEY) {
        logger.warn('Yelp API key not found, using mock data', 'YELP_API');
        return [];
      }

      const {
        radius = 40000, // 40km default - maximum allowed by Yelp API for maximum coverage
        categories = 'restaurants,food',
        price,
        limit = 50, // Maximum allowed by Yelp API
        sort_by = 'best_match',
        term
      } = options;

      // Validate input parameters
      if (radius && !InputValidation.validateRadius(radius)) {
        throw new ValidationError('Invalid radius. Must be between 1 and 40000 meters');
      }

      if (limit && !InputValidation.validateLimit(limit)) {
        throw new ValidationError('Invalid limit. Must be between 1 and 50');
      }

      if (price && !InputValidation.validatePriceRange(price)) {
        throw new ValidationError('Invalid price range. Must be comma-separated values: 1,2,3,4');
      }

      if (sort_by && !InputValidation.validateSortBy(sort_by)) {
        throw new ValidationError('Invalid sort option');
      }

      if (term && !InputValidation.validateSearchTerm(term)) {
        throw new ValidationError('Invalid search term');
      }

      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString(),
        categories,
        limit: limit.toString(),
        sort_by,
      });

      if (price) params.append('price', price);
      if (term) params.append('term', term);

      const data: YelpSearchResponse = await this.retryApiCall(async () => {
        const url = `${this.BASE_URL}/businesses/search?${params}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          const sanitizedError = ErrorSanitization.logAndSanitizeError(
            `Yelp API error: ${response.status} ${response.statusText}`,
            'API'
          );
          throw new Error(sanitizedError);
        }

        return await response.json();
      });

      return await this.convertYelpBusinessesToFoodCards(data.businesses);
    } catch (error) {
      const sanitizedError = ErrorSanitization.logAndSanitizeError(error, 'YelpService');
      
      // Handle rate limiting specifically
      if (error instanceof Error && error.message.includes('429')) {
        logger.warn('Yelp API rate limit exceeded. Checking cache for fallback results...', 'YELP_API');
        
        // Try to get cached results as fallback
        const cachedResults = this.getCachedResults(latitude, longitude);
        if (cachedResults && cachedResults.length > 0) {
          return cachedResults;
        }
        
        logger.warn('No cached results available, returning empty array', 'YELP_API');
        return [];
      }
      
      // Handle validation errors (show to user)
      if (error instanceof ValidationError) {
        throw error; // These are safe to show to users
      }
      
      // Handle other API errors with sanitized message
      if (error instanceof Error && error.message.includes('API')) {
        logger.warn(sanitizedError, 'YELP_API');
        return [];
      }
      
      return [];
    }
  }

  /**
   * Get restaurant details by Yelp business ID
   */
  static async getRestaurantDetails(businessId: string): Promise<YelpBusiness | null> {
    try {
      if (!this.API_KEY) {
        logger.warn('Yelp API key not found', 'YELP_API');
        return null;
      }

      const response = await fetch(`${this.BASE_URL}/businesses/${businessId}`, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Yelp API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error fetching restaurant details from Yelp', 'YELP_API', { error });
      return null;
    }
  }

  /**
   * Convert Yelp businesses to FoodCard format
   */
  static async convertYelpBusinessesToFoodCards(businesses: YelpBusiness[]): Promise<FoodCard[]> {
    const foodCards = await Promise.all(
      businesses.map(business => this.convertYelpBusinessToFoodCard(business))
    );
    return foodCards;
  }

  /**
   * Convert a single Yelp business to FoodCard format
   */
  private static async convertYelpBusinessToFoodCard(business: YelpBusiness): Promise<FoodCard> {
    // Extract cuisine from categories
    const cuisine = business.categories.length > 0 
      ? business.categories[0].title 
      : 'Restaurant';

    // Determine services based on transactions
    const services = {
      delivery: business.transactions.includes('delivery'),
      pickup: business.transactions.includes('pickup'),
      takeout: business.transactions.includes('pickup'), // Yelp uses 'pickup' for takeout
      dineIn: true, // Assume all restaurants offer dine-in unless specified otherwise
    };

    // Create description from available data
    const description = this.generateDescription(business);

    // Convert distance from meters to kilometers
    const distanceKm = business.distance ? Math.round((business.distance / 1000) * 10) / 10 : 0;



    const foodCard: FoodCard = {
      id: business.id,
      type: 'restaurant',
      title: business.name,
      subtitle: cuisine,
      description,
      imageUrl: business.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop&crop=center',
      rating: business.rating || 0,
      price: business.price || '',
      cuisine,
      distance: distanceKm,
      deliveryTime: this.estimateDeliveryTime(distanceKm, services.delivery),
      tags: business.categories.map(cat => cat.title),
      location: {
        latitude: business.coordinates.latitude,
        longitude: business.coordinates.longitude,
        address: business.location.display_address.join(', '),
      },
      externalLinks: {
        website: business.url,
      },
      services,
      isOpen: !business.is_closed,
    };

    // Only add optional fields if they exist (avoid undefined)
    if (business.review_count) {
      foodCard.userRatingsTotal = business.review_count;
    }



    return foodCard;
  }

  /**
   * Generate a description from business data
   */
  private static generateDescription(business: YelpBusiness): string {
    const parts: string[] = [];
    
    // Add cuisine and rating info
    if (business.categories.length > 0) {
      const cuisines = business.categories.map(cat => cat.title).slice(0, 2).join(' & ');
      parts.push(`Enjoy ${cuisines.toLowerCase()}`);
    }
    
    // Add rating info
    if (business.rating && business.review_count) {
      parts.push(`with ${business.rating}⭐ rating from ${business.review_count} reviews`);
    }
    
    // Add services info
    const services: string[] = [];
    if (business.transactions.includes('delivery')) services.push('delivery');
    if (business.transactions.includes('pickup')) services.push('takeout');
    
    if (services.length > 0) {
      parts.push(`Available for ${services.join(' and ')}`);
    }
    
    // Add location info
    if (business.location.city) {
      parts.push(`Located in ${business.location.city}`);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Estimate delivery time based on distance and availability
   */
  private static estimateDeliveryTime(distanceKm: number, hasDelivery: boolean): number {
    if (!hasDelivery) return 0;
    
    // Base time + distance factor
    const baseTime = 20; // 20 minutes base
    const distanceFactor = Math.round(distanceKm * 5); // 5 min per km
    
    return Math.min(baseTime + distanceFactor, 60); // Cap at 60 minutes
  }

  /**
   * Search restaurants by term and location
   */
  static async searchRestaurants(
    latitude: number,
    longitude: number,
    radius?: number,
    options: {
      price?: string;
      limit?: number;
      term?: string;
    } = {}
  ): Promise<FoodCard[]> {
    return this.getRestaurants(latitude, longitude, {
      ...options,
      radius,
      categories: 'restaurants,food',
    });
  }

  /**
   * Search restaurants by query term
   */
  static async searchRestaurantsByQuery(
    query: string,
    latitude: number,
    longitude: number,
    options: {
      radius?: number;
      price?: string;
      limit?: number;
    } = {}
  ): Promise<FoodCard[]> {
    return this.getRestaurants(latitude, longitude, {
      ...options,
      term: query,
      categories: 'restaurants,food',
    });
  }

  /**
   * Get maximum variety of restaurants using multiple search strategies
   */
  /**
   * Check if cached results exist for similar location
   */
  private static getCachedResults(latitude: number, longitude: number): FoodCard[] | null {
    const now = Date.now();
    
    for (const [key, cache] of this.locationCache.entries()) {
      // Check if cache is still valid
      if (now - cache.timestamp > this.CACHE_DURATION) {
        this.locationCache.delete(key);
        continue;
      }
      
      // Check if location is close enough to use cached results
      const latDiff = Math.abs(cache.location.latitude - latitude);
      const lonDiff = Math.abs(cache.location.longitude - longitude);
      
      if (latDiff < this.LOCATION_THRESHOLD && lonDiff < this.LOCATION_THRESHOLD) {
        return cache.restaurants;
      }
    }
    
    return null;
  }
  
  /**
   * Cache results for a location
   */
  private static cacheResults(latitude: number, longitude: number, restaurants: FoodCard[]): void {
    const key = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    this.locationCache.set(key, {
      restaurants,
      timestamp: Date.now(),
      location: { latitude, longitude }
    });
    
    // Clean up old cache entries (keep only last 5)
    if (this.locationCache.size > 5) {
      const oldestKey = this.locationCache.keys().next().value;
      if (oldestKey) {
        this.locationCache.delete(oldestKey);
      }
    }
  }

  static async getRestaurantsWithMaxVariety(
    latitude: number,
    longitude: number,
    options: {
      radius?: number;
      price?: string;
      limit?: number;
    } = {}
  ): Promise<FoodCard[]> {
    // Check cache first
    const cachedResults = this.getCachedResults(latitude, longitude);
    if (cachedResults) {
      return cachedResults;
    }
    
    const allRestaurants: FoodCard[] = [];
    const seenIds = new Set<string>();

    // Use sequential approach to avoid rate limiting - more reliable
    let generalResults: FoodCard[] = [];
    let ratingResults: FoodCard[] = [];
    let reviewResults: FoodCard[] = [];
    let distanceResults: FoodCard[] = [];

    // Strategy 1: General restaurant search
    try {
      generalResults = await this.getRestaurants(latitude, longitude, {
        ...options,
        sort_by: 'best_match',
      });
    } catch (error) {
      logger.warn('Failed to get general restaurants', 'YELP_API', { error });
    }

    // Strategy 2: Search by rating  
    try {
      ratingResults = await this.getRestaurants(latitude, longitude, {
        ...options,
        sort_by: 'rating',
      });
    } catch (error) {
      logger.warn('Failed to get rating-based restaurants', 'YELP_API', { error });
    }

    // Strategy 3: Search by review count
    try {
      reviewResults = await this.getRestaurants(latitude, longitude, {
        ...options,
        sort_by: 'review_count',
      });
    } catch (error) {
      logger.warn('Failed to get review-based restaurants', 'YELP_API', { error });
    }

    // Strategy 4: Search by distance
    try {
      distanceResults = await this.getRestaurants(latitude, longitude, {
        ...options,
        sort_by: 'distance',
      });
    } catch (error) {
      logger.warn('Failed to get distance-based restaurants', 'YELP_API', { error });
    }
    
    // Merge results from parallel searches
    [generalResults, ratingResults, reviewResults, distanceResults].forEach(results => {
      results.forEach(restaurant => {
        if (!seenIds.has(restaurant.id)) {
          allRestaurants.push(restaurant);
          seenIds.add(restaurant.id);
        }
      });
    });

    // Strategy 5: Limited cuisine searches (only top 4 for speed and reliability)
    const topCuisines = ['pizza', 'sushi', 'burgers', 'thai'];
    
    // Sequential cuisine searches to avoid rate limiting
    for (const cuisine of topCuisines) {
      try {
        const cuisineResults = await this.getRestaurantsByCuisine(cuisine, latitude, longitude, options);
        cuisineResults.forEach(restaurant => {
          if (!seenIds.has(restaurant.id)) {
            allRestaurants.push(restaurant);
            seenIds.add(restaurant.id);
          }
        });
      } catch (error) {
        logger.warn(`Failed to get ${cuisine} restaurants`, 'YELP_API', { error });
      }
    }

    
    
    // Cache the results for future use
    this.cacheResults(latitude, longitude, allRestaurants);
    
    return allRestaurants;
  }

  /**
   * Filter restaurants by cuisine type
   */
  static async getRestaurantsByCuisine(
    cuisine: string,
    latitude: number,
    longitude: number,
    options: {
      radius?: number;
      price?: string;
      limit?: number;
    } = {}
  ): Promise<FoodCard[]> {
    // Map common cuisine types to Yelp categories
    const cuisineMap: { [key: string]: string } = {
      'italian': 'italian',
      'chinese': 'chinese',
      'mexican': 'mexican',
      'indian': 'indpak',
      'japanese': 'japanese',
      'thai': 'thai',
      'american': 'tradamerican',
      'pizza': 'pizza',
      'fast food': 'hotdogs,burgers,sandwiches',
      'seafood': 'seafood',
      'steakhouse': 'steak',
      'vegetarian': 'vegetarian',
      'mediterranean': 'mediterranean',
    };

    const yelpCategory = cuisineMap[cuisine.toLowerCase()] || cuisine;

    return this.getRestaurants(latitude, longitude, {
      ...options,
      categories: yelpCategory,
    });
  }
}
