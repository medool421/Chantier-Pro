import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../src/theme/colors';

/**
 * Deep link handler for: chantierpro://invite/:token
 *
 * Expo Router maps the URL scheme "chantierpro://" to the app root,
 * so "chantierpro://invite/TOKEN" resolves to this file:
 *   app/invite/[token].jsx
 *
 * This screen immediately forwards the token to the invite-register
 * screen (which lives in the (auth) group so unauthenticated users
 * can always reach it).
 */
export default function InviteDeepLink() {
  const { token } = useLocalSearchParams();

  useEffect(() => {
    if (token) {
      // Forward to the registration screen, passing the token as a param
      router.replace({
        pathname: '/(auth)/invite-register',
        params: { token },
      });
    }
  }, [token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
