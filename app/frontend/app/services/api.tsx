import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: 'http://10.0.2.2:5000/',
  timeout: 10000,
});

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
