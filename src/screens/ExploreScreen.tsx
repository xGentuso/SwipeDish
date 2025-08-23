import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { FoodCard } from '../types';
import { RestaurantService } from '../services/restaurantService';

import { MapModal } from '../components/MapModal';
import { DirectionsChoiceModal } from '../components/DirectionsChoiceModal';

import { RestaurantCard } from '../components/RestaurantCardNew';
import { FilterPanel, FilterState } from '../components/FilterPanel';
import { SearchBar } from '../components/SearchBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProgressiveLoadingSpinner } from '../components/ProgressiveLoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { SimpleRecommendations } from '../components/SimpleRecommendations';
import { useAppStore } from '../store/useAppStore';
import { analyticsService, AnalyticsEvent } from '../services/analyticsService';

const { width: screenWidth } = Dimensions.get('window');

const cuisineFilters = RestaurantService.getCuisineTypes();
const priceRanges = RestaurantService.getPriceRanges();



export const ExploreScreen: React.FC = () => {
  const { userLocation } = useAppStore();
  const [filters, setFilters] = useState<FilterState>({
    cuisine: 'All',
    price: null,
    distance: 10,
    rating: 0,
    openNow: false,
    delivery: false,
    takeout: false,
  });
  const [restaurants, setRestaurants] = useState<FoodCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<FoodCard | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [directionsRestaurant, setDirectionsRestaurant] = useState<FoodCard | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Animation values
  const searchAnimation = useState(new Animated.Value(0))[0];
  const filterAnimation = useState(new Animated.Value(0))[0];
  const cardAnimation = useState(new Animated.Value(0))[0];

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { requestForegroundPermissionsAsync, getForegroundPermissionsAsync } = await import('expo-location');
      
      // Check current permission status
      let { status } = await getForegroundPermissionsAsync();
      
      // If permission is not granted, request it
      if (status !== 'granted') {
        const permissionResult = await requestForegroundPermissionsAsync();
        status = permissionResult.status;
      }
      
      setHasLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        console.log('Location permission granted');
      } else {
        console.log('Location permission denied - using default location');
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setHasLocationPermission(false);
    }
  };

  // Load restaurants with progressive loading
  const loadRestaurants = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      let data: FoodCard[] = [];
      
      // Use local restaurant data only
      console.log('Using local restaurant data');
      data = await RestaurantService.getRestaurants(undefined, userLocation || undefined);
      setRestaurants(data);

      if (data.length === 0) {
        setError('No restaurants found nearby. Try adjusting your filters or location.');
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      setError('Failed to load restaurants. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userLocation, hasLocationPermission]);

  // Load restaurants on mount and when location changes
  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  // Animate search bar
  useEffect(() => {
    Animated.timing(searchAnimation, {
      toValue: showSearch ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSearch, searchAnimation]);

  // Animate filter panel
  useEffect(() => {
    Animated.timing(filterAnimation, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFilters, filterAnimation]);

  // Animate cards on load
  useEffect(() => {
    if (restaurants.length > 0) {
      Animated.timing(cardAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [restaurants, cardAnimation]);

  // Filter restaurants based on current filters and search
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          restaurant.title.toLowerCase().includes(query) ||
          (restaurant.cuisine?.toLowerCase().includes(query) || false) ||
          restaurant.tags.some(tag => tag.toLowerCase().includes(query)) ||
          restaurant.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Cuisine filter
      if (filters.cuisine !== 'All' && restaurant.cuisine !== filters.cuisine) {
        return false;
      }
      
      // Price filter
      if (filters.price && restaurant.price !== filters.price) {
        return false;
      }
      
      // Distance filter
      if (restaurant.distance && restaurant.distance > filters.distance) {
        return false;
      }
      
      // Rating filter
      if (restaurant.rating && restaurant.rating < filters.rating) {
        return false;
      }
      
      // Open now filter
      if (filters.openNow && restaurant.isOpen === false) {
        return false;
      }
      
      // Delivery filter
      if (filters.delivery && restaurant.services?.delivery !== true) {
        return false;
      }
      
      // Takeout filter
      if (filters.takeout && restaurant.services?.takeout !== true) {
        return false;
      }
      
      return true;
    });
  }, [restaurants, searchQuery, filters]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadRestaurants(true);
  }, [loadRestaurants]);

  // Handle filter change
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      cuisine: 'All',
      price: null,
      distance: 10,
      rating: 0,
      openNow: false,
      delivery: false,
      takeout: false,
    });
  }, []);

  const handleSmartRecommendationPress = (card: FoodCard) => {
    // Show restaurant details or add to favorites
    setSelectedRestaurant(card);
    console.log('Selected AI recommendation:', card.title);
    
    // Track the interaction
    analyticsService.trackEvent(AnalyticsEvent.RECOMMENDATION_CLICKED, {
      restaurant_id: card.id,
      restaurant_name: card.title,
      source: 'explore_screen',
    });
  };


  // Render restaurant card with enhanced design
  const renderRestaurant = useCallback(({ item, index }: { item: FoodCard; index: number }) => {
    // Debug logging
    console.log('ExploreScreen: Rendering restaurant item:', item?.title, 'at index:', index);
    
    // Safety check
    if (!item) {
      console.error('ExploreScreen: No item provided to renderRestaurant at index:', index);
      return null;
    }
    
    return (
      <RestaurantCard
        restaurant={item}
        index={index}
      onPressMap={(restaurant) => {
        setSelectedRestaurant(restaurant);
        setShowMapModal(true);
      }}
      onPressDirections={(restaurant) => {
        setDirectionsRestaurant(restaurant);
        setShowDirectionsModal(true);
      }}
      onPressCard={(restaurant) => {
        // Menu functionality removed - just log the selection
        console.log('Restaurant selected:', restaurant.title);
      }}
    />
    );
  }, []);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;
    
    return (
      <EmptyState
        icon={error ? 'alert-circle-outline' : 'restaurant-outline'}
        title={error ? 'Something went wrong' : 'No restaurants found'}
        subtitle={error || 'Try adjusting your filters or search terms'}
        actionText="Try Again"
        onAction={handleRefresh}
      />
    );
  }, [isLoading, error, handleRefresh]);

  // Render header
  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <Animated.View 
        style={[
          styles.searchContainer,
          {
            height: searchAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 56],
            }),
            opacity: searchAnimation,
          },
        ]}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={showSearch}
        />
      </Animated.View>

      {/* Filter Panel */}
      <FilterPanel
        visible={showFilters}
        filters={filters}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        cuisineOptions={cuisineFilters}
        priceOptions={priceRanges}
      />

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
        </Text>
        {!hasLocationPermission && (
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={checkLocationPermission}
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.locationButtonText}>Enable Location</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [
    showSearch, showFilters, searchQuery, filters, filteredRestaurants.length,
    hasLocationPermission, searchAnimation, filterAnimation, resetFilters, checkLocationPermission
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {renderHeader()}

      {isLoading && !isRefreshing ? (
        <ProgressiveLoadingSpinner 
          message="Loading restaurants..." 
          showProgress={true}
        />
      ) : (
        <FlatList
          data={filteredRestaurants}
          renderItem={renderRestaurant}
          keyExtractor={(item, index) => item.id ? String(item.id) : `restaurant-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={() => (
            // Show recommendations at top when no search/filters active
            (!searchQuery || searchQuery === '') && filters.cuisine === 'All' && (!filters.price || filters.price === null) ? (
              <View style={styles.smartRecommendationsWrapper}>
                <SimpleRecommendations
                  onCardPress={handleSmartRecommendationPress}
                  maxCards={5}
                  title="Recommended for You"
                  subtitle="Top picks near you"
                />
              </View>
            ) : null
          )}
          ListEmptyComponent={renderEmptyState}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}
      
      {/* Map Modal */}
      {selectedRestaurant && (
        <MapModal
          visible={showMapModal}
          location={selectedRestaurant.location!}
          title={selectedRestaurant.title}
          onClose={() => {
            setShowMapModal(false);
            setSelectedRestaurant(null);
          }}
        />
      )}
      
      {/* Directions Choice Modal */}
      {directionsRestaurant && (
        <DirectionsChoiceModal
          visible={showDirectionsModal}
          location={directionsRestaurant.location!}
          title={directionsRestaurant.title}
          onClose={() => {
            setShowDirectionsModal(false);
            setDirectionsRestaurant(null);
          }}
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
    backgroundColor: colors.background,
    paddingBottom: spacing.md,
  },
  headerTop: {
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
    gap: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  searchContainer: {
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  resultsTitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  locationButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  resultsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  smartRecommendationsWrapper: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },


});
