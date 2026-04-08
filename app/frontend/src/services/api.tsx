import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

const URL_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' ? 'http://localhost:5000/' : 'http://10.0.2.2:5000/');

const api = axios.create({
  baseURL: URL_BASE,
  paramsSerializer: (params) => {
    const busca = new URLSearchParams();
    for (const [chave, valor] of Object.entries(params)) {
      if (Array.isArray(valor)) {
        valor.forEach((v) => busca.append(chave, String(v)));
      } else if (valor != null) {
        busca.append(chave, String(valor));
      }
    }
    return busca.toString();
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@auth_session');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (__DEV__) {
      console.log('Erro HTTP:', error.response?.status, error.response?.data ?? error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
