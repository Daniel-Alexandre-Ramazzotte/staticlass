import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

// Em produção, defina EXPO_PUBLIC_API_URL no arquivo .env do frontend.
// Fallbacks para desenvolvimento local:
//   web       → http://localhost:5000/
//   android   → http://10.0.2.2:5000/  (emulador aponta para o host)
//   ios/físico→ altere para o IP da sua máquina na rede
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web'
    ? 'http://localhost:5000/'
    : Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/'
    : 'http://192.168.18.185:5000/');

const api = axios.create({
  baseURL: BASE_URL,
  paramsSerializer: (params) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        for (const v of value) search.append(key, String(v));
      } else if (value != null) {
        search.append(key, String(value));
      }
    }
    return search.toString();
  },
});

// Adiciona um interceptor para incluir o token de autenticação em cada requisição
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_session');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Adiciona um interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.log('Status do Erro:', error.response?.status);
      console.log('Dados do Erro:', error.response?.data);
    } else {
      console.log('Erro de rede:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
