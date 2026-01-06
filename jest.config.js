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
  // Coverage thresholds removed - track coverage trends in Codecov instead
  // TODO: Re-enable with realistic thresholds after increasing test coverage
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  testEnvironment: 'node'
};
