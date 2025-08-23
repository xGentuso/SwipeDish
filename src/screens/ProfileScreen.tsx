import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { GeocodingService } from '../services/geocodingService';
import { useAppStore } from '../store/useAppStore';
import { AuthService } from '../services/authService';
import { PreferencesService } from '../services/preferencesService';
import { UserStatsService, UserStats } from '../services/userStatsService';
// AI Insights component removed - using simple user preferences instead

export const ProfileScreen: React.FC = () => {
  const { 
    user, 
    signOut, 
    setUser, 
    setUserLocation, 
    userLocation,
    userPreferences,
    updateUserPreferences,
    saveUserPreferences,
    loadUserPreferences,
  } = useAppStore();
  
  const [editName, setEditName] = useState(user?.displayName || '');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [showDietary, setShowDietary] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    newMatches: true,
    roomInvites: true,
    marketing: false,
  });

  // Local preference state for editing
  const [localDietaryRestrictions, setLocalDietaryRestrictions] = useState<string[]>(userPreferences.dietaryRestrictions);
  const [localCuisinePreferences, setLocalCuisinePreferences] = useState<string[]>(userPreferences.cuisinePreferences);
  
  // Friends state - using real data from user's network
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // User statistics state
  const [userStats, setUserStats] = useState<UserStats>(UserStatsService.getLoadingStats());

  // Load preferences when component mounts
  React.useEffect(() => {
    loadUserPreferences();
  }, [loadUserPreferences]);

  // Load user statistics when component mounts or user changes
  useEffect(() => {
    const loadUserStats = async () => {
      if (user?.id) {
        try {
          setUserStats(prev => ({ ...prev, isLoading: true }));
          const stats = await UserStatsService.getUserStats(user.id);
          setUserStats(stats);
        } catch (error) {
          console.error('Failed to load user statistics:', error);
          // Keep loading stats on error but mark as not loading
          setUserStats(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    loadUserStats();
  }, [user?.id]);

  // Function to refresh user stats manually
  const refreshUserStats = async () => {
    if (user?.id) {
      try {
        setUserStats(prev => ({ ...prev, isLoading: true }));
        const stats = await UserStatsService.getUserStats(user.id);
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to refresh user statistics:', error);
        setUserStats(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  // Sync local preferences with store preferences
  React.useEffect(() => {
    setLocalDietaryRestrictions(userPreferences.dietaryRestrictions);
    setLocalCuisinePreferences(userPreferences.cuisinePreferences);
  }, [userPreferences]);

  // Load friends when component mounts
  React.useEffect(() => {
    if (showFriends) {
      loadFriends();
    }
  }, [showFriends]);

  const loadFriends = async () => {
    setIsLoadingFriends(true);
    try {
      // In a real app, this would fetch from user's social network
      // For now, show empty state encouraging users to add friends
      setFriends([]);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    const newRestrictions = localDietaryRestrictions.includes(restriction) 
      ? localDietaryRestrictions.filter(r => r !== restriction)
      : [...localDietaryRestrictions, restriction];
    
    setLocalDietaryRestrictions(newRestrictions);
    updateUserPreferences({ dietaryRestrictions: newRestrictions });
  };

  const toggleCuisinePreference = (cuisine: string) => {
    const newCuisines = localCuisinePreferences.includes(cuisine) 
      ? localCuisinePreferences.filter(c => c !== cuisine)
      : [...localCuisinePreferences, cuisine];
    
    setLocalCuisinePreferences(newCuisines);
    updateUserPreferences({ cuisinePreferences: newCuisines });
  };

  const savePreferences = async () => {
    try {
      await saveUserPreferences();
      setShowDietary(false);
      console.log('✅ Preferences saved successfully');
    } catch (error) {
      console.error('❌ Failed to save preferences:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your name and preferences',
      onPress: () => setShowEditProfile(true),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage your notification settings',
      onPress: () => setShowNotifications(true),
    },
    {
      icon: 'location-outline',
      title: 'Location',
      subtitle: 'Set your preferred location',
      onPress: () => setShowLocation(true),
    },
    {
      icon: 'restaurant-outline',
      title: 'Dietary Preferences',
      subtitle: 'Set your food preferences and restrictions',
      onPress: () => setShowDietary(true),
    },
    {
      icon: 'people-outline',
      title: 'Friends',
      subtitle: 'Manage your friends and invites',
      onPress: () => setShowFriends(true),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => setShowHelp(true),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'Learn more about SwipeDish',
      onPress: () => setShowAbout(true),
    },
  ];

  const renderMenuItem = (item: typeof menuItems[0], index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemIcon}>
        <Ionicons name={item.icon as any} size={24} color={colors.primary} />
      </View>
      
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderEditProfileModal = () => (
    <Modal
      visible={showEditProfile}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={() => setShowEditProfile(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={colors.textTertiary}
              value={editName}
              onChangeText={setEditName}
            />
          </View>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={async () => {
              const name = editName.trim();
              if (!name || !user?.id) return;
              try {
                await AuthService.updateUserProfile(user.id, { displayName: name });
                setUser({ ...user, displayName: name });
                setShowEditProfile(false);
              } catch (e) {
                Alert.alert('Error', 'Could not save your name. Try again.');
              }
            }}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderNotificationsModal = () => (
    <Modal
      visible={showNotifications}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Notifications</Text>
          <TouchableOpacity onPress={() => setShowNotifications(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingTitle}>Match Notifications</Text>
              <Text style={styles.settingSubtitle}>Get notified when you get a match</Text>
            </View>
            <Switch 
              value={notifications.newMatches} 
              onValueChange={(value) => setNotifications(prev => ({ ...prev, newMatches: value }))}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingTitle}>Room Invites</Text>
              <Text style={styles.settingSubtitle}>Get notified when friends invite you to rooms</Text>
            </View>
            <Switch 
              value={notifications.roomInvites} 
              onValueChange={(value) => setNotifications(prev => ({ ...prev, roomInvites: value }))}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingTitle}>New Restaurants</Text>
                              <Text style={styles.settingSubtitle}>Get notified about new restaurants nearby</Text>
            </View>
            <Switch 
              value={notifications.marketing} 
              onValueChange={(value) => setNotifications(prev => ({ ...prev, marketing: value }))}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderLocationModal = () => (
    <Modal
      visible={showLocation}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Location Settings</Text>
          <TouchableOpacity onPress={() => setShowLocation(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={24} color={colors.primary} />
            <Text style={styles.locationText}>
              {userLocation 
                ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
                : 'No location available'
              }
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.locationButton}
            onPress={async () => {
              try {
                // Request location permission and get current position
                const { LocationAccuracy, requestForegroundPermissionsAsync, getCurrentPositionAsync } = await import('expo-location');
                
                const { status } = await requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission denied', 'Location permission is required to use this feature');
                  return;
                }

                const location = await getCurrentPositionAsync({
                  accuracy: LocationAccuracy.Balanced,
                });

                setUserLocation({ 
                  latitude: location.coords.latitude, 
                  longitude: location.coords.longitude 
                });

                // Get address for the location
                const address = await GeocodingService.getCurrentLocationAddress(
                  location.coords.latitude,
                  location.coords.longitude
                );
                
                Alert.alert('Location updated', `Your location has been set to: ${address}`);
              } catch (error) {
                console.error('Error getting current location:', error);
                // Fallback to default location
                const defaultLocation = { latitude: 43.1599795, longitude: -79.2470299 };
                setUserLocation(defaultLocation);
                Alert.alert('Location set', 'Using default location (Hamilton, ON)');
              }
            }}
          >
            <Ionicons name="navigate" size={20} color={colors.text} />
            <Text style={styles.locationButtonText}>Use Current Location</Text>
          </TouchableOpacity>
          
          <View style={{ marginTop: 12 }}>
            <Text style={styles.inputLabel}>Search Location</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter a place, e.g. St. Catharines, Ontario"
                placeholderTextColor={colors.textTertiary}
                value={searchLocation}
                onChangeText={setSearchLocation}
                returnKeyType="search"
                onSubmitEditing={async () => {
                  if (!searchLocation.trim()) {
                    Alert.alert('Invalid input', 'Please enter a location to search');
                    return;
                  }

                  try {
                    const result = await GeocodingService.geocodeText(searchLocation.trim());
                    if (result) {
                      setUserLocation({ latitude: result.latitude, longitude: result.longitude });
                      Alert.alert(
                        'Location updated', 
                        `Your location has been set to: ${GeocodingService.formatAddress(result)}`
                      );
                      setSearchLocation(''); // Clear the search field
                    } else {
                      Alert.alert('Not found', 'Could not find that place. Try another query.');
                    }
                  } catch (error) {
                    console.error('Error geocoding location:', error);
                    Alert.alert('Error', 'Failed to search for location. Please try again.');
                  }
                }}
              />
              <TouchableOpacity
                style={[styles.locationButton, { marginLeft: 8 }]}
                onPress={async () => {
                  if (!searchLocation.trim()) {
                    Alert.alert('Invalid input', 'Please enter a location to search');
                    return;
                  }

                  try {
                    const result = await GeocodingService.geocodeText(searchLocation.trim());
                    if (result) {
                      setUserLocation({ latitude: result.latitude, longitude: result.longitude });
                      Alert.alert(
                        'Location updated', 
                        `Your location has been set to: ${GeocodingService.formatAddress(result)}`
                      );
                      setSearchLocation(''); // Clear the search field
                    } else {
                      Alert.alert('Not found', 'Could not find that place. Try another query.');
                    }
                  } catch (error) {
                    console.error('Error geocoding location:', error);
                    Alert.alert('Error', 'Failed to search for location. Please try again.');
                  }
                }}
              >
                <Ionicons name="search" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderDietaryModal = () => (
    <Modal
      visible={showDietary}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Dietary Preferences</Text>
          <TouchableOpacity onPress={() => setShowDietary(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          {PreferencesService.DIETARY_RESTRICTIONS.map((restriction) => {
            const isSelected = localDietaryRestrictions.includes(restriction);
            return (
              <TouchableOpacity 
                key={restriction} 
                style={styles.dietaryItem}
                onPress={() => toggleDietaryRestriction(restriction)}
              >
                <Text style={styles.dietaryText}>{restriction}</Text>
                <Ionicons 
                  name={isSelected ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={24} 
                  color={isSelected ? colors.primary : colors.textSecondary} 
                />
              </TouchableOpacity>
            );
          })}
          
          <Text style={styles.sectionTitle}>Cuisine Preferences</Text>
          {PreferencesService.CUISINE_TYPES.map((cuisine) => {
            const isSelected = localCuisinePreferences.includes(cuisine);
            return (
              <TouchableOpacity 
                key={cuisine} 
                style={styles.dietaryItem}
                onPress={() => toggleCuisinePreference(cuisine)}
              >
                <Text style={styles.dietaryText}>{cuisine}</Text>
                <Ionicons 
                  name={isSelected ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={24} 
                  color={isSelected ? colors.primary : colors.textSecondary} 
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderFriendsModal = () => (
    <Modal
      visible={showFriends}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Friends</Text>
          <TouchableOpacity onPress={() => setShowFriends(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {isLoadingFriends ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading friends...</Text>
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.emptyFriendsContainer}>
              <Ionicons name="people-outline" size={80} color={colors.textTertiary} />
              <Text style={styles.emptyFriendsTitle}>No Friends Yet</Text>
              <Text style={styles.emptyFriendsSubtitle}>
                Invite friends to join SwipeDish and discover restaurants together!
              </Text>
              
              <TouchableOpacity 
                style={styles.addFriendsButton}
                onPress={() => {
                  Alert.alert(
                    'Add Friends',
                    'Friend invitations coming soon! Share SwipeDish with friends to get started.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="person-add" size={20} color={colors.text} />
                <Text style={styles.addFriendsText}>Add Friends</Text>
              </TouchableOpacity>
            </View>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={styles.friendItem}>
                <View style={styles.friendAvatar}>
                  <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendStatus}>{friend.status}</Text>
                </View>
                <TouchableOpacity style={styles.inviteButton}>
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderHelpModal = () => (
    <Modal
      visible={showHelp}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Help & Support</Text>
          <TouchableOpacity onPress={() => setShowHelp(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.helpItem}
            onPress={() => {
              Alert.alert(
                'How to Create a Room',
                '1. Tap the room icon on the main screen\n2. Choose "Create Room"\n3. Share the room code with friends\n4. Start swiping together!',
                [{ text: 'Got it!' }]
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.helpText}>How to create a room</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.helpItem}
            onPress={() => {
              Alert.alert(
                'How to Join a Room',
                '1. Get a room code from a friend\n2. Tap "Join Room" on the main screen\n3. Enter the room code\n4. Start swiping with friends!',
                [{ text: 'Got it!' }]
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.helpText}>How to join a room</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.helpItem}
            onPress={() => {
              Alert.alert(
                'How Matches Work',
                'When everyone in your room swipes right on the same restaurant, it becomes a match! Check your Matches tab to see all your group matches and take action.',
                [{ text: 'Got it!' }]
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.helpText}>How matches work</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.helpItem}
            onPress={() => {
              Alert.alert(
                'Contact Support',
                'Need help? Contact us at support@swipedish.app\n\nWe typically respond within 24 hours.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <Text style={styles.helpText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderAboutModal = () => (
    <Modal
      visible={showAbout}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>About SwipeDish</Text>
          <TouchableOpacity onPress={() => setShowAbout(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>SwipeDish v1.0.0</Text>
            <Text style={styles.aboutDescription}>
              SwipeDish is a Tinder-style app for deciding what to eat with friends. 
              Create rooms, swipe on restaurants, and get matched when everyone likes the same place!
            </Text>
          </View>
          
          <View style={styles.aboutSection}>
            <Text style={styles.aboutSubtitle}>Features</Text>
            <Text style={styles.aboutText}>• Create and join rooms with friends</Text>
            <Text style={styles.aboutText}>• Swipe on restaurants and dishes</Text>
            <Text style={styles.aboutText}>• Get matched when everyone agrees</Text>
            <Text style={styles.aboutText}>• Explore nearby restaurants</Text>
          </View>
          
          <View style={styles.aboutSection}>
            <Text style={styles.aboutSubtitle}>Contact</Text>
            <Text style={styles.aboutText}>support@swipedish.com</Text>
            <Text style={styles.aboutText}>@swipedish on social media</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.textSecondary} />
            </View>
          </View>
          
          <Text style={styles.userName}>{user?.displayName || 'Anonymous User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'Anonymous account'}</Text>
          
          <TouchableOpacity style={styles.statsContainer} onPress={refreshUserStats} activeOpacity={0.7}>
            <View style={styles.statItem}>
              {userStats.isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.statNumber}>
                  {UserStatsService.formatStatNumber(userStats.matches)}
                </Text>
              )}
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              {userStats.isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.statNumber}>
                  {UserStatsService.formatStatNumber(userStats.rooms)}
                </Text>
              )}
              <Text style={styles.statLabel}>Rooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              {userStats.isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.statNumber}>
                  {UserStatsService.formatStatNumber(userStats.swipes)}
                </Text>
              )}
              <Text style={styles.statLabel}>Swipes</Text>
            </View>
          </TouchableOpacity>
          
          {/* Subtle hint for interactivity */}
          <Text style={styles.statsHint}>Tap to refresh</Text>
        </View>

        {/* User Preferences Summary */}
        {user && (
          <View style={styles.preferencesSection}>
            <Text style={styles.preferencesSectionTitle}>Your Preferences</Text>
            
            <View style={styles.preferenceItem}>
              <Ionicons name="restaurant" size={20} color={colors.primary} />
              <Text style={styles.preferenceText}>
                Favorite Cuisines: {userPreferences.cuisinePreferences.length > 0 
                  ? userPreferences.cuisinePreferences.join(', ')
                  : 'None selected'}
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Ionicons name="fitness" size={20} color={colors.primary} />
              <Text style={styles.preferenceText}>
                Dietary Restrictions: {userPreferences.dietaryRestrictions.length > 0 
                  ? userPreferences.dietaryRestrictions.join(', ')
                  : 'None'}
              </Text>
            </View>

            {/* Encourage users to set preferences if they haven't */}
            {userPreferences.cuisinePreferences.length === 0 && userPreferences.dietaryRestrictions.length === 0 && (
              <TouchableOpacity 
                style={styles.preferencesHint} 
                onPress={() => setShowEditProfile(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.preferencesHintText}>
                  Tap "Dietary Preferences" below to set your cuisine and dietary preferences for better recommendations
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>SwipeDish v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderEditProfileModal()}
      {renderNotificationsModal()}
      {renderLocationModal()}
      {renderDietaryModal()}
      {renderFriendsModal()}
      {renderHelpModal()}
      {renderAboutModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  userSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  userName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.sm,
  },
  menuSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  menuItemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  signOutText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    color: colors.textTertiary,
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
    borderBottomColor: colors.surface,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.small,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  settingTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  locationText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  locationButtonText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  dietaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  dietaryText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  friendStatus: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  inviteButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  helpText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  aboutSection: {
    marginBottom: spacing.lg,
  },
  aboutTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  aboutDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  aboutSubtitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  aboutText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
  emptyFriendsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  emptyFriendsTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  emptyFriendsSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  addFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  addFriendsText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  preferencesSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  preferencesSectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  preferenceText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  preferencesHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  preferencesHintText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
    fontSize: 13,
  },
});
