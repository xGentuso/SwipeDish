import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/styles';
import { SwipeDeckScreen } from '../screens/SwipeDeckScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UsernameScreen } from '../screens/UsernameScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { LaunchScreen } from '../screens/LaunchScreen';
import { useAppStore } from '../store';
import { AuthService } from '../services/authService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator: React.FC = () => {
  // Memoize tab bar icon function to prevent re-renders
  const getTabBarIcon = useCallback((routeName: string) => {
    return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
      let iconName: keyof typeof Ionicons.glyphMap;

      switch (routeName) {
        case 'Home':
          iconName = focused ? 'flame' : 'flame-outline';
          break;
        case 'Explore':
          iconName = focused ? 'grid' : 'grid-outline';
          break;
        case 'Matches':
          iconName = focused ? 'people' : 'people-outline';
          break;
        case 'Favorites':
          iconName = focused ? 'heart' : 'heart-outline';
          break;
        case 'Profile':
          iconName = focused ? 'person' : 'person-outline';
          break;
        default:
          iconName = 'help-outline';
      }

      return <Ionicons name={iconName} size={size} color={color} />;
    };
  }, []);

  // Memoize screen options to prevent re-creation on each render
  const screenOptions = useMemo(() => ({
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.card,
      borderTopWidth: 1,
      paddingBottom: 8,
      paddingTop: 8,
      height: 80,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600' as const,
    },
    headerShown: false,
  }), []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarIcon: getTabBarIcon(route.name),
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={SwipeDeckScreen}
        options={{ title: 'Swipe' }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{ title: 'Matches' }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{ title: 'Favorites' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { user, setUser, forceAuthScreen, setForceAuthScreen } = useAppStore();
  const [isLaunchComplete, setIsLaunchComplete] = useState(false);

  // Debug logging for navigation flow
  useEffect(() => {
    if (user) {
      console.log('[NAVIGATION] User state:', {
        id: user.id,
        displayName: user.displayName,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        flow: 'Launch → Auth → Username → Onboarding → Main',
      });
    } else {
      console.log('[NAVIGATION] No user - showing Auth screen');
    }
  }, [user]);

  // Memoize auth state change handler to prevent unnecessary re-subscriptions
  const handleAuthStateChange = useCallback(async (firebaseUser: any) => {
    if (firebaseUser) {
      try {
        const userData = await AuthService.getUser(firebaseUser.uid);
        if (userData) {
          setUser(userData);
          setForceAuthScreen(false); // Allow user to proceed past auth screen
          console.log('[AUTH] User authenticated:', userData.displayName);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If we can't fetch user data, sign out the Firebase user
        try {
          await AuthService.signOut();
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }
        setUser(null);
      }
    } else {
      setUser(null);
      console.log('[AUTH] No user - showing auth screen');
    }
  }, [setUser, setForceAuthScreen]);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(handleAuthStateChange);
    return () => {
      unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Memoize stack screen options
  const stackScreenOptions = useMemo(() => ({ headerShown: false }), []);

  // Show launch screen until it's complete
  if (!isLaunchComplete) {
    return <LaunchScreen onLaunchComplete={() => setIsLaunchComplete(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={stackScreenOptions}>
        {!user || forceAuthScreen ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !user.displayName ? (
          <Stack.Screen name="Username" component={UsernameScreen} />
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Main" component={TabNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
