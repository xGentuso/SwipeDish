import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { FoodCard } from '../types';
import { RecommendationService } from '../services/recommendationService';
import { useAppStore, useUserId } from '../store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SimpleRecommendationsProps {
  onCardPress?: (card: FoodCard) => void;
  onRefresh?: () => void;
  maxCards?: number;
  title?: string;
  subtitle?: string;
  type?: 'general' | 'topRated' | 'nearby' | 'quickDelivery';
}

export const SimpleRecommendations: React.FC<SimpleRecommendationsProps> = ({
  onCardPress,
  onRefresh,
  maxCards = 10,
  title = 'Recommended for You',
  subtitle = 'Top picks based on ratings and reviews',
  type = 'general',
}) => {
  const userId = useUserId();
  const { userLocation } = useAppStore();
  const [recommendations, setRecommendations] = useState<FoodCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecommendations = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let results: FoodCard[] = [];
      
      switch (type) {
        case 'topRated':
          results = await RecommendationService.getTopRated(userLocation || undefined, maxCards);
          break;
        case 'nearby':
          results = await RecommendationService.getNearby(userLocation || undefined, maxCards);
          break;
        case 'quickDelivery':
          results = await RecommendationService.getQuickDelivery(userLocation || undefined, maxCards);
          break;
        default:
          results = await RecommendationService.getRecommendations(userId || undefined, {
            userLocation: userLocation || undefined,
            limit: maxCards,
          });
      }

      setRecommendations(results);
      
    } catch (error) {
      console.error('SimpleRecommendations: Error loading recommendations:', error);
      setError('Unable to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, userLocation, maxCards, type]);

  const handleRefresh = useCallback(async () => {
    await loadRecommendations(true);
    onRefresh?.();
  }, [loadRecommendations, onRefresh]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const renderRecommendationCard = (card: FoodCard, index: number) => (
    <TouchableOpacity
      key={`${card.id}-${index}`}
      style={styles.recommendationCard}
      onPress={() => onCardPress?.(card)}
      activeOpacity={0.8}
    >
      <View style={styles.cardImageContainer}>
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.recommendationBadge}>
          <Ionicons name="star" size={12} color={colors.surface} />
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {card.title}
        </Text>
        
        <View style={styles.cardMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {typeof card.rating === 'number' ? card.rating.toFixed(1) : 'N/A'}
            </Text>
          </View>
          {card.distance !== undefined && card.distance !== null && (
            <Text style={styles.distanceText}>
              {card.distance.toFixed(1)} mi
            </Text>
          )}
        </View>
        
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {`${card.cuisine || 'Restaurant'} • ${card.price || 'Price varies'}`}
        </Text>
        
        {(card as any).recommendationReason && typeof (card as any).recommendationReason === 'string' && (card as any).recommendationReason.trim() !== '' && (
          <Text style={styles.reasonText} numberOfLines={1}>
            {(card as any).recommendationReason}
          </Text>
        )}
        
        <View style={styles.cardTags}>
          {card.isOpen === true && (
            <View style={styles.openTag}>
              <Text style={styles.openTagText}>Open</Text>
            </View>
          )}
          {card.deliveryTime !== undefined && card.deliveryTime !== null && card.deliveryTime > 0 && (
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={10} color={colors.textSecondary} />
              <Text style={styles.tagText}>{card.deliveryTime} min</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant" size={32} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No recommendations available</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your location or preferences</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {recommendations.map((card, index) => renderRecommendationCard(card, index))}
      </ScrollView>
      
      {recommendations.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Showing {recommendations.length} recommendations
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: 0,
    marginVertical: 0,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContainer: {
    maxHeight: 240,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  recommendationCard: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImageContainer: {
    position: 'relative',
    height: 140,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  recommendationBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary + 'E6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  distanceText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontSize: 13,
  },
  reasonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  cardTags: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  openTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  openTagText: {
    ...typography.caption,
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '600',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  loadingText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  errorText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  retryText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
});