import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { SwipeDeck } from '../components/SwipeDeck';
import { RoomInput } from '../components/RoomInput';
import { MatchBanner } from '../components/MatchBanner';
import { RoomCreatedModal } from '../components/RoomCreatedModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FoodCard, Room } from '../types';
import { useAppStore, useCardsStore } from '../store';
import { RestaurantService } from '../services/restaurantService';
import { PreferencesService } from '../services/preferencesService';
import { analyticsService, AnalyticsEvent } from '../services/analyticsService';
import { logger } from '../services/loggingService';
import { useSimpleScreenLoadTime } from '../hooks/useSimplePerformanceMonitoring';
import { testFirebaseConnection } from '../services/firebase';
import { getAuth } from 'firebase/auth';

// Utility function to shuffle array (Fisher-Yates algorithm) - moved outside component
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const SwipeDeckScreen: React.FC = () => {
  // Performance monitoring for this screen
  useSimpleScreenLoadTime('SwipeDeckScreen');

  const {
    user,
    currentRoom,
    matches,
    currentCards,
    isLoading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    setCurrentCards,
    submitSwipe,
    listenToRoomUpdates,
    loadMatches,
    userLocation,
    userPreferences,
    loadUserPreferences,
    setLoading,
  } = useAppStore();
  
  // Track location changes for instant feedback
  const [isLocationChanging, setIsLocationChanging] = useState(false);
  
  // Prevent excessive auto-refreshes
  const [lastAutoRefresh, setLastAutoRefresh] = useState(0);
  const AUTO_REFRESH_COOLDOWN = 30000; // 30 seconds cooldown

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showRoomCreatedModal, setShowRoomCreatedModal] = useState(false);
  const [newlyCreatedRoom, setNewlyCreatedRoom] = useState<Room | null>(null);
  const [showMatchBanner, setShowMatchBanner] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(matches[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);

  // Ref to track previous loading state
  const prevLoadingRef = useRef(isLoading);

  // Monitor store state changes
  useEffect(() => {
    if (isLoading !== prevLoadingRef.current) {
      prevLoadingRef.current = isLoading;
    }
  }, [isLoading]);

  // Load user preferences
  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Load restaurants when location changes
  useEffect(() => {
    if (!userLocation) return;

    const loadRestaurants = async () => {
      setIsLocationChanging(true);
      try {
        const { latitude: lat, longitude: lng } = userLocation;
        
        // Using stored location
        const restaurants = await RestaurantService.getRestaurants(
          { maxDistance: 25 },
          { latitude: lat, longitude: lng }
        );
        
        // Found restaurants
        const filteredRestaurants = PreferencesService.filterRestaurantsByPreferences(
          restaurants,
          userPreferences
        );

        // Apply preferences filtering
        if (userPreferences.cuisinePreferences.length > 0 || userPreferences.dietaryRestrictions.length > 0) {
          // Preferences active
        } else {
          // No preferences set - showing all restaurants
        }

        const randomizedRestaurants = shuffleArray([...filteredRestaurants]);
        
        // Randomized restaurants for variety
        setCurrentCards(randomizedRestaurants);
      } catch (error) {
        // Failed to load restaurants
      } finally {
        setIsLocationChanging(false);
      }
    };

    // Debounce location changes
    const timeoutId = setTimeout(loadRestaurants, 500);
    return () => clearTimeout(timeoutId);
  }, [userLocation, userPreferences]);

  // Handle location not found
  useEffect(() => {
    if (!userLocation && !isLoading) {
      // No stored location, using default location
      const defaultLocation = { latitude: 40.7128, longitude: -74.0060 };
      const loadDefaultRestaurants = async () => {
        try {
          const restaurants = await RestaurantService.getRestaurants(
            { maxDistance: 25 },
            { latitude: defaultLocation.latitude, longitude: defaultLocation.longitude }
          );
          
          // Found restaurants with default location
          const filteredRestaurants = PreferencesService.filterRestaurantsByPreferences(
            restaurants,
            userPreferences
          );
          
          const randomizedRestaurants = shuffleArray([...filteredRestaurants]);
          
          // Randomized restaurants for variety (default location)
          setCurrentCards(randomizedRestaurants);
        } catch (error) {
          // Failed to load restaurants
        }
      };
      loadDefaultRestaurants();
    }
  }, [userLocation, isLoading, userPreferences]);

  useEffect(() => {
    // Show match banner when new match is created
    if (matches.length > 0 && matches[0] !== currentMatch) {
      setCurrentMatch(matches[0]);
      setShowMatchBanner(true);
    }
  }, [matches]);

  useEffect(() => {
    // Listen to room updates when in a room
    if (currentRoom?.id) {
      listenToRoomUpdates(currentRoom.id);
      // Load matches once per room entry (avoid running on every room snapshot)
      loadMatches();
    }
  }, [currentRoom?.id]);

  // Monitor current cards changes
  useEffect(() => {
    if (currentCards && currentCards.length > 0) {
      // Current cards updated
    } else {
      // No cards available
    }
  }, [currentCards]);

  // Auto-refresh when cards are exhausted
  useEffect(() => {
    if (currentCards && currentCards.length === 0 && !isLoading) {
      // No cards available, triggering auto-refresh
      handleCardsExhausted();
    }
  }, [currentCards, isLoading]);

  const handleSwipe = useCallback((cardId: string, direction: 'left' | 'right') => {
    const card = currentCards?.find(c => c.id === cardId);
    if (!card) return;
    
    // Handle swipe
    if (direction === 'right') {
      // Add to favorites or handle like action
    }
    
    // Track the swipe
    try {
      analyticsService.trackEvent(
        direction === 'right' ? AnalyticsEvent.RESTAURANT_SWIPED_RIGHT : AnalyticsEvent.RESTAURANT_SWIPED_LEFT,
        {
          restaurantId: card.id,
          restaurantName: card.title,
          swipeMethod: 'gesture'
        }
      );
    } catch (error) {
      // Continue if analytics fails
    }
  }, [currentCards]);

  const handleCreateRoom = async (name: string, displayName: string) => {
    const startTime = Date.now();
    
    try {
      // Check if user is authenticated
      if (!user || !user.id) {
        return;
      }

      // Test Firebase connection
      const connectionTest = await testFirebaseConnection();
      
      // Check authentication status
      const auth = getAuth();
      
      // Firebase connection and authentication successful, proceeding with room creation
      const room = await createRoom(
        `Room ${Math.floor(Math.random() * 1000)}`,
        user.displayName || 'Anonymous'
      );
      
      // Create room completed, checking current room state
      if (room) {
        // Setting newly created room for success modal
        setShowRoomCreatedModal(true);
      } else {
        // Room created but currentRoom is null
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create room. Please try again.');
    }
  };

  const handleJoinRoom = async (pin: string, displayName: string) => {
    const startTime = Date.now();
    
    try {
      // Check if user is authenticated
      if (!user || !user.id) {
        return;
      }

      // Test Firebase connection
      const connectionTest = await testFirebaseConnection();
      
      // Check authentication status
      const auth = getAuth();
      
      // Firebase connection and authentication successful, proceeding with room join
      const room = await joinRoom(pin, displayName);
      
      // Join room completed, checking current room state
      if (room) {
        // Room joined successfully
        setShowRoomCreatedModal(true);
      } else {
        Alert.alert('Error', 'Invalid room PIN. Please check and try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join room. Please try again.');
    }
  };

  const handleShareCurrentRoom = async () => {
    if (!currentRoom) return;
    
    try {
      const message = `Join my SwipeDish room "${currentRoom.name}"!\n\nRoom PIN: ${currentRoom.pin}\n\nDownload SwipeDish to start swiping on restaurants together!`;
      
      await Share.share({
        message,
        title: `Join my SwipeDish room: ${currentRoom.name}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share room details');
    }
  };

  const handleLeaveRoom = async () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveRoom();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave room');
            }
          },
        },
      ]
    );
  };

  const handleRefreshRestaurants = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Check if user location is available
      if (!userLocation) {
        Alert.alert(
          'Location Required',
          'Please enable location services to find restaurants near you.',
          [{ text: 'OK' }]
        );
        setIsRefreshing(false);
        return;
      }
      
      // Use local restaurant data
      const restaurants = await RestaurantService.getRestaurants(undefined, userLocation);
      
      if (restaurants && restaurants.length > 0) {
        // Apply user preferences filtering and prioritization
        const filteredRestaurants = PreferencesService.filterRestaurantsByPreferences(restaurants, userPreferences);
        
        // Randomize restaurant order for variety (preferences already applied in filtering)
        const randomizedRestaurants = shuffleArray([...filteredRestaurants]);
        
        setCurrentCards(randomizedRestaurants);
        useCardsStore.getState().setCurrentCardIndex(0);
      } else {
        Alert.alert(
          'No Restaurants Found',
          'Unable to find restaurants nearby. Please try again later.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      // Show user-friendly error
      Alert.alert(
        'Connection Error',
        'Unable to load restaurants. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Manual shuffle function
  const handleShuffleCards = () => {
    if (!currentCards || currentCards.length === 0) return;
    
    // Randomize restaurant order
    const randomizedRestaurants = shuffleArray([...currentCards]);
    
    // Reset to first card and set new randomized order
    setCurrentCards(randomizedRestaurants);
    useAppStore.getState().setCurrentCardIndex(0);
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Auto-refresh when cards run out - use simplified search
  const handleCardsExhausted = async () => {
    const now = Date.now();
    
    // Cards exhausted, checking auto-refresh cooldown
    if (now - lastAutoRefresh < AUTO_REFRESH_COOLDOWN) {
      // Auto-refresh on cooldown
      return;
    }

    if (isRefreshing) {
      // Already refreshing, skipping auto-refresh
      return;
    }

    // Starting auto-refresh
    setLastAutoRefresh(now);
    
    try {
      // Check if user location is available
      if (!userLocation) {
        setIsRefreshing(false);
        return;
      }
      
      // Use local restaurant data
      const restaurants = await RestaurantService.getRestaurants(undefined, userLocation);
      
      if (restaurants && restaurants.length > 0) {
        // Apply user preferences filtering and prioritization
        const filteredRestaurants = PreferencesService.filterRestaurantsByPreferences(restaurants, userPreferences);
        
        // Randomize restaurant order for variety (preferences already applied in filtering)
        const randomizedRestaurants = shuffleArray([...filteredRestaurants]);
        
        setCurrentCards(randomizedRestaurants);
        useCardsStore.getState().setCurrentCardIndex(0);
      }
    } catch (error) {
      // Auto-refresh failed
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>SwipeDish</Text>
        {currentRoom && (
          <TouchableOpacity 
            style={styles.roomInfoContainer}
            onPress={() => {
              Alert.alert(
                currentRoom.name,
                `PIN: ${currentRoom.pin}\nMembers: ${currentRoom.members.length}\n\nTap "Share Room" to invite more friends!`,
                [
                  { text: 'Share Room', onPress: handleShareCurrentRoom },
                  { text: 'OK', style: 'default' }
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.roomName}>{currentRoom.name}</Text>
            <Text style={styles.roomDetails}>
              PIN: {currentRoom.pin} • {currentRoom.members.length} member{currentRoom.members.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.headerRight}>
        {/* Shuffle Button */}
        <TouchableOpacity
          style={styles.shuffleButton}
          onPress={handleShuffleCards}
          disabled={isRefreshing || !currentCards || currentCards.length === 0}
        >
          <Ionicons 
            name="shuffle" 
            size={20} 
            color={isRefreshing || !currentCards || currentCards.length === 0 ? colors.textSecondary : colors.primary} 
          />
        </TouchableOpacity>
        
        {currentRoom ? (
          <TouchableOpacity
            style={styles.roomButton}
            onPress={handleLeaveRoom}
          >
            <Ionicons name="exit-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={styles.roomButton}
              onPress={() => setShowRoomModal(true)}
            >
              <Ionicons name="people-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            

          </View>
        )}
      </View>
    </View>
  );

  const renderRoomModal = () => (
    <Modal
      visible={showRoomModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Join or Create Room</Text>
          <TouchableOpacity
            onPress={() => setShowRoomModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <RoomInput
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isLoading={isLoading}
        />
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <View style={styles.content}>
        {isLocationChanging && (
          <View style={styles.locationChangingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.locationChangingText}>Updating location...</Text>
          </View>
        )}
        <View style={styles.swipeDeckContainer}>
          <ErrorBoundary>
            <SwipeDeck
              cards={currentCards || []}
              onSwipe={handleSwipe}
            />
          </ErrorBoundary>
        </View>
      </View>

      {renderRoomModal()}

      <RoomCreatedModal
        visible={showRoomCreatedModal}
        room={newlyCreatedRoom}
        onClose={() => {
          setShowRoomCreatedModal(false);
          setNewlyCreatedRoom(null);
        }}
        onStartSwiping={() => {
          setShowRoomCreatedModal(false);
          setNewlyCreatedRoom(null);
        }}
      />

      {showMatchBanner && currentMatch && (
        <MatchBanner
          match={currentMatch}
          onClose={() => setShowMatchBanner(false)}
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
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  roomInfoContainer: {
    marginTop: spacing.xs,
  },
  roomName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  roomDetails: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shuffleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  roomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  content: {
    flex: 1,
  },
  swipeDeckContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationChangingOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: 0,
    right: 0,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 1000,
    ...shadows.medium,
    marginHorizontal: spacing.md,
  },
  locationChangingText: {
    ...typography.bodySmall,
    color: colors.text,
  },
});
