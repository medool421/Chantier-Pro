import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { useMyNotifications } from '../hooks/useNotifications';

/**
 * Drop this bell in any header:
 *   <NotificationBell />
 *
 * It polls every 30s automatically via useMyNotifications.
 */
export default function NotificationBell() {
  const router = useRouter();
  const { data } = useMyNotifications();
  const unreadCount = data?.unreadCount || 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/notifications')}
    >
      <Ionicons name="notifications-outline" size={26} color={colors.textDark} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error || '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});