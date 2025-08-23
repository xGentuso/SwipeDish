export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  category: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: string[];
}

export class GeocodingService {
  private static readonly BASE_URL = 'https://nominatim.openstreetmap.org';
  private static readonly USER_AGENT = 'SwipeDish/1.0 (React Native App)';

  /**
   * Convert an address string to coordinates (geocoding)
   */
  static async geocodeText(address: string): Promise<GeocodingResult | null> {
    try {
      if (!address || address.trim().length === 0) {
        throw new Error('Address cannot be empty');
      }

      const encodedAddress = encodeURIComponent(address.trim());
      const url = `${this.BASE_URL}/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
      }

      const data: NominatimResult[] = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      if (!result) {
        return null;
      }
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name,
        address: result.address || {},
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Convert coordinates to an address (reverse geocoding)
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      if (!this.isValidCoordinate(latitude, longitude)) {
        throw new Error('Invalid coordinates provided');
      }

      const url = `${this.BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status} ${response.statusText}`);
      }

      const data: NominatimResult = await response.json();

      if (!data) {
        return null;
      }

      return {
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon),
        display_name: data.display_name,
        address: data.address || {},
      };
    } catch (error) {
      console.error('Error reverse geocoding coordinates:', error);
      return null;
    }
  }

  /**
   * Search for places by name and get coordinates
   */
  static async searchPlaces(
    query: string,
    options: {
      countryCode?: string; // e.g., 'us', 'ca'
      limit?: number;
      viewbox?: {
        left: number;
        top: number;
        right: number;
        bottom: number;
      };
    } = {}
  ): Promise<GeocodingResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const { countryCode, limit = 5, viewbox } = options;
      const encodedQuery = encodeURIComponent(query.trim());
      
      let url = `${this.BASE_URL}/search?format=json&q=${encodedQuery}&limit=${limit}&addressdetails=1`;
      
      if (countryCode) {
        url += `&countrycodes=${countryCode}`;
      }
      
      if (viewbox) {
        url += `&viewbox=${viewbox.left},${viewbox.top},${viewbox.right},${viewbox.bottom}&bounded=1`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`Place search API error: ${response.status} ${response.statusText}`);
      }

      const data: NominatimResult[] = await response.json();

      return data.map(result => ({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name,
        address: result.address || {},
      }));
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  /**
   * Get current location address from coordinates
   */
  static async getCurrentLocationAddress(latitude: number, longitude: number): Promise<string> {
    try {
      const result = await this.reverseGeocode(latitude, longitude);
      if (!result) {
        return 'Unknown location';
      }

      // Format a nice address string
      const address = result.address;
      const parts: string[] = [];

      if (address.house_number && address.road) {
        parts.push(`${address.house_number} ${address.road}`);
      } else if (address.road) {
        parts.push(address.road);
      }

      if (address.neighbourhood) {
        parts.push(address.neighbourhood);
      }

      if (address.city) {
        parts.push(address.city);
      } else if (address.county) {
        parts.push(address.county);
      }

      if (address.state) {
        parts.push(address.state);
      }

      return parts.join(', ') || result.display_name;
    } catch (error) {
      console.error('Error getting current location address:', error);
      return 'Unknown location';
    }
  }

  /**
   * Format address for display
   */
  static formatAddress(geocodingResult: GeocodingResult): string {
    const address = geocodingResult.address;
    const parts: string[] = [];

    // Street address
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    // City and state
    const cityState: string[] = [];
    if (address.city) {
      cityState.push(address.city);
    }
    if (address.state) {
      cityState.push(address.state);
    }
    if (cityState.length > 0) {
      parts.push(cityState.join(', '));
    }

    // Postal code
    if (address.postcode) {
      parts.push(address.postcode);
    }

    return parts.join(', ') || geocodingResult.display_name;
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Validate coordinates
   */
  private static isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Convert degrees to radians
   */
  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if geocoding service is available
   */
  static async testConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/status.php`, {
        headers: {
          'User-Agent': this.USER_AGENT,
        },
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.error('Geocoding service connectivity test failed:', error);
      return false;
    }
  }
}
