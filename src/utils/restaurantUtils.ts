import { FoodCard } from '../types';

/**
 * Cleans restaurant data by removing undefined values and providing defaults
 * This prevents Firestore errors when saving restaurant data
 */
export const cleanRestaurantData = (restaurant: FoodCard): FoodCard => {
  return {
    id: restaurant.id,
    type: restaurant.type || 'restaurant',
    title: restaurant.title,
    subtitle: restaurant.subtitle || '',
    description: restaurant.description,
    imageUrl: restaurant.imageUrl,
    rating: restaurant.rating || 0,
    price: restaurant.price || '',
    cuisine: restaurant.cuisine || '',
    distance: restaurant.distance || 0,
    deliveryTime: restaurant.deliveryTime || 0,
    tags: restaurant.tags || [],
    location: restaurant.location || undefined,
    externalLinks: restaurant.externalLinks || {},
    services: restaurant.services || {},
    isOpen: restaurant.isOpen ?? false,
  };
};
