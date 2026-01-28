import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: 'http://10.0.2.2:5000/',
  timeout: 10000,
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
      const message =
        (error.response?.data as any)?.message || 'Ocorreu um erro inesperado.';

      const customError = new Error(message);
      // @ts-ignore
      customError.originalError = error;
      return Promise.reject(customError);
    }
  }
);

export default api;
