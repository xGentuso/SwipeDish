export const colors = {
  // Brand Colors
  primary: '#FF4D5A', // Match Red
  secondary: '#00C2D1', // Mint Blue
  success: '#00D26A', // Success Green
  
  // Background Colors
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2A2A2A',
  
  // Text Colors
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  
  // Accent Colors
  accent: '#FFD6D6',
  warning: '#FFB74D',
  error: '#F44336',
  
  // Swipe Colors
  like: '#00D26A',
  dislike: '#F44336',
  superLike: '#00C2D1',
  
  // Gradients
  primaryGradient: ['#FF4D5A', '#FF6B7A'],
  secondaryGradient: ['#00C2D1', '#00E5F7'],
  backgroundGradient: ['#121212', '#1E1E1E'],
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  
  // Border colors
  border: '#3A3A3A',
  borderLight: '#4A4A4A',
  
  // Additional colors
  textPrimary: '#FFFFFF',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof colors;
