import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { Match, FoodCard } from '../types';

interface MatchAnalyticsProps {
  matches: (Match & { card: FoodCard })[];
  onFilterByCuisine?: (cuisine: string) => void;
  onFilterByTime?: (timeRange: string) => void;
}

export const MatchAnalytics: React.FC<MatchAnalyticsProps> = ({
  matches,
  onFilterByCuisine,
  onFilterByTime,
}) => {
  useEffect(() => {
    if (matches && matches.length > 0) {
      // Received matches
      // Matches data
    }
  }, [matches]);

  const getCuisineStats = () => {
    if (matches.length === 0) return [];
    
    const cuisineCount: { [key: string]: number } = {};
    matches.forEach(match => {
      const cuisine = match.card.cuisine || 'Unknown';
      cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
    });
    
    return Object.entries(cuisineCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getTimeStats = () => {
    const now = new Date();
    const timeRanges = {
      'Today': 0,
      'This Week': 0,
      'This Month': 0,
      'Older': 0,
    };

    if (matches.length > 0) {
      matches.forEach(match => {
        const diffInDays = Math.floor((now.getTime() - match.matchedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) timeRanges['Today']++;
        else if (diffInDays <= 7) timeRanges['This Week']++;
        else if (diffInDays <= 30) timeRanges['This Month']++;
        else timeRanges['Older']++;
      });
    }

    return timeRanges;
  };

  const getAverageRating = () => {
    if (matches.length === 0) return 0;
    
    const ratedMatches = matches.filter(match => match.card.rating);
    if (ratedMatches.length === 0) return 0;
    
    const totalRating = ratedMatches.reduce((sum, match) => sum + (match.card.rating || 0), 0);
    return totalRating / ratedMatches.length;
  };

  const getMostExpensiveMatch = () => {
    if (matches.length === 0) return null;
    return matches.reduce((mostExpensive, match) => {
      const currentPrice = match.card.price?.length || 0;
      const mostExpensivePrice = mostExpensive.card.price?.length || 0;
      return currentPrice > mostExpensivePrice ? match : mostExpensive;
    });
  };

  const getClosestMatch = () => {
    const matchesWithDistance = matches.filter(match => match.card.distance);
    if (matchesWithDistance.length === 0) return null;
    
    return matchesWithDistance.reduce((closest, match) => {
      return (match.card.distance || Infinity) < (closest.card.distance || Infinity) ? match : closest;
    });
  };

  const cuisineStats = getCuisineStats();
  const timeStats = getTimeStats();
  const averageRating = getAverageRating();
  const mostExpensiveMatch = getMostExpensiveMatch();
  const closestMatch = getClosestMatch();

  const StatCard = ({ title, value, subtitle, icon, color, onPress }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.statCard, onPress && styles.statCardPressable]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <LinearGradient
        colors={[color, `${color}80`]}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statHeader}>
          <Ionicons name={icon as any} size={24} color={colors.text} />
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Summary Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Summary</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Matches"
            value={matches.length}
            icon="heart"
            color={colors.like}
          />
          <StatCard
            title="Avg Rating"
            value={averageRating.toFixed(1)}
            subtitle="⭐"
            icon="star"
            color={colors.warning}
          />
          <StatCard
            title="This Week"
            value={timeStats['This Week']}
            icon="calendar"
            color={colors.primary}
          />
          <StatCard
            title="Cuisines"
            value={matches.length > 0 ? new Set(matches.map(m => m.card.cuisine).filter(Boolean)).size : 0}
            icon="restaurant"
            color={colors.success}
          />
        </View>
      </View>

      {/* Top Cuisines */}
      {cuisineStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Cuisines</Text>
          <View style={styles.cuisineList}>
            {cuisineStats.map(([cuisine, count], index) => (
              <TouchableOpacity
                key={cuisine}
                style={styles.cuisineItem}
                onPress={() => onFilterByCuisine?.(cuisine)}
              >
                <View style={styles.cuisineRank}>
                  <Text style={styles.cuisineRankText}>{index + 1}</Text>
                </View>
                <View style={styles.cuisineInfo}>
                  <Text style={styles.cuisineName}>{cuisine}</Text>
                  <Text style={styles.cuisineCount}>{count} matches</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Time Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Timeline</Text>
        <View style={styles.timelineContainer}>
          {Object.entries(timeStats).map(([timeRange, count]) => (
            <TouchableOpacity
              key={timeRange}
              style={styles.timelineItem}
              onPress={() => onFilterByTime?.(timeRange)}
            >
              <View style={styles.timelineBar}>
                <View 
                  style={[
                    styles.timelineProgress, 
                    { 
                      width: `${matches.length > 0 ? (count / matches.length) * 100 : 0}%`,
                      backgroundColor: colors.primary,
                    }
                  ]} 
                />
              </View>
              <View style={styles.timelineInfo}>
                <Text style={styles.timelineLabel}>{timeRange}</Text>
                <Text style={styles.timelineCount}>{count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notable Matches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notable Matches</Text>
        
        {mostExpensiveMatch && (
          <View style={styles.notableCard}>
            <Ionicons name="diamond" size={20} color={colors.warning} />
            <View style={styles.notableInfo}>
              <Text style={styles.notableTitle}>Most Expensive</Text>
              <Text style={styles.notableRestaurant}>{mostExpensiveMatch.card.title}</Text>
              <Text style={styles.notableDetail}>{mostExpensiveMatch.card.price}</Text>
            </View>
          </View>
        )}

        {closestMatch && (
          <View style={styles.notableCard}>
            <Ionicons name="location" size={20} color={colors.success} />
            <View style={styles.notableInfo}>
              <Text style={styles.notableTitle}>Closest Match</Text>
              <Text style={styles.notableRestaurant}>{closestMatch.card.title}</Text>
              <Text style={styles.notableDetail}>{closestMatch.card.distance}km away</Text>
            </View>
          </View>
        )}

        {(() => {
          const highestRatedMatch = matches.length > 0 ? matches.reduce((highest, match) => 
            (match.card.rating || 0) > (highest.card.rating || 0) ? match : highest
          ) : null;
          
          return highestRatedMatch && (
            <View style={styles.notableCard}>
              <Ionicons name="star" size={20} color={colors.primary} />
              <View style={styles.notableInfo}>
                <Text style={styles.notableTitle}>Highest Rated</Text>
                <Text style={styles.notableRestaurant}>
                  {highestRatedMatch.card.title}
                </Text>
                <Text style={styles.notableDetail}>
                  {highestRatedMatch.card.rating} ⭐
                </Text>
              </View>
            </View>
          );
        })()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  statCardPressable: {
    elevation: 4,
  },
  statGradient: {
    padding: spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.8,
  },
  cuisineList: {
    paddingHorizontal: spacing.md,
  },
  cuisineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  cuisineRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cuisineRankText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: 'bold',
  },
  cuisineInfo: {
    flex: 1,
  },
  cuisineName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  cuisineCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  timelineContainer: {
    paddingHorizontal: spacing.md,
  },
  timelineItem: {
    marginBottom: spacing.sm,
  },
  timelineBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  timelineProgress: {
    height: '100%',
    borderRadius: 4,
  },
  timelineInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  timelineCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  notableInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  notableTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notableRestaurant: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  notableDetail: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
