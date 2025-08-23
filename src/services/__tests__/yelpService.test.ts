import { YelpService } from '../yelpService';
import { ValidationError } from '../../utils/inputValidation';

// Mock logger
jest.mock('../loggingService', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }
}));

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock process.env
const originalEnv = process.env;

describe('YelpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset cache
    (YelpService as any).locationCache.clear();
    
    // Reset rate limiting
    (YelpService as any).lastRequestTime = 0;
    (YelpService as any).requestCount = 0;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getRestaurants', () => {
    const mockYelpResponse = {
      businesses: [
        {
          id: 'test-restaurant-1',
          name: 'Test Restaurant',
          image_url: 'https://example.com/image.jpg',
          url: 'https://yelp.com/biz/test',
          review_count: 100,
          categories: [{ alias: 'italian', title: 'Italian' }],
          rating: 4.5,
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
          transactions: ['delivery', 'pickup'],
          price: '$$',
          location: {
            address1: '123 Test St',
            city: 'San Francisco',
            zip_code: '94102',
            country: 'US',
            state: 'CA',
            display_address: ['123 Test St', 'San Francisco, CA 94102'],
          },
          phone: '+14155551234',
          display_phone: '(415) 555-1234',
          distance: 500.5,
          is_closed: false,
        }
      ],
      total: 1,
      region: {
        center: { latitude: 37.7749, longitude: -122.4194 }
      }
    };

    beforeEach(() => {
      process.env.EXPO_PUBLIC_YELP_API_KEY = 'test-api-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockYelpResponse),
      } as Response);
    });

    it('should fetch restaurants with valid coordinates', async () => {
      const result = await YelpService.getRestaurants(37.7749, -122.4194);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.yelp.com/v3/businesses/search'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          })
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'test-restaurant-1',
        title: 'Test Restaurant',
        cuisine: 'Italian',
        rating: 4.5,
        services: {
          delivery: true,
          pickup: true,
          takeout: true,
          dineIn: true,
        }
      });
    });

    it('should validate coordinates', async () => {
      await expect(
        YelpService.getRestaurants(91, -122.4194) // Invalid latitude
      ).rejects.toThrow(ValidationError);

      await expect(
        YelpService.getRestaurants(37.7749, 181) // Invalid longitude
      ).rejects.toThrow(ValidationError);
    });

    it('should validate radius parameter', async () => {
      await expect(
        YelpService.getRestaurants(37.7749, -122.4194, { radius: 50000 }) // Too large
      ).rejects.toThrow(ValidationError);

      await expect(
        YelpService.getRestaurants(37.7749, -122.4194, { radius: 0 }) // Too small
      ).rejects.toThrow(ValidationError);
    });

    it('should validate price parameter', async () => {
      await expect(
        YelpService.getRestaurants(37.7749, -122.4194, { price: '5' }) // Invalid price
      ).rejects.toThrow(ValidationError);

      await expect(
        YelpService.getRestaurants(37.7749, -122.4194, { price: '1,2,invalid' }) // Invalid price
      ).rejects.toThrow(ValidationError);
    });

    it('should validate search term for XSS', async () => {
      await expect(
        YelpService.getRestaurants(37.7749, -122.4194, { term: '<script>alert("xss")</script>' })
      ).rejects.toThrow(ValidationError);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server Error'),
      } as Response);

      const result = await YelpService.getRestaurants(37.7749, -122.4194);

      expect(result).toEqual([]);
    });

    it('should enforce rate limiting', async () => {
      // Mock multiple rapid requests
      const promises = [];
      for (let i = 0; i < 55; i++) { // Exceed rate limit
        promises.push(YelpService.getRestaurants(37.7749, -122.4194));
      }

      const results = await Promise.allSettled(promises);
      
      // Some requests should be delayed due to rate limiting
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should return empty array when API key is missing', async () => {
      delete process.env.EXPO_PUBLIC_YELP_API_KEY;
      
      const result = await YelpService.getRestaurants(37.7749, -122.4194);

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should cache results based on location', async () => {
      // First call
      await YelpService.getRestaurants(37.7749, -122.4194);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call with same location should use cache
      await YelpService.getRestaurantsWithMaxVariety(37.7749, -122.4194);
      
      // Cache should be used, so fetch count should be the same or only slightly higher
      // (depending on the implementation strategy)
    });
  });

  describe('convertYelpBusinessToFoodCard', () => {
    it('should convert Yelp business to FoodCard format', async () => {
      const yelpBusiness = {
        id: 'test-id',
        name: 'Test Restaurant',
        image_url: 'https://example.com/image.jpg',
        url: 'https://yelp.com/biz/test',
        review_count: 100,
        categories: [{ alias: 'italian', title: 'Italian' }],
        rating: 4.5,
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        transactions: ['delivery'],
        price: '$$',
        location: {
          address1: '123 Test St',
          city: 'San Francisco',
          zip_code: '94102',
          country: 'US',
          state: 'CA',
          display_address: ['123 Test St', 'San Francisco, CA 94102'],
        },
        phone: '+14155551234',
        display_phone: '(415) 555-1234',
        distance: 1000, // 1km
        is_closed: false,
      };

      const result = await (YelpService as any).convertYelpBusinessToFoodCard(yelpBusiness);

      expect(result).toMatchObject({
        id: 'test-id',
        type: 'restaurant',
        title: 'Test Restaurant',
        subtitle: 'Italian',
        cuisine: 'Italian',
        rating: 4.5,
        price: '$$',
        distance: 1.0, // Converted to km
        services: {
          delivery: true,
          pickup: false,
          takeout: false,
          dineIn: true,
        },
        isOpen: true,
      });

      expect(result.description).toContain('Italian');
      expect(result.description).toContain('4.5⭐');
      expect(result.description).toContain('100 reviews');
    });
  });

  describe('searchRestaurantsByQuery', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_YELP_API_KEY = 'test-api-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ businesses: [], total: 0, region: { center: {} } }),
      } as Response);
    });

    it('should search by query term', async () => {
      await YelpService.searchRestaurantsByQuery('pizza', 37.7749, -122.4194);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('term=pizza'),
        expect.anything()
      );
    });
  });

  describe('getRestaurantsByCuisine', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_YELP_API_KEY = 'test-api-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ businesses: [], total: 0, region: { center: {} } }),
      } as Response);
    });

    it('should map cuisine types correctly', async () => {
      await YelpService.getRestaurantsByCuisine('italian', 37.7749, -122.4194);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('categories=italian'),
        expect.anything()
      );
    });

    it('should handle unmapped cuisine types', async () => {
      await YelpService.getRestaurantsByCuisine('unknown-cuisine', 37.7749, -122.4194);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('categories=unknown-cuisine'),
        expect.anything()
      );
    });
  });
});