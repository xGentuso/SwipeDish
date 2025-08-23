import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/styles';

interface ProgressiveLoadingSpinnerProps {
  message?: string;
  showProgress?: boolean;
}

export const ProgressiveLoadingSpinner: React.FC<ProgressiveLoadingSpinnerProps> = ({
  message = "Loading restaurants...",
  showProgress = true,
}) => {
  const [progress, setProgress] = useState(0);
  const spinAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    // Simulate progress for better UX
    if (showProgress) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Don't go to 100% until actually complete
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => {
        clearInterval(progressInterval);
        spinAnimation.stop();
        pulseAnimation.stop();
      };
    }

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [spinAnim, pulseAnim, showProgress]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinnerContainer,
          {
            transform: [
              { rotate: spin },
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        <Ionicons 
          name="restaurant" 
          size={40} 
          color={colors.primary} 
        />
      </Animated.View>
      
      <Text style={styles.message}>{message}</Text>
      
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress)}% complete
          </Text>
        </View>
      )}
      
      <Text style={styles.subMessage}>
        Discovering restaurants nearby...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  message: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  progressContainer: {
    width: '80%',
    marginBottom: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subMessage: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});



