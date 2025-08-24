import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { useAppStore } from '../store';
import { AuthService } from '../services/authService';

interface UsernameScreenProps {
  navigation: any;
}

export const UsernameScreen: React.FC<UsernameScreenProps> = ({ navigation }) => {
  const { setUser, signInAnonymously } = useAppStore();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      Alert.alert('Choose a name', 'Your name must be at least 2 characters.');
      return;
    }
    try {
      setLoading(true);
      const user = await AuthService.signInAnonymously();
      await AuthService.updateUserProfile(user.id, { displayName: trimmed });
      setUser({ ...user, displayName: trimmed });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('Oops', 'Could not continue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pick a display name</Text>
        <Text style={styles.subtitle}>Friends will see this when you join rooms.</Text>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={colors.textTertiary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="words"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.cta, (!username.trim() || loading) && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={!username.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.ctaText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  header: {
    marginTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    fontWeight: 'bold',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  content: {
    marginTop: spacing.xl,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.small,
  },
  ctaDisabled: {
    backgroundColor: colors.textTertiary,
  },
  ctaText: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
});


