import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';

interface OnboardingScreenProps {
  navigation: any;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}> 
        <Ionicons name="flame" size={40} color={colors.primary} />
        <Text style={styles.title}>SwipeDish</Text>
        <Text style={styles.subtitle}>Decide where to eat with friends, fast.</Text>
      </View>

      <View style={styles.cards}>
        <View style={[styles.card, styles.cardOne]}> 
          <Ionicons name="heart" size={28} color={colors.like} />
          <Text style={styles.cardTitle}>Swipe restaurants</Text>
          <Text style={styles.cardText}>Discover great spots nearby with a fun, simple swipe.</Text>
        </View>
        <View style={[styles.card, styles.cardTwo]}> 
          <Ionicons name="people-outline" size={28} color={colors.text} />
          <Text style={styles.cardTitle}>Create a room</Text>
          <Text style={styles.cardText}>Invite friends and match when everyone agrees.</Text>
        </View>
        <View style={[styles.card, styles.cardThree]}> 
          <Ionicons name="sparkles" size={28} color={colors.primary} />
          <Text style={styles.cardTitle}>Instant match</Text>
          <Text style={styles.cardText}>We’ll highlight matches and give directions or menus.</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate('Username')}> 
        <Text style={styles.ctaText}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cards: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  cardOne: {},
  cardTwo: {},
  cardThree: {},
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  ctaText: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
});


