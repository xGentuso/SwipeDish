import React, { useEffect, useMemo, useCallback } from 'react';
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
import { useAppStore } from '../store/useAppStore';
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
  const { user, setUser } = useAppStore();

  // Memoize auth state change handler to prevent unnecessary re-subscriptions
  const handleAuthStateChange = useCallback(async (firebaseUser: any) => {
    if (firebaseUser) {
      try {
        const userData = await AuthService.getUser(firebaseUser.uid);
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    } else {
      // Don't automatically sign in anonymously - let user choose
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(handleAuthStateChange);
    return () => {
      unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Memoize stack screen options
  const stackScreenOptions = useMemo(() => ({ headerShown: false }), []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={stackScreenOptions}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !user.displayName ? (
          <Stack.Screen name="Username" component={UsernameScreen} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
