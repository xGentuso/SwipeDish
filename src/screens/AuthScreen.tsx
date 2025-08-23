import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { useAppStore } from '../store/useAppStore';
import { InputValidation, ValidationError } from '../utils/inputValidation';
import { GoogleSignInService } from '../services/googleSignInService';

type AuthMode = 'signin' | 'signup';

export const AuthScreen: React.FC = () => {
  const {
    isLoading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAnonymously,
  } = useAppStore();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleSignInAvailable, setIsGoogleSignInAvailable] = useState(false);

  useEffect(() => {
    // Check if Google Sign-In is available
    const checkGoogleSignIn = async () => {
      await GoogleSignInService.initialize();
      setIsGoogleSignInAvailable(GoogleSignInService.isGoogleSignInAvailable());
    };
    
    checkGoogleSignIn();
  }, []);

  // Monitor error state and show alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Authentication Error', error);
    }
  }, [error]);

  // Cleanup loading state on unmount
  useEffect(() => {
    return () => {
      if (isLoading) {
        // Loading state will be handled by the store's safety mechanisms
      }
    };
  }, [isLoading]);

  const handleEmailAuth = async () => {
    // Validate inputs
    if (!InputValidation.validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!InputValidation.validateDisplayName(displayName)) {
        Alert.alert('Invalid Name', 'Please enter a valid display name (only letters, numbers, spaces, hyphens, and underscores).');
        return;
      }
      await signUpWithEmail(email, password, displayName);
    } else {
      await signInWithEmail(email, password);
    }
  };

  const handleGoogleAuth = async () => {
    if (!isGoogleSignInAvailable) {
      Alert.alert(
        'Google Sign-In Not Available', 
        'Google Sign-In is not available in Expo Go. Please use a development build or physical device to test Google Sign-In.'
      );
      return;
    }
    
    await signInWithGoogle();
  };

  const handleAnonymousAuth = async () => {
    await signInAnonymously();
  };

  const isFormValid = () => {
    if (!email || !password) return false;
    if (mode === 'signup' && !displayName) return false;
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to SwipeDish</Text>
            <Text style={styles.subtitle}>
              {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
            </Text>
          </View>

          {/* Auth Mode Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                mode === 'signin' && styles.toggleButtonActive,
              ]}
              onPress={() => setMode('signin')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'signin' && styles.toggleTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                mode === 'signup' && styles.toggleButtonActive,
              ]}
              onPress={() => setMode('signup')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'signup' && styles.toggleTextActive,
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your display name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Email Auth Button */}
            <TouchableOpacity
              style={[
                styles.authButton,
                !isFormValid() && styles.authButtonDisabled,
              ]}
              onPress={handleEmailAuth}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.authButtonText}>
                  {mode === 'signin' ? 'Sign In with Email' : 'Sign Up with Email'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth Buttons */}
          <View style={styles.socialAuth}>
            {isGoogleSignInAvailable ? (
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleAuth}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={24} color={colors.text} />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.socialButton, styles.googleButton, styles.disabledButton]}>
                <Ionicons name="logo-google" size={24} color={colors.textTertiary} />
                <Text style={[styles.socialButtonText, styles.disabledButtonText]}>
                  Google Sign-In (Not Available in Expo Go)
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.socialButton, styles.anonymousButton]}
              onPress={handleAnonymousAuth}
              disabled={isLoading}
            >
              <Ionicons name="person-outline" size={24} color={colors.text} />
              <Text style={styles.socialButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}



          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.text,
  },
  form: {
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  passwordToggle: {
    padding: spacing.sm,
  },
  authButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.medium,
  },
  authButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  authButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surface,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  socialAuth: {
    gap: spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: colors.surface,
  },
  disabledButtonText: {
    color: colors.textTertiary,
  },
  googleButton: {
    backgroundColor: colors.card,
    borderColor: colors.surface,
  },
  anonymousButton: {
    backgroundColor: colors.surface,
    borderColor: colors.textTertiary,
  },
  socialButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});