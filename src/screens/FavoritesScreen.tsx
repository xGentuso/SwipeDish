import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { FoodCard } from '../types';
import { useAppStore } from '../store/useAppStore';

export const FavoritesScreen: React.FC = () => {
  const { favorites, isLoadingFavorites, loadFavorites, removeFromFavorites } = useAppStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('FavoritesScreen: Loading favorites...');
    loadFavorites();
  }, [loadFavorites]);

  // Debug logging for favorites changes
  useEffect(() => {
    console.log(`FavoritesScreen: Favorites updated. Count: ${favorites.length}`);
    if (favorites.length > 0) {
      console.log('FavoritesScreen: Current favorites:', favorites.map(f => f.title));
    }
  }, [favorites]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFavorites();
    setIsRefreshing(false);
  };

  const handleRemoveFavorite = (restaurant: FoodCard) => {
    Alert.alert(
      'Remove from Favorites',
      `Remove "${restaurant.title}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeFromFavorites(restaurant.id)
        }
      ]
    );
  };

  const handleClearAllFavorites = () => {
    Alert.alert(
      'Clear All Favorites',
      'Are you sure you want to remove all restaurants from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            console.log('🧹 Clearing all favorites...');
            favorites.forEach(favorite => {
              removeFromFavorites(favorite.id);
            });
          }
        }
      ]
    );
  };

  const renderFavorite = ({ item }: { item: FoodCard }) => (
    <TouchableOpacity style={styles.favoriteCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.favoriteImage} />
      
      <View style={styles.favoriteContent}>
        <View style={styles.favoriteHeader}>
          <View style={styles.favoriteInfo}>
            <Text style={styles.favoriteTitle}>{item.title}</Text>
            <Text style={styles.favoriteSubtitle}>{item.subtitle}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(item)}
          >
            <Ionicons name="heart-dislike" size={20} color={colors.dislike} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.favoriteDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.favoriteFooter}>
          <View style={styles.favoriteDetails}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : 'N/A'}</Text>
            </View>
            <Text style={styles.priceText}>{item.price}</Text>
            <Text style={styles.distanceText}>{item.distance ? `${item.distance}km away` : 'Distance unknown'}</Text>
          </View>
          
          <View style={styles.serviceIcons}>
            {item.services?.takeout && (
              <Ionicons name="bag-outline" size={16} color={colors.textSecondary} />
            )}
            {item.services?.delivery && (
              <Ionicons name="bicycle-outline" size={16} color={colors.textSecondary} />
            )}
            {item.services?.dineIn && (
              <Ionicons name="restaurant-outline" size={16} color={colors.textSecondary} />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptySubtitle}>
        Start swiping right on restaurants you like to add them to your favorites!
      </Text>
    </View>
  );

  if (isLoadingFavorites) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Favorites</Text>
          {favorites.length > 0 && (
            <TouchableOpacity 
              style={styles.clearAllButton}
              onPress={handleClearAllFavorites}
            >
              <Ionicons name="trash-outline" size={20} color={colors.dislike} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          {favorites.length} restaurant{favorites.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <FlatList
        data={favorites}
        renderItem={renderFavorite}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    fontWeight: '700',
  },
  clearAllButton: {
    padding: spacing.sm,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContainer: {
    padding: spacing.lg,
  },
  favoriteCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  favoriteImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  favoriteContent: {
    padding: spacing.lg,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  favoriteSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  favoriteDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  ratingText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  priceText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  distanceText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  serviceIcons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
