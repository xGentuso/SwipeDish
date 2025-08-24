import { FoodCard } from '../types';
import { YelpService } from './yelpService';
import { GeocodingService } from './geocodingService';

// Fallback restaurants for when API is unavailable
const fallbackRestaurants: FoodCard[] = [
  {
    id: 'mario_pizzeria',
    type: 'restaurant',
    title: "Mario's Pizzeria",
    subtitle: 'Authentic Italian',
    description: 'Hand-tossed pizzas with fresh ingredients and wood-fired ovens. Family-owned since 1985.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    rating: 4.6,
    price: '$$',
    cuisine: 'Italian',
    distance: 0.8,
    deliveryTime: 25,
    tags: ['Pizza', 'Italian', 'Family-Owned'],
    userRatingsTotal: 342,
    isOpen: true,
    location: {
      address: '123 Main Street',
      latitude: 43.1599795,
      longitude: -79.2470299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: undefined,
      delivery: undefined,
      reservation: undefined
    }
  },
  {
    id: 'sakura_sushi',
    type: 'restaurant',
    title: 'Sakura Sushi House',
    subtitle: 'Fresh & Creative',
    description: 'Premium sushi and sashimi with innovative rolls. Chef-curated omakase experience.',
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    rating: 4.7,
    price: '$$$',
    cuisine: 'Japanese',
    distance: 1.2,
    deliveryTime: 30,
    tags: ['Sushi', 'Japanese', 'Fine Dining'],
    userRatingsTotal: 189,
    isOpen: true,
    location: {
      address: '456 Oak Avenue',
      latitude: 43.1699795,
      longitude: -79.2370299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://sushimaster.com/menu',
      delivery: 'https://doordash.com/sushi-master',
      reservation: 'https://opentable.com/sushi-master'
    }
  },
  {
    id: 'taco_fiesta',
    type: 'restaurant',
    title: 'Taco Fiesta',
    subtitle: 'Mexican Street Food',
    description: 'Authentic Mexican tacos, burritos, and quesadillas. Fresh salsas and homemade tortillas.',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    rating: 4.6,
    price: '$',
    cuisine: 'Mexican',
    distance: 1.0,
    deliveryTime: 18,
    tags: ['Tacos', 'Mexican', 'Street Food'],
    userRatingsTotal: 234,
    isOpen: true,
    location: {
      address: '789 Fiesta Street',
      latitude: 43.1749795,
      longitude: -79.2420299
    },
    services: { delivery: true, takeout: true, dineIn: false },
    externalLinks: {
      menu: 'https://tacofiesta.com/menu',
      delivery: 'https://postmates.com/taco-fiesta'
    }
  },
  {
    id: 'thai_spice',
    type: 'restaurant',
    title: 'Thai Spice',
    subtitle: 'Authentic Thai Cuisine',
    description: 'Traditional Thai dishes with perfect balance of sweet, sour, spicy, and savory flavors.',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    rating: 4.4,
    price: '$$',
    cuisine: 'Thai',
    distance: 1.5,
    deliveryTime: 35,
    tags: ['Thai', 'Spicy', 'Asian'],
    userRatingsTotal: 187,
    isOpen: true,
    location: {
      address: '456 Thai Street',
      latitude: 43.1849795,
      longitude: -79.2520299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://thaispice.com/menu',
      delivery: 'https://ubereats.com/thai-spice',
      reservation: 'https://opentable.com/thai-spice'
    }
  },
  {
    id: 'burger_joint',
    type: 'restaurant',
    title: 'Burger Joint',
    subtitle: 'Gourmet Burgers',
    description: 'Artisanal burgers with house-made buns and premium toppings. Craft beer selection available.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    rating: 4.3,
    price: '$',
    cuisine: 'American',
    distance: 0.5,
    deliveryTime: 20,
    tags: ['Burgers', 'American', 'Casual'],
    userRatingsTotal: 156,
    isOpen: true,
    location: {
      address: '321 Burger Avenue',
      latitude: 43.1649795,
      longitude: -79.2320299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://burgerjoint.com/menu',
      delivery: 'https://grubhub.com/burger-joint'
    }
  },
  {
    id: 'golden_dragon',
    type: 'restaurant',
    title: 'Golden Dragon',
    subtitle: 'Authentic Chinese',
    description: 'Traditional Chinese cuisine with dim sum, Peking duck, and regional specialties.',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    rating: 4.5,
    price: '$$',
    cuisine: 'Chinese',
    distance: 1.8,
    deliveryTime: 28,
    tags: ['Chinese', 'Dim Sum', 'Traditional'],
    userRatingsTotal: 267,
    isOpen: true,
    location: {
      address: '789 Dragon Lane',
      latitude: 43.1799795,
      longitude: -79.2570299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://goldendragon.com/menu',
      delivery: 'https://ubereats.com/golden-dragon',
      reservation: 'https://opentable.com/golden-dragon'
    }
  },
  {
    id: 'spice_route',
    type: 'restaurant',
    title: 'Spice Route',
    subtitle: 'Indian Fusion',
    description: 'Modern Indian cuisine with a contemporary twist. Tandoor specialties and craft cocktails.',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
    rating: 4.8,
    price: '$$$',
    cuisine: 'Indian',
    distance: 2.1,
    deliveryTime: 32,
    tags: ['Indian', 'Fusion', 'Tandoor'],
    userRatingsTotal: 156,
    isOpen: true,
    location: {
      address: '321 Spice Street',
      latitude: 43.1899795,
      longitude: -79.2670299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://spiceroute.com/menu',
      delivery: 'https://doordash.com/spice-route',
      reservation: 'https://opentable.com/spice-route'
    }
  },
  {
    id: 'le_petit_bistro',
    type: 'restaurant',
    title: 'Le Petit Bistro',
    subtitle: 'French Cuisine',
    description: 'Classic French bistro with escargot, coq au vin, and an extensive wine list.',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    rating: 4.9,
    price: '$$$$',
    cuisine: 'French',
    distance: 2.5,
    deliveryTime: 40,
    tags: ['French', 'Bistro', 'Fine Dining'],
    userRatingsTotal: 89,
    isOpen: true,
    location: {
      address: '654 Bistro Avenue',
      latitude: 43.1999795,
      longitude: -79.2770299
    },
    services: { delivery: false, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://lepetitbistro.com/menu',
      reservation: 'https://opentable.com/le-petit-bistro'
    }
  },
  {
    id: 'mediterranean_grill',
    type: 'restaurant',
    title: 'Mediterranean Grill',
    subtitle: 'Fresh & Healthy',
    description: 'Mediterranean cuisine with fresh seafood, grilled meats, and vegetarian options.',
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    rating: 4.4,
    price: '$$',
    cuisine: 'Mediterranean',
    distance: 1.3,
    deliveryTime: 22,
    tags: ['Mediterranean', 'Healthy', 'Seafood'],
    userRatingsTotal: 203,
    isOpen: true,
    location: {
      address: '987 Mediterranean Way',
      latitude: 43.2099795,
      longitude: -79.2870299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://medgrill.com/menu',
      delivery: 'https://grubhub.com/mediterranean-grill',
      reservation: 'https://opentable.com/mediterranean-grill'
    }
  },
  {
    id: 'bbq_smokehouse',
    type: 'restaurant',
    title: 'BBQ Smokehouse',
    subtitle: 'Slow-Smoked BBQ',
    description: 'Authentic Texas-style BBQ with brisket, ribs, and homemade sides. Smoked for 12+ hours.',
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
    rating: 4.7,
    price: '$$',
    cuisine: 'BBQ',
    distance: 2.8,
    deliveryTime: 35,
    tags: ['BBQ', 'Smoked', 'Texas Style'],
    userRatingsTotal: 178,
    isOpen: true,
    location: {
      address: '456 Smoke Street',
      latitude: 43.2199795,
      longitude: -79.2970299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://bbqsmokehouse.com/menu',
      delivery: 'https://postmates.com/bbq-smokehouse'
    }
  }
];

interface CachedFoodCard extends FoodCard {
  timestamp: number;
}

export class RestaurantService {
  private static apiCache = new Map<string, CachedFoodCard>();
  private static cacheExpiry = 30 * 60 * 1000; // 30 minutes

  /**
   * Get restaurants from Yelp API with fallback to local data
   */
  static async getRestaurants(
    filters?: {
      cuisine?: string;
      price?: string;
      maxDistance?: number;
    },
    userLocation?: { latitude: number; longitude: number }
  ): Promise<FoodCard[]> {
    try {
      // Validate location parameters
      let location = userLocation || { 
        latitude: 43.1599795, 
        longitude: -79.2470299 // Default location
      };

      // Validate latitude and longitude
      if (isNaN(location.latitude) || location.latitude < -90 || location.latitude > 90) {
        console.warn('RestaurantService: Invalid latitude provided, using fallback');
        location.latitude = 43.1599795;
      }
      
      if (isNaN(location.longitude) || location.longitude < -180 || location.longitude > 180) {
        console.warn('RestaurantService: Invalid longitude provided, using fallback');
        location.longitude = -79.2470299;
      }

      // Build Yelp API options
      const radius = filters?.maxDistance ? Math.min(filters.maxDistance * 1000, 40000) : 40000;
      
      // Try Yelp API first with maximum variety strategy
      const yelpRestaurants = await YelpService.getRestaurantsWithMaxVariety(location.latitude, location.longitude, {
        radius,
        limit: 50
      });
      if (yelpRestaurants && yelpRestaurants.length > 0) {
        
        // Apply filters if provided
        let filteredRestaurants = yelpRestaurants;
        
        if (filters?.cuisine && filters.cuisine !== 'All') {
          filteredRestaurants = filteredRestaurants.filter(restaurant => 
            restaurant.cuisine?.toLowerCase() === filters.cuisine?.toLowerCase()
          );
        }

        if (filters?.price) {
          filteredRestaurants = filteredRestaurants.filter(restaurant => 
            restaurant.price === filters.price
          );
        }

        if (filters?.maxDistance) {
          filteredRestaurants = filteredRestaurants.filter(restaurant => 
            restaurant.distance !== undefined && restaurant.distance <= filters.maxDistance!
          );
        }

        return filteredRestaurants;
      }
    } catch (error) {
      // If it's a rate limit error, try to get cached results
      if (error instanceof Error && error.message.includes('429')) {
        // The YelpService should have already tried cache, but we can add additional fallback here
      }
    }

    // Fallback to sample data for development
    return fallbackRestaurants;
  }

  /**
   * Get a specific restaurant by ID
   */
  static async getRestaurantById(id: string): Promise<FoodCard | null> {
    // Check cache first
    const cached = this.apiCache.get(id);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      const { timestamp, ...foodCard } = cached;
      return foodCard;
    }

    try {
      // Try to get from Yelp API
      const restaurants = await YelpService.getRestaurants({ term: id, location: 'default' }, 0, 0);
      const restaurant = restaurants[0];
      if (restaurant) {
        // Cache the result
        this.apiCache.set(id, { ...restaurant, timestamp: Date.now() });
        return restaurant;
      }
    } catch (error) {
      // Failed to get restaurant from API
    }

    return null;
  }

  /**
   * Search restaurants by query
   */
  static async searchRestaurants(query: string, latitude: number, longitude: number): Promise<FoodCard[]> {
    try {
      const results = await YelpService.searchRestaurantsByQuery(query, latitude, longitude);
      if (results && results.length > 0) {
        return results;
      }
    } catch (error) {
      // Search API failed
    }

    return [];
  }

  /**
   * Get restaurant recommendations based on user preferences
   */
  static async getRecommendations(
    latitude: number, 
    longitude: number, 
    preferences: string[] = []
  ): Promise<FoodCard[]> {
    try {
      const restaurants = await this.getRestaurants(undefined, { latitude, longitude });
      
      if (preferences.length === 0) {
        return restaurants;
      }

      // Filter by preferences
      return restaurants.filter(restaurant => {
        return preferences.some(pref => 
          restaurant.cuisine?.toLowerCase().includes(pref.toLowerCase()) ||
          restaurant.tags?.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
        );
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear the API cache
   */
  static clearCache(): void {
    this.apiCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.apiCache.size,
      entries: Array.from(this.apiCache.keys())
    };
  }

  /**
   * Get available cuisine types for filtering
   */
  static getCuisineTypes(): string[] {
    return [
      'All',
      'American',
      'Italian',
      'Japanese',
      'Chinese',
      'Mexican',
      'Thai',
      'Indian',
      'Mediterranean',
      'Greek',
      'Korean',
      'Vietnamese',
      'French',
      'Turkish',
      'Middle Eastern',
      'Asian',
      'Vegan',
      'Healthy',
      'Seafood',
      'BBQ',
      'Bakery',
      'Cafe',
      'Dessert',
      'Beverages'
    ];
  }

  /**
   * Get available price ranges for filtering
   */
  static getPriceRanges(): string[] {
    return ['$', '$$', '$$$', '$$$$'];
  }
}