import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../api/axios';
import { registerPushToken } from '../utils/registerPushToken';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ isInitialized: true, isAuthenticated: false });
        return;
      }
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isAuthenticated: true, isInitialized: true });
    } catch (err) {
      await SecureStore.deleteItemAsync('accessToken');
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      await SecureStore.setItemAsync('accessToken', token);
      set({ user, isAuthenticated: true, isLoading: false });
      registerPushToken();
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // BOSS self-registration — creates company atomically
  registerBoss: async ({ firstName, lastName, email, password, companyName }) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register-boss', {
        firstName,
        lastName,
        email,
        password,
        companyName,
      });
      const { token, user } = res.data.data;
      await SecureStore.setItemAsync('accessToken', token);
      set({ user, isAuthenticated: true, isLoading: false });
      registerPushToken();
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // Invited user registration (MANAGER or WORKER)
  // Backend derives email, role, companyId from the invitation token
  // Frontend only sends: firstName, lastName, password, inviteToken
  registerInvited: async ({ firstName, lastName, password, inviteToken, email }) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', {
        firstName,
        lastName,
        password,
        inviteToken,
        ...(email && { email }),
      });
      const { token, user } = res.data.data;
      await SecureStore.setItemAsync('accessToken', token);
      set({ user, isAuthenticated: true, isLoading: false });
      registerPushToken();
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

// Intercept 401 responses — auto logout when token expires
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Token expiré ou invalide. Déconnexion automatique...');
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);