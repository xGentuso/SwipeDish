import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { PREVIEW_MAP_CONFIG, getDefaultRegion, validateLocation, STANDARD_MARKER_CONFIG } from '../constants/mapConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapPreviewProps {
  location: Location;
  title?: string;
  onPress?: () => void;
  height?: number;
  width?: number;
}

export const MapPreview: React.FC<MapPreviewProps> = ({
  location,
  title,
  onPress,
  height = 120,
  width = SCREEN_WIDTH - spacing.md * 2,
}) => {
  // Validate location data and provide fallbacks
  const safeLocation = validateLocation(location);

  const [region, setRegion] = useState({
    ...getDefaultRegion(safeLocation),
    latitudeDelta: 0.005, // Tighter zoom for preview
    longitudeDelta: 0.005,
  });

  useEffect(() => {
    setRegion({
      ...getDefaultRegion(safeLocation),
      latitudeDelta: 0.005, // Tighter zoom for preview
      longitudeDelta: 0.005,
    });
  }, [safeLocation]);

  return (
    <TouchableOpacity
      style={[styles.container, { height, width }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MapView
        style={styles.map}
        {...PREVIEW_MAP_CONFIG}
        region={region}
      >
        <Marker
          coordinate={{
            latitude: safeLocation.latitude,
            longitude: safeLocation.longitude,
          }}
          title={title || 'Restaurant'}
          {...STANDARD_MARKER_CONFIG}
        />
      </MapView>
      
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.overlayText}>Tap to view full map</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  overlayText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
