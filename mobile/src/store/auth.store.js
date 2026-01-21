import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');

      if (!token) {
        set({ isInitialized: true });
        return;
      }

      const res = await api.get('/auth/me');

      set({
        user: res.data,
        isAuthenticated: true,
        isInitialized: true,
      });
    } catch (err) {
      console.log('Error loading user:', err);
      await SecureStore.deleteItemAsync('accessToken');
      set({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
      });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });

    try {
      const res = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = res.data;

      await SecureStore.setItemAsync('accessToken', token);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (firstName, lastName, email, password) => {
    set({ isLoading: true });

    try {
      const res = await api.post('/auth/register', { firstName, lastName, email, password });

      const { token, user } = res.data;

      await SecureStore.setItemAsync('accessToken', token);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    set({ user: null, isAuthenticated: false });
  },
}));
