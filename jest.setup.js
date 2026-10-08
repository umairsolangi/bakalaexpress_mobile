/* eslint-env jest */

// Mock SecureStore
const secureStoreMock: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => secureStoreMock[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    secureStoreMock[key] = value;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete secureStoreMock[key];
  }),
}));

// Mock AsyncStorage
const asyncStorageMock: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => asyncStorageMock[key] ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    asyncStorageMock[key] = value;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete asyncStorageMock[key];
  }),
  clear: jest.fn(async () => {
    for (const key of Object.keys(asyncStorageMock)) {
      delete asyncStorageMock[key];
    }
  }),
}));
