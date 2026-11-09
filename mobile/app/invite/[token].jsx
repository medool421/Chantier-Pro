import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { extractInvitationToken } from '../../src/api/invitations.service';

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
  const params = useLocalSearchParams();
  const rawParam = params.token || params.inviteToken || params.code;
  const rawValue = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  const token = extractInvitationToken(rawValue) || (typeof rawValue === 'string' ? rawValue.trim() : '');

  useEffect(() => {
    if (token) {
      router.replace({
        pathname: '/(auth)/invite-register',
        params: { token },
      });
    } else {
      router.replace('/(auth)/login');
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
