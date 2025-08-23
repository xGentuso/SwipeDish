import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MapsService } from '../services/mapsService';
import { MapModal } from './MapModal';
import { DirectionsChoiceModal } from './DirectionsChoiceModal';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { FoodCard } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useSwipePerformanceMonitoring } from '../hooks/useSwipePerformanceMonitoring';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = SCREEN_WIDTH < 375;
const isLargeScreen = SCREEN_WIDTH > 414;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ROTATION_ANGLE = 10;

interface SwipeCardProps {
  card: FoodCard;
  isFirst: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ card, isFirst, onSwipe }) => {
  // Enhanced null checking
  if (!card || !card.id || !card.title) {
    console.warn('SwipeCard: Invalid card data provided');
    return null;
  }

  const [showMapModal, setShowMapModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  const [enhancedDescription, setEnhancedDescription] = useState<string | null>(null);
  const { isFavorite, addToFavorites, removeFromFavorites } = useAppStore();
  const { startGestureTracking, endGestureTracking } = useSwipePerformanceMonitoring();

  // Safe card data with defaults
  const safeCard = {
    id: card.id,
    title: card.title || 'Unknown Restaurant',
    description: card.description || 'Popular restaurant nearby',
    imageUrl: card.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    rating: typeof card.rating === 'number' ? card.rating : 0,
    price: card.price || 'N/A',
    cuisine: card.cuisine || 'Unknown',
    distance: typeof card.distance === 'number' ? card.distance : 0,
    deliveryTime: typeof card.deliveryTime === 'number' ? card.deliveryTime : 0,
    isOpen: card.isOpen ?? true,
    userRatingsTotal: typeof card.userRatingsTotal === 'number' ? card.userRatingsTotal : 0,
    tags: Array.isArray(card.tags) ? card.tags.filter(tag => tag && typeof tag === 'string') : [],
    location: card.location || { latitude: 0, longitude: 0, address: 'Unknown location' },
    services: card.services || { takeout: false, delivery: false, dineIn: true, pickup: false },
    externalLinks: card.externalLinks || {},
    // menu: card.menu,
  };

  // Debug logging
  useEffect(() => {
    console.log(`SwipeCard: Rendered for ${safeCard.title}, isFirst: ${isFirst}`);
  }, [safeCard.title, isFirst]);

  // Additional debug logging for gesture handler
  useEffect(() => {
    if (isFirst) {
      console.log(`SwipeCard: First card ready for gestures - ${safeCard.title}`);
    }
  }, [isFirst, safeCard.title]);
  
  // Utility function to truncate long restaurant names intelligently
  const truncateRestaurantName = (name: string, maxLength: number = 40) => {
    if (name.length <= maxLength) return name;
    
    // Try to truncate at a word boundary
    const words = name.split(' ');
    let truncated = '';
    
    for (const word of words) {
      if ((truncated + ' ' + word).length <= maxLength - 3) {
        truncated += (truncated ? ' ' : '') + word;
      } else {
        break;
      }
    }
    
    return truncated ? truncated + '...' : name.substring(0, maxLength - 3) + '...';
  };
  

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(isFirst ? 1 : 0.95);
  const opacity = useSharedValue(isFirst ? 1 : 0.35);

  // When a background card becomes the first card, update its animated values
  useEffect(() => {
    if (isFirst) {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
      

    } else {
      opacity.value = withTiming(0.35, { duration: 150 });
      scale.value = withTiming(0.95, { duration: 150 });
    }
  }, [isFirst, safeCard.id, safeCard.description, enhancedDescription]);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (event) => {
      try {
        console.log('SwipeCard: Gesture started, isFirst:', isFirst, 'event:', event);
        if (isFirst) {
          scale.value = withSpring(1.05);
          runOnJS(startGestureTracking)();
        }
      } catch (error) {
        console.error('SwipeCard: Error in gesture start:', error);
      }
    },
    onActive: (event) => {
      try {
        if (isFirst) {
          translateX.value = event.translationX;
          translateY.value = event.translationY;
          console.log('SwipeCard: Gesture active, translationX:', event.translationX, 'translationY:', event.translationY);
        }
      } catch (error) {
        console.error('SwipeCard: Error in gesture active:', error);
      }
    },
    onEnd: (event) => {
      try {
        console.log('SwipeCard: Gesture ended, isFirst:', isFirst, 'translationX:', event.translationX, 'velocityX:', event.velocityX);
        if (isFirst) {
        // Enhanced swipe detection with multiple criteria
        const translationThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;
        const velocityThreshold = Math.abs(event.velocityX) > 500;
        const velocityThresholdLow = Math.abs(event.velocityX) > 200; // Lower threshold for quick swipes
        const shouldSwipe = translationThreshold || velocityThreshold || (velocityThresholdLow && Math.abs(event.translationX) > SWIPE_THRESHOLD * 0.5);
        
        console.log(`SwipeCard: Should swipe: ${shouldSwipe}, threshold: ${SWIPE_THRESHOLD}, velocity: ${event.velocityX}, translation: ${event.translationX}`);
        
        if (shouldSwipe) {
          const direction = event.translationX > 0 ? 'right' : 'left';
          console.log(`SwipeCard: Swiping ${direction}`);
          
          // Track performance metrics
          runOnJS(endGestureTracking)(event.velocityX, event.translationX, direction, true);
          
          // Trigger haptic feedback
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
          
          // Enhanced animation with haptic feedback
          translateX.value = withTiming(
            Math.sign(event.translationX) * SCREEN_WIDTH * 1.5,
            { duration: 250 },
            () => {
              runOnJS(onSwipe)(direction);
            }
          );
          translateY.value = withTiming(0, { duration: 250 });
        } else {
          // Track failed swipe attempt
          const direction = event.translationX > 0 ? 'right' : 'left';
          runOnJS(endGestureTracking)(event.velocityX, event.translationX, direction, false);
          
          // Smooth return animation
          translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
          translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        }
        
        scale.value = withSpring(1);
      }
      } catch (error) {
        console.error('SwipeCard: Error in gesture end:', error);
        // Reset position on error
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    },
    onFail: (event) => {
      console.log('SwipeCard: Gesture failed:', event);
      // Reset position on gesture failure
      if (isFirst) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    },
    onCancel: (event) => {
      console.log('SwipeCard: Gesture cancelled:', event);
      // Reset position on gesture cancellation
      if (isFirst) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    },
  });

  const rStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const likeOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SCREEN_WIDTH / 4],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const dislikeOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 4, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const renderCardContent = useCallback(() => {
    if (!safeCard) return null;
    
    return (
      <View style={styles.cardContainer}>
        <Image source={{ uri: safeCard.imageUrl }} style={styles.cardImage} />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
                    {/* Title and Status Badge */}
        <View style={styles.titleRow}>
          <Text 
            style={styles.cardTitle} 
            numberOfLines={2} 
            ellipsizeMode="tail"
            adjustsFontSizeToFit={false}
          >
            {safeCard.title.length > 50 ? truncateRestaurantName(safeCard.title) : safeCard.title}
          </Text>
          <View style={[styles.openBadge, { backgroundColor: safeCard.isOpen ? 'rgba(0,210,106,0.2)' : 'rgba(244,67,54,0.2)', borderColor: safeCard.isOpen ? colors.like : colors.dislike }]}>
            <Ionicons name={safeCard.isOpen ? 'time' : 'close'} size={12} color={safeCard.isOpen ? colors.like : colors.dislike} />
            <Text style={[styles.openBadgeText, { color: safeCard.isOpen ? colors.like : colors.dislike }]}>
              {safeCard.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
            
            {/* Address */}
            <Text style={styles.cardAddress} numberOfLines={1} ellipsizeMode="tail">
              {(() => {
                if (safeCard.location?.address && safeCard.location.address.trim()) {
                  if (safeCard.location.address.length > 60) {
                    return safeCard.location.address.substring(0, 57) + '...';
                  }
                  return safeCard.location.address;
                } else if (safeCard.location?.latitude && safeCard.location?.longitude) {
                  return `Location: ${safeCard.location.latitude.toFixed(4)}, ${safeCard.location.longitude.toFixed(4)}`;
                } else {
                  return 'Address available on Google Maps';
                }
              })()}
            </Text>
            
            {/* Description */}
            <Text style={styles.cardDescription} numberOfLines={2} ellipsizeMode="tail">
              {enhancedDescription || safeCard.description || 'Popular restaurant nearby'}
            </Text>
          </View>
          
          {/* Service Availability Chips */}
          {safeCard.services && typeof safeCard.services === 'object' && safeCard.services !== null && (
            <View style={styles.serviceChipsContainer}>
              <View style={[styles.serviceChip, safeCard.services.takeout ? styles.serviceChipActive : styles.serviceChipInactive]}>
                <Ionicons name="bag-outline" size={14} color={safeCard.services.takeout ? colors.primary : colors.textTertiary} />
                <Text style={[styles.serviceChipText, { color: safeCard.services.takeout ? colors.primary : colors.textTertiary }]}>Takeout</Text>
              </View>
              <View style={[styles.serviceChip, safeCard.services.delivery ? styles.serviceChipActive : styles.serviceChipInactive]}>
                <Ionicons name="car-outline" size={14} color={safeCard.services.delivery ? colors.primary : colors.textTertiary} />
                <Text style={[styles.serviceChipText, { color: safeCard.services.delivery ? colors.primary : colors.textTertiary }]}>Delivery</Text>
              </View>
              <View style={[styles.serviceChip, safeCard.services.dineIn ? styles.serviceChipActive : styles.serviceChipInactive]}>
                <Ionicons name="restaurant-outline" size={14} color={safeCard.services.dineIn ? colors.primary : colors.textTertiary} />
                <Text style={[styles.serviceChipText, { color: safeCard.services.dineIn ? colors.primary : colors.textTertiary }]}>Dine-in</Text>
              </View>
            </View>
          )}
          
          {/* Compact Meta Row */}
          <View style={styles.metaRow}>
            {(() => {
              const elements = [];
              
              if (safeCard.price) {
                elements.push(<Text key="price" style={styles.metaText}>{safeCard.price}</Text>);
              }
              
              if (safeCard.price && (safeCard.cuisine !== 'Restaurant' || safeCard.distance)) {
                elements.push(<Text key="sep1" style={styles.metaSeparator}>•</Text>);
              }
              
              if (safeCard.cuisine && safeCard.cuisine !== 'Restaurant') {
                elements.push(<Text key="cuisine" style={styles.metaText}>{safeCard.cuisine}</Text>);
              }
              
              if (safeCard.cuisine && safeCard.cuisine !== 'Restaurant' && safeCard.distance) {
                elements.push(<Text key="sep2" style={styles.metaSeparator}>•</Text>);
              }
              
              if (safeCard.distance) {
                elements.push(<Text key="distance" style={styles.metaText}>~{safeCard.distance ? `${safeCard.distance}km` : '0km'}</Text>);
              }
              
              return elements;
            })()}
          </View>
          

          
                    <View style={styles.cardFooter}>
            {/* Rating */}
            {safeCard.rating !== undefined && safeCard.rating !== null && typeof safeCard.rating === 'number' && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={colors.primary} />
                <Text style={styles.ratingText}>
                  {safeCard.rating ? safeCard.rating.toFixed(1) : 'N/A'}
                  {safeCard.userRatingsTotal && typeof safeCard.userRatingsTotal === 'number' && safeCard.userRatingsTotal > 0 ? ` (${safeCard.userRatingsTotal})` : ''}
                </Text>
              </View>
            )}
            
            {/* Feature Tags */}
            <View style={styles.tagsContainer}>
              {safeCard.tags?.slice(0, 3).map((tag, index) => {
                if (!tag || typeof tag !== 'string') return null;
                return (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.replaceAll('_',' ')}</Text>
                  </View>
                );
              })}
            </View>
              
              {/* Action Buttons */}
              <View style={styles.mapButtonsContainer}>
                {/* Always show Map and Directions buttons, create default location if needed */}
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => setShowMapModal(true)}
                >
                  <Ionicons name="map" size={16} color={colors.primary} />
                  <Text style={styles.mapButtonText}>Map</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => setShowDirectionsModal(true)}
                >
                  <Ionicons name="navigate" size={16} color={colors.primary} />
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </View>
            

          </View>
        </View>
      </View>
    );
  }, [safeCard]);

  return (
    <>
      <PanGestureHandler 
        onGestureEvent={gestureHandler} 
        enabled={isFirst}
        activeOffsetX={[-10, 10]}
        activeOffsetY={[-10, 10]}
        shouldCancelWhenOutside={false}
      >
        <Animated.View style={[styles.container, rStyle]}>
          
          {renderCardContent()}
          
          {/* Like indicator */}
          <Animated.View style={[styles.indicator, styles.likeIndicator, likeOpacity]}>
            <Ionicons name="heart" size={40} color={colors.like} />
            <Text style={styles.indicatorText}>LIKE</Text>
          </Animated.View>
          
          {/* Dislike indicator */}
          <Animated.View style={[styles.indicator, styles.dislikeIndicator, dislikeOpacity]}>
            <Ionicons name="close" size={40} color={colors.dislike} />
            <Text style={styles.indicatorText}>NOPE</Text>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Map Modal */}
      <MapModal
        visible={showMapModal}
        location={safeCard.location || { 
          latitude: 43.1599795, 
          longitude: -79.2470299, 
          address: safeCard.title 
        }}
        title={safeCard.title}
        onClose={() => setShowMapModal(false)}
      />
      
      {/* Directions Choice Modal */}
      <DirectionsChoiceModal
        visible={showDirectionsModal}
        location={safeCard.location || { 
          latitude: 43.1599795, 
          longitude: -79.2470299, 
          address: safeCard.title 
        }}
        title={safeCard.title}
        onClose={() => setShowDirectionsModal(false)}
      />
      

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: SCREEN_WIDTH - spacing.md * 2,
    height: SCREEN_HEIGHT * 0.6,
    zIndex: 1,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.large,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: isSmallScreen ? spacing.sm : spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    minHeight: isSmallScreen ? '35%' : '40%', // Adjust for screen size
    // Remove maxHeight and overflow to ensure buttons are visible
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 24, // Ensure proper line height for multi-line titles
  },
  cardSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.text,
    opacity: 0.9,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    flexShrink: 1, // Allow description to shrink if needed
  },
  cardAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    flexShrink: 1, // Allow address to shrink if needed
  },
  cardFooter: {
    flexDirection: 'column',
    marginTop: spacing.xs, // Reduce top margin to save space
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  ratingText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  priceText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  distanceText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.xs, // Reduce margin
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
    flexShrink: 0, // Prevent badge from shrinking
  },
  openBadgeText: {
    ...typography.caption,
    marginLeft: 4,
    fontSize: 10, // Ensure small but readable text
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    top: 50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 4,
    transform: [{ rotate: '-15deg' }],
  },
  likeIndicator: {
    right: 20,
    borderColor: colors.like,
    backgroundColor: 'rgba(0, 210, 106, 0.1)',
  },
  dislikeIndicator: {
    left: 20,
    borderColor: colors.dislike,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  indicatorText: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  externalLinks: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  externalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  externalLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 90, // Ensure consistent button size
    justifyContent: 'center',
    flex: 0, // Don't grow to fill space
  },
  directionsText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },

  mapButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs, // Add bottom margin to ensure visibility
    flexWrap: 'wrap', // Allow buttons to wrap on smaller screens
    gap: spacing.xs, // Modern gap property for better spacing
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 70, // Ensure consistent button size
    justifyContent: 'center',
    flex: 0, // Don't grow to fill space
  },
  mapButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  serviceChipsContainer: {
    flexDirection: 'row',
    marginTop: spacing.xs, // Reduce margin
    marginBottom: spacing.xs,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginRight: spacing.xs,
    borderWidth: 1,
  },
  serviceChipActive: {
    backgroundColor: 'rgba(255, 77, 90, 0.15)',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  serviceChipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: colors.textTertiary,
    borderWidth: 1,
  },
  serviceChipText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs, // Reduce margin
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaSeparator: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginHorizontal: spacing.xs,
  },
});
