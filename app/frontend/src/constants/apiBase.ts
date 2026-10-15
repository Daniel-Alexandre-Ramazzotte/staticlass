import { Platform } from 'react-native';

export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '') ||
  (Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000');
