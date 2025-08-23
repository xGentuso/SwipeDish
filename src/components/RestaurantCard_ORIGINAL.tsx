import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { FoodCard } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface RestaurantCardProps {
  restaurant: FoodCard;
  onPressMap?: (restaurant: FoodCard) => void;
  onPressDirections?: (restaurant: FoodCard) => void;
  onPressCard?: (restaurant: FoodCard) => void;
  index?: number;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onPressMap,
  onPressDirections,
  onPressCard,
  index = 0,
}) => {
  // Safety check to prevent rendering invalid restaurant data
  if (!restaurant || typeof restaurant !== 'object') {
    return null;
  }
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  // Animate card on mount
  React.useEffect(() => {
    const delay = index * 100;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, [index, opacityAnim, scaleAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleExternalLink = useCallback(async (url?: string) => {
    if (!url) return;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open external link:', error);
    }
  }, []);

  const getFallbackImage = () => {
    if (imageError) {
      return 'https://images.unsplash.com/photo-1541542684-4a76398615e7?w=1200';
    }
    return restaurant.imageUrl;
  };

  const formatDistance = (distance?: number) => {
    if (distance === undefined || distance === null || typeof distance !== 'number') return 'Distance unavailable';
    if (distance === 0) return 'At your location';
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const formatRating = (rating?: number) => {
    if (rating === undefined || rating === null || typeof rating !== 'number') return 'N/A';
    return rating.toFixed(1);
  };

  const getPriceColor = (price?: string) => {
    switch (price) {
      case '$': return colors.success;
      case '$$': return colors.warning;
      case '$$$': return colors.primary;
      case '$$$$': return colors.secondary;
      default: return colors.textSecondary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPressCard?.(restaurant)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getFallbackImage() }}
            style={styles.image}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
          />

          {/* Rating badge */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={colors.primary} />
            <Text style={styles.ratingText}>{formatRating(restaurant.rating)}</Text>
            {restaurant.userRatingsTotal !== undefined && restaurant.userRatingsTotal !== null && typeof restaurant.userRatingsTotal === 'number' && restaurant.userRatingsTotal > 0 && (
              <Text style={styles.ratingCount}>
                ({restaurant.userRatingsTotal > 1000 
                  ? `${(restaurant.userRatingsTotal / 1000).toFixed(1)}k` 
                  : restaurant.userRatingsTotal.toString()})
              </Text>
            )}
          </View>

          {/* Status badges */}
          <View style={styles.statusContainer}>
            {/* Open/Closed status */}
            {restaurant.isOpen !== undefined && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: restaurant.isOpen ? colors.success : colors.error }
              ]}>
                <Ionicons 
                  name={restaurant.isOpen ? "time" : "time-outline"} 
                  size={10} 
                  color={colors.text} 
                />
                <Text style={styles.statusText}>
                  {restaurant.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            )}

            {/* Price indicator */}
            {restaurant.price && typeof restaurant.price === 'string' && restaurant.price.trim() !== '' && (
              <View style={[
                styles.priceBadge,
                { backgroundColor: getPriceColor(restaurant.price) }
              ]}>
                <Text style={styles.priceText}>{restaurant.price}</Text>
              </View>
            )}
          </View>

          {/* Quick actions overlay */}
          <View style={styles.quickActions}>
            {restaurant.externalLinks?.menu && typeof restaurant.externalLinks.menu === 'string' && restaurant.externalLinks.menu.trim() !== '' && (
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleExternalLink(restaurant.externalLinks?.menu)}
              >
                <Ionicons name="restaurant" size={16} color={colors.text} />
              </TouchableOpacity>
            )}
            {restaurant.externalLinks?.delivery && typeof restaurant.externalLinks.delivery === 'string' && restaurant.externalLinks.delivery.trim() !== '' && (
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleExternalLink(restaurant.externalLinks?.delivery)}
              >
                <Ionicons name="bicycle" size={16} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {restaurant.title || 'Restaurant'}
              </Text>
              {restaurant.subtitle && typeof restaurant.subtitle === 'string' && restaurant.subtitle.trim() !== '' && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {restaurant.subtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Description */}
          {restaurant.description && typeof restaurant.description === 'string' && restaurant.description.trim() !== '' && (
            <Text style={styles.description} numberOfLines={2}>
              {restaurant.description}
            </Text>
          )}

          {/* Info Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={14} color={colors.textTertiary} />
              <Text style={styles.infoText}>{formatDistance(restaurant.distance)}</Text>
            </View>
            
            {restaurant.deliveryTime && typeof restaurant.deliveryTime === 'number' && restaurant.deliveryTime > 0 && (
              <View style={styles.infoItem}>
                <Ionicons name="time" size={14} color={colors.textTertiary} />
                <Text style={styles.infoText}>{restaurant.deliveryTime} min</Text>
              </View>
            )}
          </View>

          {/* Address Row */}
          {restaurant.location?.address && typeof restaurant.location.address === 'string' && restaurant.location.address.trim() !== '' && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.addressText} numberOfLines={2}>
                {restaurant.location.address}
              </Text>
            </View>
          )}

          {/* Services */}
          <View style={styles.servicesContainer}>
            {restaurant.services?.delivery === true && (
              <View style={styles.serviceBadge}>
                <Ionicons name="bicycle" size={12} color={colors.primary} />
                <Text style={styles.serviceText}>Delivery</Text>
              </View>
            )}
            {restaurant.services?.takeout === true && (
              <View style={styles.serviceBadge}>
                <Ionicons name="bag" size={12} color={colors.primary} />
                <Text style={styles.serviceText}>Takeout</Text>
              </View>
            )}
            {restaurant.services?.dineIn === true && (
              <View style={styles.serviceBadge}>
                <Ionicons name="restaurant" size={12} color={colors.primary} />
                <Text style={styles.serviceText}>Dine-in</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {restaurant.tags && restaurant.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {restaurant.tags.slice(0, 3).map((tag, tagIndex) => {
                if (!tag || typeof tag !== 'string' || tag.trim() === '') return null;
                return (
                  <View key={tagIndex} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.trim()}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Action Buttons */}
          {restaurant.location && typeof restaurant.location === 'object' && restaurant.location !== null && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onPressMap?.(restaurant)}
              >
                <Ionicons name="map" size={16} color={colors.primary} />
                <Text style={styles.actionButtonText}>View Map</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryActionButton]}
                onPress={() => onPressDirections?.(restaurant)}
              >
                <Ionicons name="navigate" size={16} color={colors.text} />
                <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                  Get Directions
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    ...shadows.small,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  ratingCount: {
    ...typography.caption,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  statusContainer: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  statusText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  priceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  priceText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  quickActions: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  addressText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  serviceText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  tagText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  primaryActionButtonText: {
    color: colors.text,
  },
});
