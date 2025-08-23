import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';

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
  const isValidLocation = location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number' &&
    !isNaN(location.latitude) && 
    !isNaN(location.longitude) &&
    location.latitude >= -90 && location.latitude <= 90 &&
    location.longitude >= -180 && location.longitude <= 180;

  const defaultLocation = { 
    latitude: 43.1599795, 
    longitude: -79.2470299,
    address: 'Location not available'
  }; // Hamilton, ON
  const safeLocation = isValidLocation ? location : defaultLocation;

  const [region, setRegion] = useState({
    latitude: safeLocation.latitude,
    longitude: safeLocation.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  useEffect(() => {
    setRegion({
      latitude: safeLocation.latitude,
      longitude: safeLocation.longitude,
      latitudeDelta: 0.005,
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
        provider={PROVIDER_GOOGLE}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        mapType="standard"
      >
        <Marker
          coordinate={{
            latitude: safeLocation.latitude,
            longitude: safeLocation.longitude,
          }}
          title={title || 'Restaurant'}
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
