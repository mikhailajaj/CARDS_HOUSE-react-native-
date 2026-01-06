module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|moti|@motify)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'components/**/*.js',
    'screens/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.test.js',
    '!**/tmp_rovodev_*.js'
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    './utils/gameLogic.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './utils/state/GameReducer.js': {
      statements: 100,
      branches: 95,
      functions: 100,
      lines: 100
    },
    './utils/engine/PlayEngine.js': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    }
  },
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  testEnvironment: 'node'
};
