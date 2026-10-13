import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api/';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

// Intercepteur de REQUÊTE : Ajoute le token s'il existe
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
