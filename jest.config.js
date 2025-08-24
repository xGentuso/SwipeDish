module.exports = {
  preset: 'jest-expo',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts',
    '@testing-library/jest-native/extend-expect'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    'App.test.tsx',
  ],
  testEnvironment: 'jsdom',
  modulePathIgnorePatterns: ['<rootDir>/node_modules'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
};