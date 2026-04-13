import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'http://10.0.2.2:5000/api/',
  // baseURL: 'http://192.168.1.12:5000/api/',
  // baseURL: 'http://192.168.1.140:5000/api/',
  // baseURL: 'http://192.168.1.105:5000/api/',
  // baseURL: 'http://192.168.100.33:5000/api/',
  // baseURL: 'http://192.168.100.217:5000/api/',
  // baseURL: 'http://192.168.68.102:5000/api/',
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
