import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { MODAL_MAP_CONFIG, getDefaultRegion, validateLocation, STANDARD_MARKER_CONFIG } from '../constants/mapConfig';
import { MapsService } from '../services/mapsService';
import { DirectionsChoiceModal } from './DirectionsChoiceModal';
import { MapErrorBoundary } from './MapErrorBoundary';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapModalProps {
  visible: boolean;
  location: Location;
  title?: string;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({
  visible,
  location,
  title,
  onClose,
}) => {
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  // Validate location data and provide fallbacks
  const safeLocation = validateLocation(location);
  
  const [region, setRegion] = useState(getDefaultRegion(safeLocation));

  useEffect(() => {
    if (visible && safeLocation) {
      setRegion(getDefaultRegion(safeLocation));
    }
  }, [visible, safeLocation]);

  // Handle screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const handleDirections = () => {
    setShowDirectionsModal(true);
  };

  const handleOpenInMaps = async () => {
    try {
      await MapsService.openInMaps(location, title);
    } catch (error) {
      Alert.alert('Error', 'Could not open in maps');
    }
  };

  const isLandscape = screenData.width > screenData.height;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onShow={() => StatusBar.setHidden(false)}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <SafeAreaView style={[styles.container, isLandscape && styles.landscapeContainer]} edges={['left', 'right', 'bottom']}>
          {/* Header */}
          <View style={[styles.header, { zIndex: 1000 }]}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onClose}
              accessibilityLabel="Close map"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {title || 'Restaurant Location'}
              </Text>
              {safeLocation.address && (
                <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                  {safeLocation.address}
                </Text>
              )}
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleDirections}
                accessibilityLabel="Get directions"
                accessibilityRole="button"
              >
                <Ionicons name="navigate" size={16} color={colors.text} />
                <Text style={styles.actionText} numberOfLines={1}>Directions</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleOpenInMaps}
                accessibilityLabel="Open in maps app"
                accessibilityRole="button"
              >
                <Ionicons name="open-outline" size={16} color={colors.text} />
                <Text style={styles.actionText} numberOfLines={1}>Open</Text>
              </TouchableOpacity>
            </View>
          </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapErrorBoundary>
            <MapView
              style={styles.map}
              {...MODAL_MAP_CONFIG}
              region={region}
            >
              <Marker
                coordinate={{
                  latitude: safeLocation.latitude,
                  longitude: safeLocation.longitude,
                }}
                title={title || 'Restaurant'}
                description={safeLocation.address}
                {...STANDARD_MARKER_CONFIG}
              />
            </MapView>
          </MapErrorBoundary>
        </View>

        {/* Bottom Info */}
        {!isLandscape && (
          <View style={styles.bottomInfo}>
            <View style={styles.infoContent}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle} numberOfLines={1} ellipsizeMode="tail">
                  {title || 'Restaurant'}
                </Text>
                {safeLocation.address && (
                  <Text style={styles.infoAddress} numberOfLines={1} ellipsizeMode="tail">
                    {safeLocation.address}
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
              <Ionicons name="navigate" size={16} color={colors.text} />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        )}
        </SafeAreaView>
      </View>
      
      {/* Directions Choice Modal */}
      <DirectionsChoiceModal
        visible={showDirectionsModal}
        location={safeLocation}
        title={title}
        onClose={() => setShowDirectionsModal(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#E0E0E0',
    minHeight: 60, // Even more compact
    paddingTop: Platform.OS === 'ios' ? 50 : 10, // Extra padding for dynamic island
    elevation: 2, // Add shadow on Android
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    flexShrink: 0, // Prevent back button from shrinking
    ...shadows.small,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: spacing.xs,
    minWidth: 0, // Allow text to wrap properly
    justifyContent: 'center',
    maxWidth: '40%', // Even more limited content width
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    fontSize: 12, // Very small font size
    lineHeight: 16, // Tight line height
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1, // Minimal spacing
    fontSize: 9, // Tiny subtitle
    lineHeight: 11, // Very tight line height
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0, // Prevent actions from shrinking
    gap: spacing.xs, // Use gap for consistent spacing
    marginLeft: spacing.sm, // Add margin to separate from content
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 4, // Very minimal padding
    paddingVertical: 3, // Very minimal padding
    borderRadius: borderRadius.sm,
    minWidth: 50, // Very small minimum width
    maxWidth: 65, // Very small maximum width
    justifyContent: 'center',
    elevation: 1,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: 1, // Very minimal margin
    fontSize: 9, // Tiny font size
    lineHeight: 11, // Very tight line height
  },
  mapContainer: {
    flex: 1,
    minHeight: 350, // Reduced minimum height to leave more space for bottom info
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    minHeight: 350,
  },
  bottomInfo: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, // Reduced vertical padding
    borderTopWidth: 1,
    borderTopColor: colors.border || '#E0E0E0',
    maxHeight: 120, // Further reduced height
    elevation: 3, // Add shadow on Android
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center', // Center align for better spacing
    marginBottom: spacing.sm, // Reduced margin
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
    minWidth: 0, // Allow text to wrap properly
  },
  infoTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    fontSize: 15, // Slightly smaller
    lineHeight: 18, // Explicit line height
  },
  infoAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontSize: 12, // Smaller font size
    lineHeight: 16, // Tighter line height
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm, // Reduced padding
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  directionsText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
    fontSize: 15, // Slightly smaller for better fit
    lineHeight: 18, // Explicit line height
  },
  landscapeContainer: {
    // Additional styles for landscape mode
    flexDirection: 'column',
  },
});
