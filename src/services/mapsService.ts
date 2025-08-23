import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export class MapsService {
  /**
   * Open directions to a restaurant using the device's default maps app
   */
  static async openDirections(destination: Location, destinationName?: string): Promise<void> {
    const { latitude, longitude } = destination;
    const name = destinationName || 'Restaurant';
    
    try {
      if (Platform.OS === 'ios') {
        // iOS: Use Apple Maps
        const url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
        await Linking.openURL(url);
      } else if (Platform.OS === 'android') {
        // Android: Use Google Maps
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        await Linking.openURL(url);
      } else {
        // Web: Use Google Maps
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open directions:', error);
      // Fallback to Google Maps web
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      await Linking.openURL(url);
    }
  }

  /**
   * Open directions in Google Maps specifically
   */
  static async openGoogleMapsDirections(destination: Location, destinationName?: string): Promise<void> {
    const { latitude, longitude } = destination;
    const name = destinationName || 'Restaurant';
    
    try {
      // Always use Google Maps
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open Google Maps directions:', error);
      throw error;
    }
  }

  /**
   * Open directions in Apple Maps (iOS only)
   */
  static async openAppleMapsDirections(destination: Location, destinationName?: string): Promise<void> {
    const { latitude, longitude } = destination;
    const name = destinationName || 'Restaurant';
    
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Maps is only available on iOS');
    }
    
    try {
      const url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open Apple Maps directions:', error);
      throw error;
    }
  }

  /**
   * Open the restaurant location in maps
   */
  static async openInMaps(location: Location, name?: string): Promise<void> {
    const { latitude, longitude } = location;
    const restaurantName = name || 'Restaurant';
    
    try {
      if (Platform.OS === 'ios') {
        // iOS: Use Apple Maps
        const url = `http://maps.apple.com/?q=${encodeURIComponent(restaurantName)}&ll=${latitude},${longitude}`;
        await Linking.openURL(url);
      } else if (Platform.OS === 'android') {
        // Android: Use Google Maps
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantName)}@${latitude},${longitude}`;
        await Linking.openURL(url);
      } else {
        // Web: Use Google Maps
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantName)}@${latitude},${longitude}`;
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open in maps:', error);
      // Fallback to Google Maps web
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantName)}@${latitude},${longitude}`;
      await Linking.openURL(url);
    }
  }

  /**
   * Get estimated travel time and distance (requires Google Maps API)
   */
  static async getTravelInfo(
    origin: Location,
    destination: Location,
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
  ): Promise<{ duration: string; distance: string } | null> {
    // This would require Google Maps Directions API
    // For now, return null - you can implement this later with API key
    return null;
  }

  /**
   * Check if maps apps are available
   */
  static async canOpenMaps(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await Linking.canOpenURL('http://maps.apple.com/');
      } else if (Platform.OS === 'android') {
        return await Linking.canOpenURL('https://www.google.com/maps/');
      }
      return true; // Web always works
    } catch {
      return false;
    }
  }
}
