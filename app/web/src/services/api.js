import axios from 'axios';
import { appUrl } from '../utils/paths.js';

const api = axios.create({ baseURL: appUrl('/api') });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = appUrl('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
