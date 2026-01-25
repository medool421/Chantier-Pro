import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/auth.store'; // Vérifie bien le chemin

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      // Rediriger vers l'accueil ou le dashboard manager
      router.replace('/(manager)/tasks'); 
    } else if (!isAuthenticated && !inAuthGroup) {
      // Rediriger vers le login
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments, isInitialized]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}