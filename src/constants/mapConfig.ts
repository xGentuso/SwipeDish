import { Platform } from 'react-native';
import { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from './styles';

export const MAP_PROVIDERS = {
  DEFAULT: PROVIDER_DEFAULT,
  GOOGLE: PROVIDER_GOOGLE,
} as const;

/**
 * Standardized map provider selection
 * Uses PROVIDER_DEFAULT for now to avoid Google Maps configuration issues
 * Can be switched to PROVIDER_GOOGLE after proper native rebuild
 */
export const getMapProvider = () => {
  // Always use default provider for now to avoid configuration issues
  return MAP_PROVIDERS.DEFAULT;
};

/**
 * Standard map configuration for all map components
 */
export const STANDARD_MAP_CONFIG = {
  provider: getMapProvider(),
  mapType: 'standard' as const,
  showsUserLocation: true,
  showsMyLocationButton: false, // Disabled to avoid permissions issues
  showsCompass: true,
  showsScale: false, // Disabled for cleaner UI
  showsTraffic: false, // Disabled for better performance
  showsBuildings: false, // Disabled for better performance
  loadingEnabled: true,
  loadingIndicatorColor: colors.primary,
  loadingBackgroundColor: colors.surface,
  zoomEnabled: true,
  scrollEnabled: true,
  rotateEnabled: true,
  pitchEnabled: true,
};

/**
 * Configuration for preview maps (non-interactive)
 */
export const PREVIEW_MAP_CONFIG = {
  ...STANDARD_MAP_CONFIG,
  showsUserLocation: false,
  showsMyLocationButton: false,
  showsCompass: false,
  scrollEnabled: false,
  zoomEnabled: false,
  rotateEnabled: false,
  pitchEnabled: false,
  toolbarEnabled: false,
};

/**
 * Configuration for embedded maps (small interactive maps)
 */
export const EMBEDDED_MAP_CONFIG = {
  ...STANDARD_MAP_CONFIG,
  showsMyLocationButton: false,
  showsScale: false,
};

/**
 * Configuration for modal maps (full-screen interactive maps)
 */
export const MODAL_MAP_CONFIG = {
  ...STANDARD_MAP_CONFIG,
  showsMyLocationButton: false,
  showsCompass: true,
  showsScale: false,
};

/**
 * Standard map styling
 */
export const MAP_STYLES = {
  flex: 1,
  minHeight: 200,
} as const;

/**
 * Standard region settings
 */
export const getDefaultRegion = (location: { latitude: number; longitude: number }) => ({
  latitude: location.latitude,
  longitude: location.longitude,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
});

/**
 * Standard marker configuration
 */
export const STANDARD_MARKER_CONFIG = {
  pinColor: colors.primary,
  
};

/**
 * Fallback location (Hamilton, ON) for when user location is unavailable
 */
export const FALLBACK_LOCATION = {
  latitude: 43.1599795,
  longitude: -79.2470299,
  address: 'Location not available'
};

/**
 * Validate location data and provide fallback
 */
export const validateLocation = (location: { latitude: number; longitude: number; address?: string }) => {
  const isValid = location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number' &&
    !isNaN(location.latitude) && 
    !isNaN(location.longitude) &&
    location.latitude >= -90 && location.latitude <= 90 &&
    location.longitude >= -180 && location.longitude <= 180;

  return isValid ? location : FALLBACK_LOCATION;
};