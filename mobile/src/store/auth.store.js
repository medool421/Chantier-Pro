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
        set({ isInitialized: true, isAuthenticated: false });
        return;
      }
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, isInitialized: true });
    } catch (err) {
      // Si /auth/me échoue au démarrage, on nettoie
      await SecureStore.deleteItemAsync('accessToken');
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      await SecureStore.setItemAsync('accessToken', token);
      set({ user, isAuthenticated: true, isLoading: false });
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

// --- INTERCEPTEUR DE RÉPONSE ---
// Il surveille toutes les erreurs 401 venant du backend
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Token expiré ou invalide. Déconnexion automatique...");
      // Déclenche le logout du store
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);