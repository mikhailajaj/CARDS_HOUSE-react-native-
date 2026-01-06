// Jest setup file for additional configuration
import '@testing-library/jest-native/extend-expect';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Suppress noisy logs and warnings in tests to reduce flakiness
  log: console.log, // keep normal logs by default
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error,
};

// Mock Animated for component tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Moti for component tests
jest.mock('moti', () => ({
  MotiView: 'MotiView',
  AnimatePresence: ({ children }) => children,
}));

// Mock FontAwesome to avoid ESM issues in tests
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

// Mock AsyncStorage for tests (avoid native module)
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Global cleanup for timers to prevent teardown warnings
const isUsingFakeTimers = () => typeof setTimeout === 'function' && !!(setTimeout.__isMock || (setTimeout.hasOwnProperty && setTimeout.hasOwnProperty('mock')) || (jest.isMockFunction && jest.isMockFunction(setTimeout)));
afterEach(() => {
  if (isUsingFakeTimers()) {
    try { jest.runOnlyPendingTimers(); } catch {}
    try { jest.clearAllTimers(); } catch {}
    try { jest.useRealTimers(); } catch {}
  }
});

// Extra safety: flush any remaining timers after all tests complete
afterAll(() => {
  if (isUsingFakeTimers()) {
    try { jest.runOnlyPendingTimers(); } catch {}
    try { jest.clearAllTimers(); } catch {}
    try { jest.useRealTimers(); } catch {}
  }
});
