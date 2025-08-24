import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SwipeCardErrorBoundary } from '../SwipeCardErrorBoundary';

// Mock the services
jest.mock('../../services/analyticsService', () => ({
  analyticsService: {
    trackEvent: jest.fn(),
  },
  AnalyticsEvent: {
    SWIPE_CARD_ERROR: 'SWIPE_CARD_ERROR',
  },
}));

jest.mock('../../services/loggingService', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock constants
jest.mock('../../constants/styles', () => ({
  colors: {
    textSecondary: '#666666',
    background: '#000000',
    textPrimary: '#FFFFFF',
    surface: '#1A1A1A',
    textTertiary: '#999999',
    primary: '#FF6B6B',
    white: '#FFFFFF',
  },
  typography: {
    h3: { fontSize: 24, fontWeight: 'bold' },
    body: { fontSize: 16 },
    caption: { fontSize: 12 },
    button: { fontSize: 16, fontWeight: '600' },
  },
  spacing: {
    lg: 24,
    md: 16,
    sm: 8,
    xs: 4,
  },
  borderRadius: {
    md: 8,
  },
}));

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }
  return <Text>Normal component</Text>;
};

describe('SwipeCardErrorBoundary', () => {
  const mockOnRetry = jest.fn();
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for these tests since we're intentionally causing errors
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <SwipeCardErrorBoundary>
        <ThrowError shouldThrow={false} />
      </SwipeCardErrorBoundary>
    );

    expect(getByText('Normal component')).toBeTruthy();
  });

  it('should render error UI when child component throws', () => {
    const { getByText } = render(
      <SwipeCardErrorBoundary onRetry={mockOnRetry}>
        <ThrowError shouldThrow={true} />
      </SwipeCardErrorBoundary>
    );

    expect(getByText('Swipe Issue Detected')).toBeTruthy();
    expect(getByText('There was a problem with the swipe functionality. Tap to retry.')).toBeTruthy();
    expect(getByText('Retry Swipe')).toBeTruthy();
  });

  it('should call onRetry when retry button is pressed', () => {
    const { getByText } = render(
      <SwipeCardErrorBoundary onRetry={mockOnRetry}>
        <ThrowError shouldThrow={true} />
      </SwipeCardErrorBoundary>
    );

    const retryButton = getByText('Retry Swipe');
    fireEvent.press(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('should reset error state when retry is pressed', () => {
    const TestComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <SwipeCardErrorBoundary 
          onRetry={() => setShouldThrow(false)}
        >
          <ThrowError shouldThrow={shouldThrow} />
        </SwipeCardErrorBoundary>
      );
    };

    const { getByText, queryByText } = render(<TestComponent />);

    // Initially should show error
    expect(getByText('Swipe Issue Detected')).toBeTruthy();

    // Press retry
    const retryButton = getByText('Retry Swipe');
    fireEvent.press(retryButton);

    // Should now show normal component
    expect(queryByText('Swipe Issue Detected')).toBeFalsy();
    expect(getByText('Normal component')).toBeTruthy();
  });

  it('should show error details in development mode', () => {
    const originalDEV = (global as any).__DEV__;
    (global as any).__DEV__ = true;

    const { getByText } = render(
      <SwipeCardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SwipeCardErrorBoundary>
    );

    expect(getByText('Error Details (Dev Mode):')).toBeTruthy();
    expect(getByText(/Test error for error boundary/)).toBeTruthy();

    (global as any).__DEV__ = originalDEV;
  });

  it('should hide error details in production mode', () => {
    const originalDEV = (global as any).__DEV__;
    (global as any).__DEV__ = false;

    const { queryByText } = render(
      <SwipeCardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SwipeCardErrorBoundary>
    );

    expect(queryByText('Error Details (Dev Mode):')).toBeFalsy();
    expect(queryByText(/Test error for error boundary/)).toBeFalsy();

    (global as any).__DEV__ = originalDEV;
  });

  it('should work without onRetry callback', () => {
    const { getByText } = render(
      <SwipeCardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SwipeCardErrorBoundary>
    );

    const retryButton = getByText('Retry Swipe');
    
    // Should not throw when pressing retry without onRetry callback
    expect(() => fireEvent.press(retryButton)).not.toThrow();
  });

  it('should log error details when error occurs', () => {
    const { logger } = require('../../services/loggingService');
    const { analyticsService } = require('../../services/analyticsService');

    render(
      <SwipeCardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SwipeCardErrorBoundary>
    );

    expect(logger.error).toHaveBeenCalledWith(
      'SwipeCard Error Boundary triggered',
      'SWIPE_CARD_ERROR',
      expect.objectContaining({
        error: 'Test error for error boundary',
        errorName: 'Error',
      })
    );

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'SWIPE_CARD_ERROR',
      expect.objectContaining({
        error_message: 'Test error for error boundary',
        error_name: 'Error',
      })
    );
  });

  it('should log retry attempts', () => {
    const { logger } = require('../../services/loggingService');

    const { getByText } = render(
      <SwipeCardErrorBoundary onRetry={mockOnRetry}>
        <ThrowError shouldThrow={true} />
      </SwipeCardErrorBoundary>
    );

    const retryButton = getByText('Retry Swipe');
    fireEvent.press(retryButton);

    expect(logger.info).toHaveBeenCalledWith(
      'SwipeCard error boundary retry attempted',
      'SWIPE_CARD_ERROR'
    );
  });
});