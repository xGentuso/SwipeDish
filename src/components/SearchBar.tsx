import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search restaurants, cuisines, or dishes...",
  onFocus,
  onBlur,
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusAnim = useState(new Animated.Value(0))[0];
  const clearAnim = useState(new Animated.Value(0))[0];

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [onFocus, focusAnim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [onBlur, focusAnim]);

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
    
    // Animate clear button
    Animated.sequence([
      Animated.timing(clearAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(clearAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [onChangeText, clearAnim]);

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    // Could trigger search here
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.surface, colors.primary],
          }),
          shadowOpacity: focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 0.2],
          }),
        },
      ]}
    >
      <View style={styles.searchIconContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isFocused ? colors.primary : colors.textTertiary} 
        />
      </View>

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />

      {value.length > 0 && (
        <Animated.View
          style={[
            styles.clearButton,
            {
              transform: [
                {
                  scale: clearAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.clearButtonTouchable}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {value.length > 0 && (
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.small,
  },
  searchIconContainer: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    marginRight: spacing.sm,
  },
  clearButtonTouchable: {
    padding: spacing.xs,
  },
  searchButton: {
    padding: spacing.xs,
  },
});





