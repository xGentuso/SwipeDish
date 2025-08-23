import { FoodCard } from '../types';

export interface UserPreferences {
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  priceRange: string[];
  maxDistance: number;
  minRating: number;
}

export class PreferencesService {
  // Available dietary restrictions
  static readonly DIETARY_RESTRICTIONS = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
    'Halal',
    'Kosher',
    'Low-Carb',
    'Keto',
    'Paleo',
    'Pescatarian',
    'Low-Sodium',
    'Sugar-Free',
  ];

  // Available cuisine types
  static readonly CUISINE_TYPES = [
    'Italian',
    'Japanese',
    'Mexican',
    'Thai',
    'American',
    'Chinese',
    'Indian',
    'Mediterranean',
    'Greek',
    'French',
    'Korean',
    'Vietnamese',
    'Lebanese',
    'Turkish',
    'Spanish',
    'Brazilian',
    'Caribbean',
    'African',
    'Middle Eastern',
    'Fusion',
  ];

  // Available price ranges
  static readonly PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

  /**
   * Filter and prioritize restaurants based on user preferences
   */
  static filterRestaurantsByPreferences(
    restaurants: FoodCard[],
    preferences: UserPreferences
  ): FoodCard[] {
    console.log('🔄 PreferencesService: Filtering restaurants with preferences:', preferences);
    
    // First, apply strict filtering for dietary restrictions and basic criteria
    const strictlyFiltered = restaurants.filter(restaurant => {
      // Check dietary restrictions (strict filtering)
      if (preferences.dietaryRestrictions.length > 0) {
        if (!this.restaurantMeetsDietaryRestrictions(restaurant, preferences.dietaryRestrictions)) {
          return false;
        }
      }

      // Check distance (strict filtering)
      if (preferences.maxDistance > 0) {
        if (restaurant.distance && restaurant.distance > preferences.maxDistance) {
          return false;
        }
      }

      // Check rating (strict filtering)
      if (preferences.minRating > 0) {
        if (restaurant.rating && restaurant.rating < preferences.minRating) {
          return false;
        }
      }

      return true;
    });

    console.log(`✅ PreferencesService: Strictly filtered ${restaurants.length} restaurants to ${strictlyFiltered.length}`);

    // Now apply preference-based prioritization
    const prioritized = this.prioritizeByPreferences(strictlyFiltered, preferences);
    
    console.log(`✅ PreferencesService: Prioritized ${strictlyFiltered.length} restaurants to ${prioritized.length} based on preferences`);
    return prioritized;
  }

  /**
   * Prioritize restaurants based on preferences (reduces frequency of non-preferred options)
   */
  private static prioritizeByPreferences(
    restaurants: FoodCard[],
    preferences: UserPreferences
  ): FoodCard[] {
    if (restaurants.length === 0) return restaurants;

    // Separate restaurants into preferred and non-preferred
    const preferred: FoodCard[] = [];
    const nonPreferred: FoodCard[] = [];

    restaurants.forEach(restaurant => {
      const isPreferred = this.isRestaurantPreferred(restaurant, preferences);
      if (isPreferred) {
        preferred.push(restaurant);
      } else {
        nonPreferred.push(restaurant);
      }
    });

    console.log(`📊 PreferencesService: ${preferred.length} preferred, ${nonPreferred.length} non-preferred restaurants`);

    // If no preferences are set, return all restaurants
    if (preferences.cuisinePreferences.length === 0 && preferences.priceRange.length === 0) {
      return restaurants;
    }

    // If we have preferred restaurants, prioritize them heavily
    if (preferred.length > 0) {
      // Include 80% preferred restaurants and 20% non-preferred restaurants
      const preferredCount = Math.min(preferred.length, Math.ceil(restaurants.length * 0.8));
      const nonPreferredCount = Math.min(nonPreferred.length, Math.ceil(restaurants.length * 0.2));

      // Shuffle both arrays for variety
      const shuffledPreferred = this.shuffleArray([...preferred]);
      const shuffledNonPreferred = this.shuffleArray([...nonPreferred]);

      // Combine with heavy preference weighting
      const result = [
        ...shuffledPreferred.slice(0, preferredCount),
        ...shuffledNonPreferred.slice(0, nonPreferredCount)
      ];

      // Shuffle the final result to avoid clustering
      return this.shuffleArray(result);
    }

    // If no preferred restaurants found, return all non-preferred (but this shouldn't happen often)
    return nonPreferred;
  }

  /**
   * Check if a restaurant is preferred based on user preferences
   */
  private static isRestaurantPreferred(
    restaurant: FoodCard,
    preferences: UserPreferences
  ): boolean {
    // Check cuisine preferences with improved matching
    if (preferences.cuisinePreferences.length > 0) {
      if (!restaurant.cuisine) {
        return false;
      }
      
      // Try exact match first
      if (preferences.cuisinePreferences.includes(restaurant.cuisine)) {
        return true;
      }
      
      // Try case-insensitive match
      const restaurantCuisineLower = restaurant.cuisine.toLowerCase();
      const hasMatchingCuisine = preferences.cuisinePreferences.some(pref => 
        pref.toLowerCase() === restaurantCuisineLower
      );
      
      if (hasMatchingCuisine) {
        return true;
      }
      
      // Try partial matching for cuisine types
      const hasPartialMatch = preferences.cuisinePreferences.some(pref => {
        const prefLower = pref.toLowerCase();
        return restaurantCuisineLower.includes(prefLower) || prefLower.includes(restaurantCuisineLower);
      });
      
      if (hasPartialMatch) {
        return true;
      }
      
      return false;
    }

    // Check price range preferences
    if (preferences.priceRange.length > 0) {
      if (!restaurant.price || !preferences.priceRange.includes(restaurant.price)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Check if a restaurant meets dietary restrictions
   */
  private static restaurantMeetsDietaryRestrictions(
    restaurant: FoodCard,
    dietaryRestrictions: string[]
  ): boolean {
    // For now, we'll use a simple tag-based approach
    // In the future, this could be enhanced with menu analysis
    
    const restaurantTags = restaurant.tags.map(tag => tag.toLowerCase());
    const restaurantName = restaurant.title.toLowerCase();
    const restaurantCuisine = restaurant.cuisine?.toLowerCase() || '';

    for (const restriction of dietaryRestrictions) {
      const restrictionLower = restriction.toLowerCase();
      
      // Check if restaurant explicitly supports this dietary restriction
      if (restaurantTags.includes(restrictionLower) || 
          restaurantTags.includes(restrictionLower.replace('-', '')) ||
          restaurantTags.includes(restrictionLower.replace('-', ' '))) {
        continue; // Restaurant supports this restriction
      }

      // Check cuisine-specific dietary support
      if (this.cuisineSupportsDietaryRestriction(restaurantCuisine, restriction)) {
        continue; // Cuisine type supports this restriction
      }

      // Check restaurant name for dietary indicators
      if (this.restaurantNameIndicatesDietarySupport(restaurantName, restriction)) {
        continue; // Restaurant name suggests dietary support
      }

      // If we get here, the restaurant doesn't meet this dietary restriction
      return false;
    }

    return true; // Restaurant meets all dietary restrictions
  }

  /**
   * Check if a cuisine type typically supports a dietary restriction
   */
  private static cuisineSupportsDietaryRestriction(cuisine: string, restriction: string): boolean {
    const restrictionLower = restriction.toLowerCase();
    
    // Vegetarian-friendly cuisines
    if (restrictionLower === 'vegetarian' || restrictionLower === 'vegan') {
      const vegetarianFriendlyCuisines = ['indian', 'mediterranean', 'greek', 'lebanese', 'turkish', 'thai', 'vietnamese'];
      return vegetarianFriendlyCuisines.includes(cuisine);
    }

    // Gluten-free friendly cuisines
    if (restrictionLower === 'gluten-free') {
      const glutenFreeFriendlyCuisines = ['thai', 'vietnamese', 'japanese', 'mediterranean', 'greek'];
      return glutenFreeFriendlyCuisines.includes(cuisine);
    }

    // Dairy-free friendly cuisines
    if (restrictionLower === 'dairy-free') {
      const dairyFreeFriendlyCuisines = ['thai', 'vietnamese', 'japanese', 'chinese', 'indian'];
      return dairyFreeFriendlyCuisines.includes(cuisine);
    }

    // Halal-friendly cuisines
    if (restrictionLower === 'halal') {
      const halalFriendlyCuisines = ['middle eastern', 'lebanese', 'turkish', 'indian', 'pakistani'];
      return halalFriendlyCuisines.includes(cuisine);
    }

    // Kosher-friendly cuisines
    if (restrictionLower === 'kosher') {
      const kosherFriendlyCuisines = ['middle eastern', 'mediterranean', 'greek'];
      return kosherFriendlyCuisines.includes(cuisine);
    }

    return false;
  }

  /**
   * Check if restaurant name indicates dietary support
   */
  private static restaurantNameIndicatesDietarySupport(restaurantName: string, restriction: string): boolean {
    const restrictionLower = restriction.toLowerCase();
    
    // Vegetarian/Vegan indicators
    if (restrictionLower === 'vegetarian' || restrictionLower === 'vegan') {
      const vegetarianIndicators = ['vegetarian', 'vegan', 'plant-based', 'green', 'organic'];
      return vegetarianIndicators.some(indicator => restaurantName.includes(indicator));
    }

    // Gluten-free indicators
    if (restrictionLower === 'gluten-free') {
      const glutenFreeIndicators = ['gluten-free', 'gluten free', 'celiac'];
      return glutenFreeIndicators.some(indicator => restaurantName.includes(indicator));
    }

    // Dairy-free indicators
    if (restrictionLower === 'dairy-free') {
      const dairyFreeIndicators = ['dairy-free', 'dairy free', 'lactose-free'];
      return dairyFreeIndicators.some(indicator => restaurantName.includes(indicator));
    }

    // Halal indicators
    if (restrictionLower === 'halal') {
      const halalIndicators = ['halal', 'islamic'];
      return halalIndicators.some(indicator => restaurantName.includes(indicator));
    }

    // Kosher indicators
    if (restrictionLower === 'kosher') {
      const kosherIndicators = ['kosher', 'jewish'];
      return kosherIndicators.some(indicator => restaurantName.includes(indicator));
    }

    return false;
  }

  /**
   * Get preference score for a restaurant (higher = better match)
   */
  static getPreferenceScore(restaurant: FoodCard, preferences: UserPreferences): number {
    let score = 0;

    // Cuisine preference score
    if (restaurant.cuisine && preferences.cuisinePreferences.includes(restaurant.cuisine)) {
      score += 10;
    }

    // Price range score
    if (restaurant.price && preferences.priceRange.includes(restaurant.price)) {
      score += 5;
    }

    // Rating score
    if (restaurant.rating && restaurant.rating >= preferences.minRating) {
      score += (restaurant.rating - preferences.minRating) * 2;
    }

    // Distance score (closer is better)
    if (restaurant.distance && restaurant.distance <= preferences.maxDistance) {
      score += (preferences.maxDistance - restaurant.distance) * 0.5;
    }

    // Dietary restriction bonus
    if (preferences.dietaryRestrictions.length > 0) {
      if (this.restaurantMeetsDietaryRestrictions(restaurant, preferences.dietaryRestrictions)) {
        score += 15; // High bonus for meeting dietary restrictions
      }
    }

    return score;
  }

  /**
   * Sort restaurants by preference score
   */
  static sortRestaurantsByPreferences(
    restaurants: FoodCard[],
    preferences: UserPreferences
  ): FoodCard[] {
    return restaurants
      .map(restaurant => ({
        ...restaurant,
        recommendationScore: this.getPreferenceScore(restaurant, preferences)
      }))
      .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
  }
}
