import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { Match, FoodCard } from '../types';
import { useAppStore } from '../store';
import { RestaurantService } from '../services/restaurantService';
import { MapsService } from '../services/mapsService';

import { MatchCard } from '../components/MatchCard';
import { MatchCelebration } from '../components/MatchCelebration';
import { MatchAnalytics } from '../components/MatchAnalytics';

export const MatchesScreen: React.FC = () => {
  const { matches, indexRequiredForMatches, loadMatches, currentRoom, isLoadingMatches } = useAppStore();
  const [matchesWithCards, setMatchesWithCards] = useState<(Match & { card: FoodCard })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filteredMatches, setFilteredMatches] = useState<(Match & { card: FoodCard })[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string | null>(null);
  const [favoriteMatches, setFavoriteMatches] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMatch, setCelebrationMatch] = useState<(Match & { card: FoodCard }) | null>(null);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadMatchesWithCards = async () => {
      try {
        setIsLoading(true);
        const matchesData = await Promise.all(
          matches.map(async (match) => {
            const card = await RestaurantService.getRestaurantById(match.cardId);
            return {
              ...match,
              card: card || {
                id: match.cardId,
                type: 'restaurant',
                title: 'Restaurant',
                description: 'Restaurant information is currently unavailable',
                imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
                tags: [],
              } as FoodCard
            };
          })
        );
        
        // Check for new matches and show celebration
        const previousCount = matchesWithCards.length;
        setMatchesWithCards(matchesData);
        setFilteredMatches(matchesData);
        
        // Show celebration for new matches (when count increases)
        if (matchesData.length > previousCount) {
          const newMatches = matchesData.slice(0, matchesData.length - previousCount);
          if (newMatches.length > 0) {
            setCelebrationMatch(newMatches[0]); // Most recent new match
            setShowCelebration(true);
          }
        }
      } catch (error) {
        console.error('Failed to load matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatchesWithCards();
  }, [matches]);

  // Filter matches based on selected criteria
  useEffect(() => {
    let filtered = matchesWithCards;

    if (selectedCuisine) {
      filtered = filtered.filter(match => match.card.cuisine === selectedCuisine);
    }

    if (selectedTimeRange) {
      const now = new Date();
      filtered = filtered.filter(match => {
        const diffInDays = Math.floor((now.getTime() - match.matchedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (selectedTimeRange) {
          case 'Today':
            return diffInDays === 0;
          case 'This Week':
            return diffInDays <= 7;
          case 'This Month':
            return diffInDays <= 30;
          default:
            return true;
        }
      });
    }

    setFilteredMatches(filtered);
  }, [matchesWithCards, selectedCuisine, selectedTimeRange]);

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

  const handleGetDirections = async (card: FoodCard) => {
    try {
      if (card.location) {
        await MapsService.openDirections(card.location, card.title);
      } else {
        Alert.alert('Location Unavailable', 'No location information available for this restaurant.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open directions');
    }
  };



  const handleOrder = async (card: FoodCard) => {
    const orderOptions = [];
    
    if (card.services?.delivery) {
      orderOptions.push({ text: 'Delivery Apps', onPress: () => openOrderingApps(card) });
    }
    
    if (card.phone) {
      orderOptions.push({ text: 'Call Restaurant', onPress: () => callRestaurant(card.phone!) });
    }
    
    if (orderOptions.length === 0) {
      Alert.alert('Order Unavailable', 'No ordering options available for this restaurant.');
      return;
    }
    
    Alert.alert(
      'Order Options',
      `Choose how you'd like to order from ${card.title}`,
      [...orderOptions, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const openOrderingApps = (card: FoodCard) => {
    Alert.alert(
      'Choose Delivery App',
      'Which app would you like to use?',
      [
        { text: 'Uber Eats', onPress: () => openUberEats(card) },
        { text: 'DoorDash', onPress: () => openDoorDash(card) },
        { text: 'Skip The Dishes', onPress: () => openSkipTheDishes(card) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openUberEats = (card: FoodCard) => {
    const url = `https://www.ubereats.com/search?q=${encodeURIComponent(card.title)}`;
    Linking.openURL(url).catch(() => 
      Alert.alert('Error', 'Could not open Uber Eats')
    );
  };

  const openDoorDash = (card: FoodCard) => {
    const url = `https://www.doordash.com/search/store/${encodeURIComponent(card.title)}/`;
    Linking.openURL(url).catch(() => 
      Alert.alert('Error', 'Could not open DoorDash')
    );
  };

  const openSkipTheDishes = (card: FoodCard) => {
    const url = `https://www.skipthedishes.com/search?q=${encodeURIComponent(card.title)}`;
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

  const handleShareMatch = async (match: Match & { card: FoodCard }) => {
    try {
      await Share.share({
        message: `Check out this restaurant we matched on: ${match.card.title}! 🍽️`,
        title: 'Restaurant Match',
      });
    } catch (error) {
      console.error('Error sharing match:', error);
    }
  };

  const handleFavoriteMatch = (matchId: string) => {
    const newFavorites = new Set(favoriteMatches);
    if (newFavorites.has(matchId)) {
      newFavorites.delete(matchId);
    } else {
      newFavorites.add(matchId);
    }
    setFavoriteMatches(newFavorites);
  };

  const handleFilterByCuisine = (cuisine: string) => {
    setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine);
    setSelectedTimeRange(null);
  };

  const handleFilterByTime = (timeRange: string) => {
    setSelectedTimeRange(selectedTimeRange === timeRange ? null : timeRange);
    setSelectedCuisine(null);
  };

  const clearFilters = () => {
    setSelectedCuisine(null);
    setSelectedTimeRange(null);
  };

  const toggleAnalytics = () => {
    Animated.timing(tabAnim, {
      toValue: showAnalytics ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowAnalytics(!showAnalytics);
  };

  const handleViewMatch = () => {
    setShowCelebration(false);
    setShowAnalytics(false);
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  const renderMatch = ({ item }: { item: typeof matchesWithCards[0] }) => (
    <MatchCard
      match={item}
      onShare={() => handleShareMatch(item)}
      onFavorite={() => handleFavoriteMatch(item.id)}
      isFavorite={favoriteMatches.has(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color={colors.textSecondary} />
      {indexRequiredForMatches ? (
        <>
          <Text style={styles.emptyTitle}>Index building</Text>
          <Text style={styles.emptySubtitle}>
            We’re setting things up. Refresh in a minute after Firestore finishes creating the index.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyTitle}>No matches yet!</Text>
          <Text style={styles.emptySubtitle}>
            Start swiping with friends to see your matches here
          </Text>

        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <View style={styles.headerActions}>
          {(selectedCuisine || selectedTimeRange) && (
            <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.analyticsButton} onPress={toggleAnalytics}>
            <Ionicons 
              name={showAnalytics ? "list" : "analytics-outline"} 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Indicators */}
      {(selectedCuisine || selectedTimeRange) && (
        <View style={styles.filterIndicators}>
          {selectedCuisine && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Cuisine: {selectedCuisine}</Text>
            </View>
          )}
          {selectedTimeRange && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Time: {selectedTimeRange}</Text>
            </View>
          )}
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      ) : showAnalytics ? (
        <MatchAnalytics
          matches={matchesWithCards}
          onFilterByCuisine={handleFilterByCuisine}
          onFilterByTime={handleFilterByTime}
        />
      ) : filteredMatches.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.matchesContainer}
        />
      )}

      {/* Match Celebration */}
      {showCelebration && celebrationMatch && (
        <MatchCelebration
          isVisible={showCelebration}
          restaurantName={celebrationMatch.card.title}
          memberCount={celebrationMatch.members.length}
          onClose={handleCloseCelebration}
          onViewMatch={handleViewMatch}
        />
      )}
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  clearFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  analyticsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  filterIndicators: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  matchesContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },


});
