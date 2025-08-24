import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { EMBEDDED_MAP_CONFIG, getDefaultRegion, validateLocation, STANDARD_MARKER_CONFIG } from '../constants/mapConfig';
import { MapsService } from '../services/mapsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface EmbeddedMapProps {
  location: Location;
  title?: string;
  onClose?: () => void;
  showDirections?: boolean;
  height?: number;
}

export const EmbeddedMap: React.FC<EmbeddedMapProps> = ({
  location,
  title,
  onClose,
  showDirections = true,
  height = 300,
}) => {
  // Validate location data and provide fallbacks
  const safeLocation = validateLocation(location);

  const [region, setRegion] = useState(getDefaultRegion(safeLocation));

  useEffect(() => {
    setRegion(getDefaultRegion(safeLocation));
  }, [safeLocation]);

  const handleDirections = async () => {
    try {
      await MapsService.openDirections(location, title);
    } catch (error) {
      Alert.alert('Error', 'Could not open directions');
    }
  };

  const handleOpenInMaps = async () => {
    try {
      await MapsService.openInMaps(location, title);
    } catch (error) {
      Alert.alert('Error', 'Could not open in maps');
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Restaurant Location'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          {showDirections && (
            <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
              <Ionicons name="navigate" size={18} color={colors.primary} />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenInMaps}>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>Open</Text>
          </TouchableOpacity>
          
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          {...EMBEDDED_MAP_CONFIG}
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
      </View>

      {/* Address */}
      {safeLocation.address && (
        <View style={styles.addressContainer}>
          <Text style={styles.addressText} numberOfLines={2}>
            {safeLocation.address}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  addressContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  addressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
