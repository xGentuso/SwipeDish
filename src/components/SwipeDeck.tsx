import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { SwipeCard } from './SwipeCard';
import { FoodCard } from '../types';
import { useAppStore } from '../store/useAppStore';
import { SwipeTrackingService } from '../services/swipeTrackingService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeDeckProps {
  cards: FoodCard[];
  onSwipe: (cardId: string, direction: 'left' | 'right') => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isBackgroundRefreshing?: boolean;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ cards = [], onSwipe, onRefresh, isRefreshing = false, isBackgroundRefreshing = false }) => {
  const { submitSwipe, currentCardIndex, setCurrentCardIndex, isFavorite, addToFavorites, removeFromFavorites, userId } = useAppStore();

  // Enhanced tracking state
  const cardViewStartTime = useRef<number | null>(null);
  const sessionInitialized = useRef(false);

  // Initialize session and reset index when cards change
  useEffect(() => {
    console.log(`SwipeDeck: Cards changed, resetting. New cards length: ${cards?.length || 0}`);
    setCurrentCardIndex(0);
    
    // Initialize swipe tracking session
    if (userId && cards && cards.length > 0 && !sessionInitialized.current) {
      try {
        SwipeTrackingService.startSession(userId);
        sessionInitialized.current = true;
        console.log('SwipeDeck: Started swipe tracking session');
      } catch (error) {
        console.log('SwipeDeck: Failed to start session, continuing without tracking');
      }
    }
    
    // Start timing for first card
    if (cards && cards.length > 0) {
      cardViewStartTime.current = Date.now();
      console.log(`SwipeDeck: New cards loaded, first card:`, cards[0]);
    }
  }, [cards, setCurrentCardIndex, userId]);

  // Auto-refresh when reaching end of cards
  // Debug logging when cards prop changes
  useEffect(() => {
    console.log(`SwipeDeck: Cards prop updated. Length: ${cards?.length || 0}`);
    if (cards && cards.length > 0) {
      console.log(`SwipeDeck: First card:`, cards[0]);
    }
  }, [cards]);

  const handleSwipe = async (direction: 'left' | 'right', method: 'gesture' | 'button' = 'gesture') => {
    console.log(`SwipeDeck: handleSwipe called - direction: ${direction}, method: ${method}`);
    console.log(`SwipeDeck: currentCardIndex: ${currentCardIndex}, filteredCards.length: ${filteredCards?.length || 0}`);
    
    if (!filteredCards || currentCardIndex >= filteredCards.length) {
      console.log(`SwipeDeck: Early return - no cards or index out of bounds`);
      return;
    }

    const card = filteredCards[currentCardIndex];
    if (!card) {
      console.log(`SwipeDeck: Early return - no card`);
      return;
    }

    const action = direction === 'right' ? 'like' : 'dislike';
    
    // Calculate view time
    const viewTime = cardViewStartTime.current ? Date.now() - cardViewStartTime.current : 0;
    
    // Trigger haptic feedback
    Haptics.impactAsync(
      direction === 'right' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    );

    try {
      // Track swipe with enhanced context (non-blocking) - only if userId exists
      if (userId) {
        SwipeTrackingService.trackSwipe(
          userId,
          card,
          action,
          method,
          viewTime
        ).catch(error => console.error('SwipeTracking failed:', error));
      }

      // Submit swipe to backend (only if in a room)
      try {
        await submitSwipe(card.id, action);
      } catch (error) {
        console.log('SwipeDeck: submitSwipe failed (likely no room), continuing with local swipe');
      }
      
      // Call parent callback
      onSwipe(card.id, direction);
      
      // Move to next card
      const newIndex = currentCardIndex + 1;
      setCurrentCardIndex(newIndex);
      
      // Start timing next card
      if (newIndex < filteredCards.length) {
        cardViewStartTime.current = Date.now();
      }
      
      console.log(`Swiped ${direction} on ${card.title}, moved to card ${newIndex + 1}, view time: ${viewTime}ms`);
    } catch (error) {
      console.error('Swipe failed:', error);
      // Still move to next card even if backend fails
      const newIndex = currentCardIndex + 1;
      setCurrentCardIndex(newIndex);
      
      // Start timing next card
      if (newIndex < filteredCards.length) {
        cardViewStartTime.current = Date.now();
      }
    }
  };

  const handleButtonPress = (direction: 'left' | 'right') => {
    console.log(`SwipeDeck: Button pressed - ${direction}`);
    handleSwipe(direction, 'button');
  };

  // Use cards directly without filtering to prevent skipping
  const filteredCards = cards || [];

  // Load more cards when running low and cleanup session
  useEffect(() => {
    if (filteredCards && currentCardIndex >= filteredCards.length - 2 && !isRefreshing && onRefresh) {
      console.log('SwipeDeck: Reached end of cards, triggering auto-refresh...');
      // Add a small delay to ensure the UI updates properly
      setTimeout(() => {
        onRefresh();
      }, 100);
    }

    // End session when reaching end of cards
    if (filteredCards && currentCardIndex >= filteredCards.length && sessionInitialized.current) {
      SwipeTrackingService.endSession();
      sessionInitialized.current = false;
      console.log('SwipeDeck: Ended swipe tracking session');
    }
  }, [currentCardIndex, filteredCards, onRefresh, isRefreshing]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (sessionInitialized.current) {
        SwipeTrackingService.endSession();
        sessionInitialized.current = false;
      }
    };
  }, []);

  const handleFavoriteToggle = async () => {
    console.log(`SwipeDeck: Favorite button pressed`);
    if (!filteredCards || currentCardIndex >= filteredCards.length) return;

    const card = filteredCards[currentCardIndex];
    if (!card) return;
    
    console.log(`SwipeDeck: Toggling favorite for "${card.title}" (ID: ${card.id})`);
    console.log(`SwipeDeck: Currently favorited: ${isFavorite(card.id)}`);
    
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Toggle favorite status without swiping the card
      if (isFavorite(card.id)) {
        await removeFromFavorites(card.id);
        console.log(`✅ Removed "${card.title}" from favorites`);
      } else {
        await addToFavorites(card);
        console.log(`⭐ Added "${card.title}" to favorites`);
      }
    } catch (error) {
      console.error('❌ Favorite toggle failed:', error);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {isRefreshing ? 'Loading more restaurants...' : 'No more cards!'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isRefreshing ? 'Discovering new places for you' : 'Check back later for new restaurants'}
      </Text>
      {isRefreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding restaurants...</Text>
        </View>
      )}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      {/* Dislike Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.dislikeButton]}
        onPress={() => handleButtonPress('left')}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={30} color={colors.dislike} />
      </TouchableOpacity>

      {/* Favorite Button */}
      <TouchableOpacity
                  style={[
            styles.actionButton, 
            styles.favoriteButton,
            filteredCards && filteredCards[currentCardIndex] && isFavorite(filteredCards[currentCardIndex].id) && styles.favoriteActiveButton
          ]}
          onPress={handleFavoriteToggle}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={filteredCards && filteredCards[currentCardIndex] && isFavorite(filteredCards[currentCardIndex].id) ? "star" : "star-outline"} 
            size={30} 
            color={filteredCards && filteredCards[currentCardIndex] && isFavorite(filteredCards[currentCardIndex].id) ? "#FFD700" : "#4A90E2"} 
          />
      </TouchableOpacity>

      {/* Like Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.likeButton]}
        onPress={() => handleButtonPress('right')}
        activeOpacity={0.8}
      >
        <Ionicons name="heart" size={30} color={colors.like} />
      </TouchableOpacity>
    </View>
  );

  // Debug logging
  console.log(`SwipeDeck: ${filteredCards?.length || 0} cards, current index: ${currentCardIndex}`);
  if (filteredCards && filteredCards[currentCardIndex]) {
    console.log(`SwipeDeck: Current card:`, filteredCards[currentCardIndex].title);
  }
  


  if (!filteredCards || filteredCards.length === 0 || currentCardIndex >= filteredCards.length) {
    console.log(`SwipeDeck: Showing empty state. Cards: ${cards?.length || 0}, Filtered: ${filteredCards?.length || 0}, Current Index: ${currentCardIndex}, IsRefreshing: ${isRefreshing}`);
    return (
      <View style={styles.container} key={`empty-state-${cards?.length || 0}-${isRefreshing}`}>
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container} key={`swipe-deck-${cards.length}-${currentCardIndex}`}>
      {/* Card Stack */}
      <View style={styles.cardsContainer}>
        {filteredCards.slice(currentCardIndex, currentCardIndex + 3).map((card, index) => {
          if (!card) {
            console.log(`SwipeDeck: Card at index ${currentCardIndex + index} is null/undefined`);
            return null;
          }
          
          return (
            <View key={`${card.id}-${currentCardIndex + index}`} style={[styles.cardWrapper, { zIndex: 3 - index }]}>
              <SwipeCard
                card={card}
                isFirst={index === 0}
                onSwipe={handleSwipe}
              />
            </View>
          );
        })}
      </View>

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Card Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentCardIndex + 1} / {filteredCards.length}
        </Text>
        {isBackgroundRefreshing && (
          <View style={styles.backgroundRefreshIndicator}>
            <Ionicons name="sync" size={12} color={colors.secondary} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  dislikeButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.dislike,
  },
  favoriteButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  favoriteActiveButton: {
    backgroundColor: colors.background,
    borderColor: '#FFD700',
  },
  likeButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.like,
  },
  counterContainer: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    ...shadows.small,
  },
  counterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  backgroundRefreshIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    marginTop: spacing.lg,
    ...shadows.small,
  },
  refreshButtonDisabled: {
    backgroundColor: colors.surface,
  },
  refreshButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  refreshButtonTextDisabled: {
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
