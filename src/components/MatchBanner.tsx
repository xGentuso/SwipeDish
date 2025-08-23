import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { Match, FoodCard } from '../types';
import { MapsService } from '../services/mapsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchBannerProps {
  match: Match & { card?: FoodCard };
  onClose: () => void;
}

export const MatchBanner: React.FC<MatchBannerProps> = ({ match, onClose }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animate in
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300 });

    // Auto hide after 5 seconds
    const timer = setTimeout(() => {
      hideBanner();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const hideBanner = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={24} color={colors.like} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>It's a Match! 🎉</Text>
          <Text style={styles.subtitle}>
            Everyone in your room liked this restaurant!
          </Text>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={hideBanner}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (match.card?.location) {
              MapsService.openDirections(match.card.location, match.card.title);
            }
          }}
        >
          <Ionicons name="location-outline" size={20} color={colors.text} />
          <Text style={styles.actionText}>Directions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Open restaurant menu
            if (match.card?.externalLinks?.menu) {
              Linking.openURL(match.card.externalLinks.menu);
            }
          }}
        >
          <Ionicons name="restaurant-outline" size={20} color={colors.text} />
          <Text style={styles.actionText}>View Menu</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Open delivery app
            if (match.card?.externalLinks?.delivery) {
              Linking.openURL(match.card.externalLinks.delivery);
            }
          }}
        >
          <Ionicons name="car-outline" size={20} color={colors.text} />
          <Text style={styles.actionText}>Order</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.success,
    zIndex: 1000,
    ...shadows.large,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text,
    opacity: 0.9,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
