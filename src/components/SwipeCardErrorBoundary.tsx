import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../constants/styles';
import { analyticsService, AnalyticsEvent } from '../services/analyticsService';
import { logger } from '../services/loggingService';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SwipeCardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log swipe-specific errors
    logger.error('SwipeCard Error Boundary triggered', 'SWIPE_CARD_ERROR', {
      error: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      errorName: error.name,
    });

    // Track in analytics
    analyticsService.trackEvent(AnalyticsEvent.SWIPE_CARD_ERROR, {
      error_message: error.message,
      error_name: error.name,
      component_stack: errorInfo.componentStack?.slice(0, 500) || 'unknown',
    });

    // Log to console for development
    console.error('SwipeCard ErrorBoundary caught an error:', error, errorInfo);
    
    if (__DEV__) {
      console.error('SwipeCard Error details:', error);
      console.error('SwipeCard Error stack:', error.stack);
      console.error('SwipeCard Component stack:', errorInfo.componentStack);
    }

    this.setState({
      error,
    });
  }

  handleRetry = () => {
    logger.info('SwipeCard error boundary retry attempted', 'SWIPE_CARD_ERROR');
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
    
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="refresh-circle" size={48} color={colors.textSecondary} />
            <Text style={styles.title}>Swipe Issue Detected</Text>
            <Text style={styles.message}>
              There was a problem with the swipe functionality. Tap to retry.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Mode):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>Retry Swipe</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  errorDetails: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  errorTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 10,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
});
