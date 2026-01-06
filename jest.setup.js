// Jest setup file for additional configuration
import '@testing-library/jest-native/extend-expect';

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(), // Keep error for debugging
};

// Mock Animated for component tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Moti for component tests
jest.mock('moti', () => ({
  MotiView: 'MotiView',
  AnimatePresence: ({ children }) => children,
}));

// Mock React Native components if needed
jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => {
  const { TouchableOpacity } = require('react-native');
  return TouchableOpacity;
});
