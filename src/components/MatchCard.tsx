import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { Match, FoodCard } from '../types';
import { MapsService } from '../services/mapsService';


interface MatchCardProps {
  match: Match & { card: FoodCard };
  onPress?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

const { width } = Dimensions.get('window');

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onPress,
  onShare,
  onFavorite,
  isFavorite = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);


  // Animations
  const scaleAnim = new Animated.Value(1);
  const heartAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.();
  };

  const handleFavorite = () => {
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    onFavorite?.();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleGetDirections = async () => {
    try {
      if (match.card.location) {
        await MapsService.openDirections(match.card.location, match.card.title);
      } else {
        Alert.alert('Location Unavailable', 'No location information available for this restaurant.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open directions');
    }
  };



  const handleOrder = async () => {
    const orderOptions = [];
    
    if (match.card.services?.delivery) {
      orderOptions.push({ text: 'Delivery Apps', onPress: () => openOrderingApps() });
    }
    
    if (match.card.phone) {
      orderOptions.push({ text: 'Call Restaurant', onPress: () => callRestaurant(match.card.phone!) });
    }
    
    if (orderOptions.length === 0) {
      Alert.alert('Order Unavailable', 'No ordering options available for this restaurant.');
      return;
    }
    
    Alert.alert(
      'Order Options',
      `Choose how you'd like to order from ${match.card.title}`,
      [...orderOptions, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const openOrderingApps = () => {
    Alert.alert(
      'Choose Delivery App',
      'Which app would you like to use?',
      [
        { text: 'Uber Eats', onPress: () => openUberEats() },
        { text: 'DoorDash', onPress: () => openDoorDash() },
        { text: 'Skip The Dishes', onPress: () => openSkipTheDishes() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openUberEats = () => {
    const url = `https://www.ubereats.com/search?q=${encodeURIComponent(match.card.title)}`;
    Linking.openURL(url).catch(() => 
      Alert.alert('Error', 'Could not open Uber Eats')
    );
  };

  const openDoorDash = () => {
    const url = `https://www.doordash.com/search/store/${encodeURIComponent(match.card.title)}/`;
    Linking.openURL(url).catch(() => 
      Alert.alert('Error', 'Could not open DoorDash')
    );
  };

  const openSkipTheDishes = () => {
    const url = `https://www.skipthedishes.com/search?q=${encodeURIComponent(match.card.title)}`;
    Linking.openURL(url).catch(() => 
      Alert.alert('Error', 'Could not open Skip The Dishes')
    );
  };

  const callRestaurant = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch(() => 
      Alert.alert('Error', 'Could not make phone call')
    );
  };

  const getMatchEmoji = () => {
    const emojis = ['🎉', '🔥', '💫', '⭐', '🎊', '✨', '💖', '🌟'];
    return emojis[match.id.charCodeAt(0) % emojis.length];
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { translateX: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [width, 0],
            })},
          ],
        },
      ]}
    >
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.95}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: match.card.imageUrl }}
            style={styles.image}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="restaurant" size={40} color={colors.textSecondary} />
            </View>
          )}
          
          {/* Match Badge */}
          <LinearGradient
            colors={[colors.like, colors.primary]}
            style={styles.matchBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.matchEmoji}>{getMatchEmoji()}</Text>
            <Text style={styles.matchText}>MATCH!</Text>
          </LinearGradient>

          {/* Favorite Button */}
          <TouchableOpacity style={styles.favoriteButton} onPress={handleFavorite}>
            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? colors.like : colors.text}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={onShare}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {match.card.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {match.card.subtitle}
              </Text>
            </View>
            <Text style={styles.timeText}>{formatTimeAgo(match.matchedAt)}</Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {match.card.description}
          </Text>

          {/* Restaurant Details */}
          <View style={styles.details}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={styles.ratingText}>
                {match.card.rating ? match.card.rating.toFixed(1) : 'N/A'}
              </Text>
              {match.card.userRatingsTotal && (
                <Text style={styles.ratingCount}>({match.card.userRatingsTotal})</Text>
              )}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.priceText}>{match.card.price}</Text>
              <Text style={styles.distanceText}>
                {match.card.distance ? `${match.card.distance}km` : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Services */}
          {match.card.services && (
            <View style={styles.servicesContainer}>
              {match.card.services.delivery && (
                <View style={styles.serviceBadge}>
                  <Ionicons name="car" size={12} color={colors.success} />
                  <Text style={styles.serviceText}>Delivery</Text>
                </View>
              )}
              {match.card.services.takeout && (
                <View style={styles.serviceBadge}>
                  <Ionicons name="bag" size={12} color={colors.primary} />
                  <Text style={styles.serviceText}>Takeout</Text>
                </View>
              )}
              {match.card.services.dineIn && (
                <View style={styles.serviceBadge}>
                  <Ionicons name="restaurant" size={12} color={colors.warning} />
                  <Text style={styles.serviceText}>Dine-in</Text>
                </View>
              )}
            </View>
          )}



          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>



            <TouchableOpacity style={styles.actionButton} onPress={handleOrder}>
              <Ionicons name="car" size={18} color={colors.primary} />
              <Text style={styles.actionText}>Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
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
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  matchEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  matchText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  shareButton: {
    position: 'absolute',
    top: spacing.sm,
    right: 60,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.sm,
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
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  ratingCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  distanceText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  serviceText: {
    ...typography.caption,
    color: colors.text,
    marginLeft: spacing.xs,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },

  actionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});


