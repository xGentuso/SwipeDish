import React, { useState, useEffect } from 'react';
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
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { SwipeDeck } from '../components/SwipeDeck';
import { RoomInput } from '../components/RoomInput';
import { MatchBanner } from '../components/MatchBanner';
import { RoomCreatedModal } from '../components/RoomCreatedModal';
import { FoodCard, Room } from '../types';
import { useAppStore } from '../store/useAppStore';
import { RestaurantService } from '../services/restaurantService';
import { PreferencesService } from '../services/preferencesService';
import { analyticsService, AnalyticsEvent } from '../services/analyticsService';
import { logger } from '../services/loggingService';
import { useSimpleScreenLoadTime } from '../hooks/useSimplePerformanceMonitoring';

// Utility function to shuffle array (Fisher-Yates algorithm)
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

  // Debug: Monitor store state changes
  useEffect(() => {
    console.log('🔄 SwipeDeckScreen: isLoading state changed to:', isLoading);
    console.log('📊 SwipeDeckScreen: Full store state snapshot:', {
      isLoading,
      user: user?.id,
      currentRoom: currentRoom?.id,
      error: error
    });
  }, [isLoading, user, currentRoom, error]);

  useEffect(() => {
    // Load user preferences first
    const loadPreferences = async () => {
      console.log('SwipeDeck: Loading user preferences...');
      await loadUserPreferences();
    };
    
    loadPreferences();
  }, [loadUserPreferences]);

  useEffect(() => {
    // Provide instant feedback for location changes
    setIsLocationChanging(true);
    
    // Debounce location changes to prevent rapid API calls
    const debounceTimeout = setTimeout(() => {
      // Load restaurants with simplified approach
      const loadRestaurants = async () => {
        const loadStart = Date.now();
        logger.info('Starting restaurant load', 'RESTAURANT_LOAD', { userLocation });
        
        try {
          console.log('SwipeDeck: Loading restaurants with optimized parallel approach...');
          console.log('SwipeDeck: userLocation:', userLocation);
        
        const lat = userLocation?.latitude;
        const lng = userLocation?.longitude;
        
        if (lat != null && lng != null) {
          console.log(`SwipeDeck: Using stored location: ${lat}, ${lng}`);
          
          // Use local restaurant data
          console.log('SwipeDeck: Loading local restaurant data...');
          const restaurants = await RestaurantService.getRestaurants(undefined, userLocation || undefined);
          
          if (restaurants && restaurants.length > 0) {
            const loadTime = Date.now() - loadStart;
            console.log(`SwipeDeck: Found ${restaurants.length} restaurants`);
            
            // Track successful restaurant load
            analyticsService.trackEvent(AnalyticsEvent.RESTAURANTS_LOADED, {
              count: restaurants.length,
              load_time_ms: loadTime,
              has_location: !!userLocation,
            });
            logger.logPerformance('restaurant_load', loadTime, 'ms', 'RESTAURANT_LOAD');
            logger.info(`Successfully loaded ${restaurants.length} restaurants`, 'RESTAURANT_LOAD');
            
            // Debug: Check address data for first few restaurants
            restaurants.slice(0, 3).forEach((restaurant, index) => {
              console.log(`SwipeDeck: Restaurant ${index + 1} - Title: ${restaurant.title}, Address: ${restaurant.location?.address || 'NO ADDRESS'}`);
            });
            
            // Apply user preferences filtering and prioritization
            const filteredRestaurants = PreferencesService.filterRestaurantsByPreferences(restaurants, userPreferences);
            console.log(`SwipeDeck: Filtered ${restaurants.length} restaurants to ${filteredRestaurants.length} based on preferences`);
            
            // Check if preferences are being applied
            const hasPreferences = userPreferences.cuisinePreferences.length > 0 || userPreferences.dietaryRestrictions.length > 0;
            if (hasPreferences) {
              console.log(`🎯 SwipeDeck: Preferences active - ${userPreferences.cuisinePreferences.length} cuisines, ${userPreferences.dietaryRestrictions.length} dietary restrictions`);
              console.log(`🎯 SwipeDeck: Cuisine preferences:`, userPreferences.cuisinePreferences);
              console.log(`🎯 SwipeDeck: Dietary restrictions:`, userPreferences.dietaryRestrictions);
            } else {
              console.log(`📋 SwipeDeck: No preferences set - showing all restaurants`);
            }
            
            // Randomize restaurant order for variety (preferences already applied in filtering)
            const randomizedRestaurants = shuffleArray([...filteredRestaurants]);
            console.log(`SwipeDeck: Randomized ${randomizedRestaurants.length} restaurants for variety`);
            
            setCurrentCards(randomizedRestaurants);
            setIsLocationChanging(false); // Reset location changing state on success
            return;
          } else {
            console.log('SwipeDeck: No restaurants found with stored location');
          }
        } else {
          console.log('SwipeDeck: No stored location, using default location');
          const defaultLocation = { latitude: 43.1599795, longitude: -79.2470299 };
          const restaurants = await RestaurantService.getRestaurants(undefined, defaultLocation);
          
          if (restaurants && restaurants.length > 0) {
            console.log(`SwipeDeck: Found ${restaurants.length} restaurants with default location`);
            
            // Randomize restaurant order for variety
            const randomizedRestaurants = shuffleArray([...restaurants]);
            console.log(`SwipeDeck: Randomized ${randomizedRestaurants.length} restaurants for variety (default location)`);
            
            setCurrentCards(randomizedRestaurants);
            return;
          }
        }
        
        // If no real data available, show error
        const loadTime = Date.now() - loadStart;
        logger.error('No restaurant data available on initial load', 'RESTAURANT_LOAD', { loadTime });
        console.error('SwipeDeck: No real restaurant data available on initial load');
        Alert.alert(
          'No Restaurants Found',
          'Unable to find restaurants nearby. Please check your location settings and internet connection.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        const loadTime = Date.now() - loadStart;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to load restaurants', 'RESTAURANT_LOAD', { 
          error: errorMessage, 
          loadTime,
          userLocation 
        });
        console.error('SwipeDeck: Failed to load restaurants:', error);
        Alert.alert(
          'Connection Error',
          'Unable to load restaurants. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLocationChanging(false);
      }
    };

      // Load restaurants on app startup
      loadRestaurants();
    }, 500); // 500ms debounce delay
    
    return () => {
      clearTimeout(debounceTimeout);
      setIsLocationChanging(false);
    };
  }, [userLocation?.latitude, userLocation?.longitude]);

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

  // Debug logging for currentCards changes
  useEffect(() => {
    console.log(`SwipeDeckScreen: currentCards updated. Length: ${currentCards?.length || 0}`);
    if (currentCards && currentCards.length > 0) {
      console.log(`SwipeDeckScreen: First card in store:`, currentCards[0]);
      console.log(`SwipeDeckScreen: Current card index: ${useAppStore.getState().currentCardIndex}`);
    } else {
      console.log('SwipeDeckScreen: No cards available');
    }
  }, [currentCards]);

  // Auto-refresh when cards run out
  useEffect(() => {
    if (currentCards && currentCards.length === 0 && !isRefreshing) {
      console.log('SwipeDeckScreen: No cards available, triggering auto-refresh...');
      handleCardsExhausted();
    }
  }, [currentCards, isRefreshing]);

  const handleSwipe = async (cardId: string, direction: 'left' | 'right') => {
    const action = direction === 'right' ? 'like' : 'dislike';
    
    try {
      await submitSwipe(cardId, action);
      console.log(`Swiped ${direction} on card ${cardId}`);
    } catch (error) {
      console.error('Failed to submit swipe:', error);
    }
  };

  const handleCreateRoom = async (name: string, displayName: string) => {
    console.log('🔄 handleCreateRoom START:', { 
      name, 
      displayName, 
      userId: user?.id,
      isLoading: isLoading,
      timestamp: new Date().toISOString()
    });
    
    // Add a timeout to ensure loading state is always reset if store gets stuck
    const timeoutId = setTimeout(() => {
      console.log('⏰ handleCreateRoom TIMEOUT - This should not happen if store works correctly');
      console.log('⚠️ Store loading state may be stuck, current isLoading:', isLoading);
    }, 10000); // 10 seconds timeout
    
    try {
      if (!user) {
        console.log('❌ handleCreateRoom: No user authenticated');
        Alert.alert('Error', 'You must be signed in to create a room');
        return;
      }
      
      // Test Firebase connection and authentication first
      console.log('🔗 Testing Firebase connection...');
      const { testFirebaseConnection, auth } = await import('../services/firebase');
      
      console.log('🔐 Checking authentication status...');
      console.log('🔐 Firebase auth current user:', auth.currentUser);
      console.log('🔐 Firebase auth current user ID:', auth.currentUser?.uid);
      console.log('🔐 App store user ID:', user.id);
      
      if (!auth.currentUser) {
        console.error('❌ No authenticated user in Firebase');
        Alert.alert('Authentication Error', 'You must be signed in to create a room. Please restart the app.');
        return;
      }
      
      if (auth.currentUser.uid !== user.id) {
        console.error('❌ User ID mismatch:', { firebase: auth.currentUser.uid, store: user.id });
        Alert.alert('Authentication Error', 'User authentication mismatch. Please restart the app.');
        return;
      }
      
      const connectionTest = await testFirebaseConnection();
      console.log('🔗 Firebase connection result:', connectionTest);
      
      if (!connectionTest.success) {
        console.error('❌ Firebase connection failed:', connectionTest.error);
        Alert.alert('Connection Error', connectionTest.error || 'Unable to connect to Firebase');
        return;
      }
      
      console.log('✅ Firebase connection and authentication successful, proceeding with room creation');
      console.log('📞 Calling createRoom from store...');
      
      await createRoom(name, displayName);
      
      console.log('✅ createRoom completed, checking current room state...');
      const currentState = useAppStore.getState();
      console.log('📊 Store state after createRoom:', {
        currentRoom: currentState.currentRoom,
        isLoading: currentState.isLoading,
        error: currentState.error
      });
      
      setShowRoomModal(false);
      
      // Show the newly created room in the success modal
      if (currentState.currentRoom) {
        console.log('🎉 Setting newly created room for success modal');
        setNewlyCreatedRoom(currentState.currentRoom);
        setShowRoomCreatedModal(true);
      } else {
        console.log('⚠️ Room created but currentRoom is null');
      }
    } catch (error) {
      console.error('❌ handleCreateRoom ERROR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      Alert.alert('Error', errorMessage);
    } finally {
      // Always clear the timeout - store should handle loading state
      clearTimeout(timeoutId);
      console.log('🔄 handleCreateRoom FINALLY - store should have handled loading state');
    }
  };

  const handleJoinRoom = async (pin: string, displayName: string) => {
    console.log('🔄 handleJoinRoom START:', { 
      pin, 
      displayName, 
      userId: user?.id,
      isLoading: isLoading,
      timestamp: new Date().toISOString()
    });
    
    // Add a timeout to ensure loading state is always reset if store gets stuck
    const timeoutId = setTimeout(() => {
      console.log('⏰ handleJoinRoom TIMEOUT - This should not happen if store works correctly');
      console.log('⚠️ Store loading state may be stuck, current isLoading:', isLoading);
    }, 10000); // 10 seconds timeout
    
    try {
      if (!user) {
        console.log('❌ handleJoinRoom: No user authenticated');
        Alert.alert('Error', 'You must be signed in to join a room');
        return;
      }
      
      // Test Firebase connection and authentication first
      console.log('🔗 Testing Firebase connection...');
      const { testFirebaseConnection, auth } = await import('../services/firebase');
      
      console.log('🔐 Checking authentication status...');
      console.log('🔐 Firebase auth current user:', auth.currentUser);
      console.log('🔐 Firebase auth current user ID:', auth.currentUser?.uid);
      console.log('🔐 App store user ID:', user.id);
      
      if (!auth.currentUser) {
        console.error('❌ No authenticated user in Firebase');
        Alert.alert('Authentication Error', 'You must be signed in to join a room. Please restart the app.');
        return;
      }
      
      if (auth.currentUser.uid !== user.id) {
        console.error('❌ User ID mismatch:', { firebase: auth.currentUser.uid, store: user.id });
        Alert.alert('Authentication Error', 'User authentication mismatch. Please restart the app.');
        return;
      }
      
      const connectionTest = await testFirebaseConnection();
      console.log('🔗 Firebase connection result:', connectionTest);
      
      if (!connectionTest.success) {
        console.error('❌ Firebase connection failed:', connectionTest.error);
        Alert.alert('Connection Error', connectionTest.error || 'Unable to connect to Firebase');
        return;
      }
      
      console.log('✅ Firebase connection and authentication successful, proceeding with room join');
      console.log('📞 Calling joinRoom from store...');
      
      await joinRoom(pin, displayName);
      
      console.log('✅ joinRoom completed, checking current room state...');
      const currentState = useAppStore.getState();
      console.log('📊 Store state after joinRoom:', {
        currentRoom: currentState.currentRoom,
        isLoading: currentState.isLoading,
        error: currentState.error
      });
      
      setShowRoomModal(false);
      
      // Show success message
      Alert.alert(
        'Joined Room!',
        'Successfully joined the room. Start swiping to find matches with your friends!',
        [{ text: 'Got it!' }]
      );
    } catch (error) {
      console.error('❌ handleJoinRoom ERROR:', error);
      let errorMessage = 'Failed to join room. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message; // Show the actual error message for debugging
        if (error.message.includes('not found')) {
          errorMessage = 'Room not found. Please check the PIN and try again.';
        } else if (error.message.includes('invalid')) {
          errorMessage = 'Invalid PIN format. Please enter a 6-digit PIN.';
        } else if (error.message.includes('display name')) {
          errorMessage = 'Invalid display name. Please use only letters, numbers, and spaces.';
        }
      }
      
      Alert.alert('Cannot Join Room', errorMessage);
    } finally {
      // Always clear the timeout - store should handle loading state
      clearTimeout(timeoutId);
      console.log('🔄 handleJoinRoom FINALLY - store should have handled loading state');
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
      console.log('SwipeDeck: Starting simplified refresh...');
      console.log('SwipeDeck: Current userLocation:', userLocation);
      
      // Check if user location is available
      if (!userLocation) {
        console.error('SwipeDeck: No user location available');
        Alert.alert(
          'Location Required',
          'Please enable location services to find restaurants near you.',
          [{ text: 'OK' }]
        );
        setIsRefreshing(false);
        return;
      }
      
      // Use local restaurant data
      console.log('SwipeDeck: Loading local restaurant data...');
      const restaurants = await RestaurantService.getRestaurants(undefined, userLocation);
      
      if (restaurants && restaurants.length > 0) {
        console.log(`SwipeDeck: Found ${restaurants.length} restaurants`);
        
        // Debug: Check address data for first few restaurants
        restaurants.slice(0, 3).forEach((restaurant, index) => {
          console.log(`SwipeDeck: Restaurant ${index + 1} - Title: ${restaurant.title}, Address: ${restaurant.location?.address || 'NO ADDRESS'}`);
        });
        
        // Apply user preferences filtering and prioritization
        const filteredRestaurants = PreferencesService.filterRestaurantsByPreferences(restaurants, userPreferences);
        console.log(`SwipeDeck: Filtered ${restaurants.length} restaurants to ${filteredRestaurants.length} based on preferences (refresh)`);
        
        // Check if preferences are being applied
        const hasPreferences = userPreferences.cuisinePreferences.length > 0 || userPreferences.dietaryRestrictions.length > 0;
        if (hasPreferences) {
          console.log(`🎯 SwipeDeck: Preferences active - ${userPreferences.cuisinePreferences.length} cuisines, ${userPreferences.dietaryRestrictions.length} dietary restrictions (refresh)`);
          console.log(`🎯 SwipeDeck: Cuisine preferences:`, userPreferences.cuisinePreferences);
          console.log(`🎯 SwipeDeck: Dietary restrictions:`, userPreferences.dietaryRestrictions);
        } else {
          console.log(`📋 SwipeDeck: No preferences set - showing all restaurants (refresh)`);
        }
        
        // Randomize restaurant order for variety (preferences already applied in filtering)
        const randomizedRestaurants = shuffleArray([...filteredRestaurants]);
        console.log(`SwipeDeck: Randomized ${randomizedRestaurants.length} restaurants for refresh variety`);
        
        setCurrentCards(randomizedRestaurants);
        useAppStore.getState().setCurrentCardIndex(0);
      } else {
        console.log('SwipeDeck: No restaurants found');
        Alert.alert(
          'No Restaurants Found',
                      'Unable to find restaurants nearby. Please try again later.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('SwipeDeck: Failed to refresh restaurants:', error);
      
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
    
    console.log('SwipeDeck: Manual shuffle requested');
    
    // Randomize restaurant order
    const randomizedRestaurants = shuffleArray([...currentCards]);
    console.log(`SwipeDeck: Manually shuffled ${randomizedRestaurants.length} restaurants`);
    
    // Reset to first card and set new randomized order
    setCurrentCards(randomizedRestaurants);
    useAppStore.getState().setCurrentCardIndex(0);
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Auto-refresh when cards run out - use simplified search
  const handleCardsExhausted = async () => {
    console.log('SwipeDeck: Cards exhausted, checking auto-refresh cooldown...');
    
    // Check cooldown to prevent excessive API calls
    const now = Date.now();
    if (now - lastAutoRefresh < AUTO_REFRESH_COOLDOWN) {
      console.log(`SwipeDeck: Auto-refresh on cooldown. Wait ${Math.ceil((AUTO_REFRESH_COOLDOWN - (now - lastAutoRefresh)) / 1000)}s`);
      return;
    }
    
    if (isRefreshing) {
      console.log('SwipeDeck: Already refreshing, skipping auto-refresh');
      return;
    }
    
    console.log('SwipeDeck: Starting auto-refresh...');
    setLastAutoRefresh(now);
    setIsRefreshing(true);
    try {
      console.log('SwipeDeck: Starting simplified auto-refresh...');
      
      // Check if user location is available
      if (!userLocation) {
        console.error('SwipeDeck: No user location available for auto-refresh');
        setIsRefreshing(false);
        return;
      }
      
      // Use local restaurant data
      console.log('SwipeDeck: Loading local restaurant data...');
      const restaurants = await RestaurantService.getRestaurants(undefined, userLocation);
      
      if (restaurants && restaurants.length > 0) {
        console.log(`SwipeDeck: Found ${restaurants.length} restaurants`);
        
        // Apply user preferences filtering and prioritization
        const filteredRestaurants = PreferencesService.filterRestaurantsByPreferences(restaurants, userPreferences);
        console.log(`SwipeDeck: Filtered ${restaurants.length} restaurants to ${filteredRestaurants.length} based on preferences (auto-refresh)`);
        
        // Check if preferences are being applied
        const hasPreferences = userPreferences.cuisinePreferences.length > 0 || userPreferences.dietaryRestrictions.length > 0;
        if (hasPreferences) {
          console.log(`🎯 SwipeDeck: Preferences active - ${userPreferences.cuisinePreferences.length} cuisines, ${userPreferences.dietaryRestrictions.length} dietary restrictions (auto-refresh)`);
          console.log(`🎯 SwipeDeck: Cuisine preferences:`, userPreferences.cuisinePreferences);
          console.log(`🎯 SwipeDeck: Dietary restrictions:`, userPreferences.dietaryRestrictions);
        } else {
          console.log(`📋 SwipeDeck: No preferences set - showing all restaurants (auto-refresh)`);
        }
        
        // Randomize restaurant order for variety (preferences already applied in filtering)
        const randomizedRestaurants = shuffleArray([...filteredRestaurants]);
        console.log(`SwipeDeck: Randomized ${randomizedRestaurants.length} restaurants for auto-refresh variety`);
        
        setCurrentCards(randomizedRestaurants);
        useAppStore.getState().setCurrentCardIndex(0);
      } else {
        console.log('SwipeDeck: No restaurants found in auto-refresh');
      }
    } catch (error) {
      console.error('SwipeDeck: Auto-refresh failed:', error);
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
          <SwipeDeck
            cards={currentCards || []}
            onSwipe={handleSwipe}
            onRefresh={handleCardsExhausted}
            isRefreshing={isRefreshing}
            isBackgroundRefreshing={isBackgroundRefreshing}
          />
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
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 1000,
    ...shadows.medium,
  },
  locationChangingText: {
    ...typography.bodySmall,
    color: colors.text,
  },
});
