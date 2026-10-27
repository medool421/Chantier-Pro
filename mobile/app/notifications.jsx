import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { useMyNotifications, useMarkAsRead, useMarkAllAsRead } from '../src/hooks/useNotifications';
import { useAuthStore } from '../src/store/auth.store';

const NOTIFICATION_ICONS = {
  TASK_ASSIGNED:          { name: 'clipboard-outline',   color: '#1976D2' },
  TASK_STATUS_CHANGED:    { name: 'refresh-outline',      color: '#388E3C' },
  PROJECT_STATUS_CHANGED: { name: 'construct-outline',    color: '#F57C00' },
  MANAGER_ASSIGNED:       { name: 'person-add-outline',   color: '#7B1FA2' },
  INVITATION_ACCEPTED:    { name: 'person-add-outline',   color: '#2E7D32' },
};

const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  if (!dateStr || Number.isNaN(date.getTime())) return 'Date inconnue';
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 60)    return 'À l\'instant';
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const { data, isLoading, isError, isRefetching, refetch } = useMyNotifications();
  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const [openingId, setOpeningId] = React.useState(null);

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const handlePress = async (item) => {
    const taskId = item.data?.taskId;
    const projectId = item.data?.projectId;
    if (!taskId && !projectId) {
      Alert.alert('Notification indisponible', 'Cette notification ne contient aucune cible accessible.');
      return;
    }

    setOpeningId(item.id);
    try {
      if (!item.isRead) {
        try {
          await markAsReadMutation.mutateAsync(item.id);
        } catch {
          // The task remains accessible even if marking the notification fails.
        }
      }

      if (taskId) {
        if (role === 'WORKER') {
          router.push(`/(worker)/tasks/${taskId}`);
        } else if (role === 'MANAGER' && projectId) {
          router.push(`/(manager)/projects/${projectId}/tasks/${taskId}`);
        } else if (role === 'BOSS' && projectId) {
          router.push(`/(boss)/projects/${projectId}`);
        } else {
          throw new Error('No role-appropriate task destination');
        }
      } else if (role === 'MANAGER') {
        router.push(`/(manager)/projects/${projectId}`);
      } else if (role === 'BOSS') {
        router.push(`/(boss)/projects/${projectId}`);
      } else {
        throw new Error('No role-appropriate project destination');
      }
    } catch (error) {
      Alert.alert(
        'Cible indisponible',
        'Cette tâche ou ce projet a été supprimé, ou vous n’avez plus accès.'
      );
    } finally {
      setOpeningId(null);
    }
  };

  const renderItem = ({ item }) => {
    const icon = NOTIFICATION_ICONS[item.type] || { name: 'notifications-outline', color: colors.primary };

    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => handlePress(item)}
        disabled={openingId === item.id}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>

        {openingId === item.id ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : !item.isRead ? (
          <View style={styles.unreadDot} />
        ) : null}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Notifications indisponibles</Text>
        <Text style={styles.errorText}>Vérifiez votre connexion et réessayez.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: unreadCount > 0
            ? () => (
              <TouchableOpacity
                onPress={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                style={styles.headerMarkAllButton}
              >
                <Text style={styles.headerMarkAllText}>Tout marquer comme lu</Text>
              </TouchableOpacity>
            )
            : undefined,
        }}
      />
      <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>Vous serez notifié des mises à jour importantes</Text>
          </View>
        }
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.backgroundLight },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle:    { fontSize: 18, fontWeight: '700', color: colors.textDark, marginTop: 14 },
  errorText:     { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  retryButton:   { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 },
  retryText:     { color: '#fff', fontSize: 14, fontWeight: '600' },
  headerMarkAllButton: { paddingHorizontal: 4, paddingVertical: 8 },
  headerMarkAllText:   { fontSize: 12, color: colors.primary, fontWeight: '600' },
  list:          { paddingBottom: 24 },
  item:          { flexDirection: 'row', alignItems: 'flex-start', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  itemUnread:    { backgroundColor: '#F0F4FF' },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content:       { flex: 1 },
  title:         { fontSize: 14, color: colors.textDark, marginBottom: 4 },
  titleUnread:   { fontWeight: '700' },
  body:          { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 6 },
  time:          { fontSize: 11, color: colors.textMuted },
  unreadDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6, marginLeft: 8 },
  emptyContainer:{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyTitle:    { fontSize: 18, fontWeight: '600', color: colors.textDark, marginTop: 16 },
  emptyText:     { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
});
