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
  },
  {
    id: 'vegan_garden',
    type: 'restaurant',
    title: 'Vegan Garden',
    subtitle: 'Plant-Based Delights',
    description: '100% plant-based cuisine with creative vegan dishes and fresh organic ingredients.',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
    rating: 4.6,
    price: '$$',
    cuisine: 'Vegan',
    distance: 1.7,
    deliveryTime: 25,
    tags: ['Vegan', 'Plant-Based', 'Organic'],
    userRatingsTotal: 134,
    isOpen: true,
    location: {
      address: '321 Garden Lane',
      latitude: 43.2299795,
      longitude: -79.3070299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://vegangarden.com/menu',
      delivery: 'https://ubereats.com/vegan-garden'
    }
  },
  {
    id: 'seafood_harbor',
    type: 'restaurant',
    title: 'Seafood Harbor',
    subtitle: 'Fresh Catch Daily',
    description: 'Fresh seafood from local waters. Oysters, lobster, and daily catch specials.',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
    rating: 4.8,
    price: '$$$',
    cuisine: 'Seafood',
    distance: 3.2,
    deliveryTime: 38,
    tags: ['Seafood', 'Fresh', 'Oysters'],
    userRatingsTotal: 112,
    isOpen: true,
    location: {
      address: '789 Harbor Drive',
      latitude: 43.2399795,
      longitude: -79.3170299
    },
    services: { delivery: false, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://seafoodharbor.com/menu',
      reservation: 'https://opentable.com/seafood-harbor'
    }
  },
  {
    id: 'korean_bbq_house',
    type: 'restaurant',
    title: 'Korean BBQ House',
    subtitle: 'Interactive Dining',
    description: 'Authentic Korean BBQ with table-side grilling. Premium meats and traditional sides.',
    imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
    rating: 4.5,
    price: '$$$',
    cuisine: 'Korean',
    distance: 2.0,
    deliveryTime: 30,
    tags: ['Korean', 'BBQ', 'Interactive'],
    userRatingsTotal: 145,
    isOpen: true,
    location: {
      address: '654 BBQ Street',
      latitude: 43.2499795,
      longitude: -79.3270299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://koreanbbqhouse.com/menu',
      delivery: 'https://doordash.com/korean-bbq-house',
      reservation: 'https://opentable.com/korean-bbq-house'
    }
  },
  {
    id: 'greek_islands',
    type: 'restaurant',
    title: 'Greek Islands',
    subtitle: 'Aegean Flavors',
    description: 'Traditional Greek cuisine with moussaka, souvlaki, and fresh Mediterranean flavors.',
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
    rating: 4.3,
    price: '$$',
    cuisine: 'Greek',
    distance: 1.9,
    deliveryTime: 27,
    tags: ['Greek', 'Mediterranean', 'Traditional'],
    userRatingsTotal: 167,
    isOpen: true,
    location: {
      address: '987 Greek Way',
      latitude: 43.2599795,
      longitude: -79.3370299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://greekislands.com/menu',
      delivery: 'https://grubhub.com/greek-islands'
    }
  },
  {
    id: 'ramen_master',
    type: 'restaurant',
    title: 'Ramen Master',
    subtitle: 'Artisan Noodles',
    description: 'Handcrafted ramen with rich broths and premium toppings. Traditional and fusion styles.',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    rating: 4.7,
    price: '$$',
    cuisine: 'Japanese',
    distance: 1.4,
    deliveryTime: 24,
    tags: ['Ramen', 'Japanese', 'Noodles'],
    userRatingsTotal: 198,
    isOpen: true,
    location: {
      address: '321 Ramen Street',
      latitude: 43.2699795,
      longitude: -79.3470299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://ramenmaster.com/menu',
      delivery: 'https://ubereats.com/ramen-master'
    }
  },
  {
    id: 'turkish_kebab',
    type: 'restaurant',
    title: 'Turkish Kebab',
    subtitle: 'Street Food Delights',
    description: 'Authentic Turkish kebabs, pide, and street food favorites. Fresh-baked bread daily.',
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
    rating: 4.2,
    price: '$',
    cuisine: 'Turkish',
    distance: 0.9,
    deliveryTime: 18,
    tags: ['Turkish', 'Kebab', 'Street Food'],
    userRatingsTotal: 223,
    isOpen: true,
    location: {
      address: '654 Kebab Lane',
      latitude: 43.2799795,
      longitude: -79.3570299
    },
    services: { delivery: true, takeout: true, dineIn: false },
    externalLinks: {
      menu: 'https://turkishkebab.com/menu',
      delivery: 'https://postmates.com/turkish-kebab'
    }
  },
  {
    id: 'middle_eastern_grill',
    type: 'restaurant',
    title: 'Middle Eastern Grill',
    subtitle: 'Levantine Cuisine',
    description: 'Traditional Middle Eastern dishes with shawarma, falafel, and mezze platters.',
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
    rating: 4.4,
    price: '$$',
    cuisine: 'Middle Eastern',
    distance: 2.3,
    deliveryTime: 29,
    tags: ['Middle Eastern', 'Shawarma', 'Falafel'],
    userRatingsTotal: 156,
    isOpen: true,
    location: {
      address: '789 Middle East Way',
      latitude: 43.2899795,
      longitude: -79.3670299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://middleeasterngrill.com/menu',
      delivery: 'https://doordash.com/middle-eastern-grill'
    }
  },
  {
    id: 'artisan_bakery',
    type: 'restaurant',
    title: 'Artisan Bakery',
    subtitle: 'Fresh Baked Daily',
    description: 'Handcrafted breads, pastries, and sandwiches. Sourdough and croissants made fresh daily.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    rating: 4.6,
    price: '$',
    cuisine: 'Bakery',
    distance: 0.7,
    deliveryTime: 15,
    tags: ['Bakery', 'Artisan', 'Fresh Baked'],
    userRatingsTotal: 289,
    isOpen: true,
    location: {
      address: '456 Bakery Street',
      latitude: 43.2999795,
      longitude: -79.3770299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://artisanbakery.com/menu',
      delivery: 'https://grubhub.com/artisan-bakery'
    }
  },
  {
    id: 'coffee_roasters',
    type: 'restaurant',
    title: 'Coffee Roasters',
    subtitle: 'Specialty Coffee',
    description: 'Single-origin coffee, pour-over, and artisanal espresso drinks. Freshly roasted beans.',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    rating: 4.5,
    price: '$',
    cuisine: 'Cafe',
    distance: 0.6,
    deliveryTime: 12,
    tags: ['Coffee', 'Cafe', 'Artisanal'],
    userRatingsTotal: 334,
    isOpen: true,
    location: {
      address: '123 Coffee Lane',
      latitude: 43.3099795,
      longitude: -79.3870299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://coffeeroasters.com/menu',
      delivery: 'https://ubereats.com/coffee-roasters'
    }
  },
  {
    id: 'dessert_paradise',
    type: 'restaurant',
    title: 'Dessert Paradise',
    subtitle: 'Sweet Creations',
    description: 'Artisanal desserts, custom cakes, and gourmet ice cream. Perfect for celebrations.',
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',
    rating: 4.8,
    price: '$$',
    cuisine: 'Dessert',
    distance: 1.1,
    deliveryTime: 20,
    tags: ['Dessert', 'Cakes', 'Ice Cream'],
    userRatingsTotal: 178,
    isOpen: true,
    location: {
      address: '789 Dessert Way',
      latitude: 43.3199795,
      longitude: -79.3970299
    },
    services: { delivery: true, takeout: true, dineIn: true },
    externalLinks: {
      menu: 'https://dessertparadise.com/menu',
      delivery: 'https://postmates.com/dessert-paradise'
    }
  },
  {
    id: 'juice_bar',
    type: 'restaurant',
    title: 'Fresh Juice Bar',
    subtitle: 'Healthy Beverages',
    description: 'Fresh-pressed juices, smoothies, and wellness shots. Organic ingredients and superfoods.',
    imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800',
    rating: 4.3,
    price: '$',
    cuisine: 'Beverages',
    distance: 0.8,
    deliveryTime: 16,
    tags: ['Juice', 'Smoothies', 'Healthy'],
    userRatingsTotal: 201,
    isOpen: true,
    location: {
      address: '321 Juice Street',
      latitude: 43.3299795,
      longitude: -79.4070299
    },
    services: { delivery: true, takeout: true, dineIn: false },
    externalLinks: {
      menu: 'https://freshjuicebar.com/menu',
      delivery: 'https://grubhub.com/fresh-juice-bar'
    }
  }
];

export class RestaurantService {
  private static apiCache = new Map<string, FoodCard>();
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
    if (cached && Date.now() - (cached as any).timestamp < this.cacheExpiry) {
      return cached;
    }

    try {
      // Try to get from Yelp API
      const restaurants = await YelpService.getRestaurants({ term: id, location: 'default' }, 0, 0);
      const restaurant = restaurants[0];
      if (restaurant) {
        // Cache the result
        this.apiCache.set(id, { ...restaurant, timestamp: Date.now() } as any);
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

