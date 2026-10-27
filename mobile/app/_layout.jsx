import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/auth.store';
import { queryClient } from '../src/utils/queryClient';
import { colors } from '../src/theme/colors';

function StatusBarAppearance({ isDarkMode }) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? colors.primary : colors.backgroundLight}
      />
      {isDarkMode && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: insets.top,
            backgroundColor: colors.primary,
          }}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    // Deep-link relay — unauthenticated users opening chantierpro://invite/:token
    // must be able to reach this route before being redirected to invite-register
    const inInviteGroup = segments[0] === 'invite';

    if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    } else if (!isAuthenticated && !inAuthGroup && !inInviteGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments, isInitialized]);

  return (
    <SafeAreaProvider>
      {isInitialized ? (
        <SafeAreaView
          edges={['bottom']}
          style={{ flex: 1, backgroundColor: isDarkMode ? '#000000' : colors.backgroundLight }}
        >
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="notifications"
                options={{ headerShown: true, title: 'Notifications' }}
              />
            {/* Deep-link relay: chantierpro://invite/:token → app/invite/[token].jsx */}
              <Stack.Screen
                name="invite/[token]"
                options={{ headerShown: false }}
              />
            </Stack>
          </QueryClientProvider>
        </SafeAreaView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <StatusBarAppearance isDarkMode={isDarkMode} />
    </SafeAreaProvider>
  );
}
