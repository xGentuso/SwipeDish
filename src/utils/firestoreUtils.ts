/**
 * Firestore utilities for handling data serialization
 * Firestore doesn't allow undefined values - they must be null or omitted
 */

import { FoodCard } from '../types';

/**
 * Recursively removes undefined values from an object
 * Converts undefined to null for Firestore compatibility
 */
export function removeUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned as T;
  }
  
  return obj;
}

/**
 * Cleans restaurant data for Firestore storage
 * Ensures all undefined values are properly handled
 */
export function cleanRestaurantForFirestore(restaurant: FoodCard): any {
  const cleaned = {
    id: restaurant.id,
    type: restaurant.type || 'restaurant',
    title: restaurant.title,
    subtitle: restaurant.subtitle || '',
    description: restaurant.description,
    imageUrl: restaurant.imageUrl,
    rating: restaurant.rating ?? 0,
    price: restaurant.price || '',
    cuisine: restaurant.cuisine || '',
    distance: restaurant.distance ?? 0,
    deliveryTime: restaurant.deliveryTime ?? 0,
    tags: restaurant.tags || [],
    isOpen: restaurant.isOpen ?? true,
  };

  // Only add optional fields if they have actual values
  if (restaurant.location) {
    (cleaned as any).location = removeUndefinedValues(restaurant.location);
  }

  if (restaurant.externalLinks) {
    (cleaned as any).externalLinks = removeUndefinedValues(restaurant.externalLinks);
  }

  if (restaurant.services) {
    (cleaned as any).services = removeUndefinedValues(restaurant.services);
  }

  if (restaurant.userRatingsTotal !== undefined && restaurant.userRatingsTotal !== null) {
    (cleaned as any).userRatingsTotal = restaurant.userRatingsTotal;
  }

  // if (restaurant.menu) {
  //   (cleaned as any).menu = removeUndefinedValues(restaurant.menu);
  // }

  return cleaned;
}