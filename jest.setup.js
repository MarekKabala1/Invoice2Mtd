// Global test setup
global.__DEV__ = true;

// Mock react-native Platform
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    ...ReactNative,
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock expo modules
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  readAsStringAsync: jest.fn(() => Promise.resolve('mock content')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  StorageAccessFramework: {
    createFileAsync: jest.fn(() => Promise.resolve('mock-file-uri')),
  },
  EncodingType: {
    Base64: 'base64',
  },
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file://mock.pdf' })),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
}));

jest.mock('expo-mail-composer', () => ({
  composeAsync: jest.fn(() => Promise.resolve({ status: 'sent' })),
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
  G: 'G',
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  ReactNavigationInstrumentation: jest.fn().mockImplementation(() => ({
    registerNavigationContainer: jest.fn(),
  })),
  ReactNativeTracing: jest.fn().mockImplementation(() => ({
    setupNavigationContainer: jest.fn(),
  })),
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock expo-quick-actions
jest.mock('expo-quick-actions', () => ({
  setItems: jest.fn(),
}));

jest.mock('expo-quick-actions/router', () => ({
  useQuickActionRouting: jest.fn(),
}));

// Suppress console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0] && args[0].includes('Warning:')) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});