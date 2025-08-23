import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { FoodCard } from '../types';

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
  // Safety check
  if (!restaurant || typeof restaurant !== 'object') {
    return null;
  }

  // Safe value extraction with guaranteed string conversion
  const safeTitle = restaurant.title || 'Unknown Restaurant';
  const safeCuisine = restaurant.cuisine || 'Restaurant';
  const safePrice = restaurant.price || 'Price varies';
  const safeRating = restaurant.rating ? restaurant.rating.toFixed(1) : 'N/A';
  const safeDistance = restaurant.distance ? `${restaurant.distance.toFixed(1)}km` : 'Distance unknown';
  const safeDeliveryTime = restaurant.deliveryTime ? `${restaurant.deliveryTime} min` : '';
  const safeAddress = restaurant.location?.address || 'Location unavailable';
  const safeImageUrl = restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPressCard?.(restaurant)}
      activeOpacity={0.9}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: safeImageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{safeRating}</Text>
        </View>

        {/* Open Status */}
        {restaurant.isOpen !== undefined && (
          <View style={[
            styles.statusBadge,
            { backgroundColor: restaurant.isOpen === true ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.statusText}>
              {restaurant.isOpen === true ? 'Open' : 'Closed'}
            </Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {safeTitle}
        </Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle} numberOfLines={1}>
          {safeCuisine} • {safePrice}
        </Text>
        
        {/* Info Row */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{safeDistance}</Text>
          {safeDeliveryTime !== '' && (
            <Text style={styles.infoText}>{safeDeliveryTime}</Text>
          )}
        </View>
        
        {/* Address */}
        <Text style={styles.addressText} numberOfLines={1}>
          {safeAddress}
        </Text>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPressMap?.(restaurant)}
          >
            <Ionicons name="map" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => onPressDirections?.(restaurant)}
          >
            <Ionicons name="navigate" size={16} color={colors.surface} />
            <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
              Directions
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  ratingText: {
    ...typography.caption,
    color: '#FFFFFF',
    marginLeft: spacing.xs,
    fontWeight: '700',
    fontSize: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  addressText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  primaryButtonText: {
    color: colors.surface,
  },
});