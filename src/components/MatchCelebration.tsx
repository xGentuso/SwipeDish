import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';

interface MatchCelebrationProps {
  isVisible: boolean;
  restaurantName: string;
  memberCount: number;
  onClose: () => void;
  onViewMatch: () => void;
}

const { width, height } = Dimensions.get('window');

export const MatchCelebration: React.FC<MatchCelebrationProps> = ({
  isVisible,
  restaurantName,
  memberCount,
  onClose,
  onViewMatch,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (isVisible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getCelebrationEmoji = () => {
    const emojis = ['🎉', '🔥', '💫', '⭐', '🎊', '✨', '💖', '🌟', '🎯', '🏆'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  const getCelebrationMessage = () => {
    const messages = [
      'You all loved this place!',
      'Great taste, everyone!',
      'Perfect match found!',
      'Everyone agrees!',
      'This is the one!',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
        style={styles.background}
      >
        {/* Confetti Effect */}
        <Animated.View
          style={[
            styles.confetti,
            {
              transform: [
                {
                  rotate: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {[...Array(12)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.confettiPiece,
                {
                  backgroundColor: [colors.like, colors.primary, colors.warning, colors.success][i % 4],
                  transform: [
                    {
                      rotate: `${(i * 30)}deg`,
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Main Celebration Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.like, colors.primary]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Celebration Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.celebrationEmoji}>{getCelebrationEmoji()}</Text>
              <Ionicons name="heart" size={40} color={colors.text} style={styles.heartIcon} />
            </View>

            {/* Title */}
            <Text style={styles.title}>It's a Match!</Text>

            {/* Restaurant Name */}
            <Text style={styles.restaurantName} numberOfLines={2}>
              {restaurantName}
            </Text>

            {/* Message */}
            <Text style={styles.message}>{getCelebrationMessage()}</Text>

            {/* Member Count */}
            <View style={styles.memberCount}>
              <Ionicons name="people" size={16} color={colors.text} />
              <Text style={styles.memberText}>
                {memberCount} {memberCount === 1 ? 'person' : 'people'} matched
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.viewButton} onPress={onViewMatch}>
                <Text style={styles.viewButtonText}>View Match</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  card: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  cardGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  celebrationEmoji: {
    fontSize: 60,
    marginBottom: spacing.sm,
  },
  heartIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  restaurantName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    opacity: 0.9,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginBottom: spacing.xl,
  },
  memberText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  viewButton: {
    backgroundColor: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  viewButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    marginLeft: spacing.sm,
  },
  closeButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});


