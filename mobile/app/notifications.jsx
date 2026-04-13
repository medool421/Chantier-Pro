import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { useMyNotifications, useMarkAsRead, useMarkAllAsRead } from '../src/hooks/useNotifications';

const NOTIFICATION_ICONS = {
  TASK_ASSIGNED:          { name: 'clipboard-outline',   color: '#1976D2' },
  TASK_STATUS_CHANGED:    { name: 'refresh-outline',      color: '#388E3C' },
  PROJECT_STATUS_CHANGED: { name: 'construct-outline',    color: '#F57C00' },
  MANAGER_ASSIGNED:       { name: 'person-add-outline',   color: '#7B1FA2' },
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'À l\'instant';
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useMyNotifications();
  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const handlePress = (item) => {
    // Mark as read
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id);
    }
    // Navigate to relevant screen
    if (item.data?.taskId) {
      router.push(`/tasks/${item.data.taskId}`);
    } else if (item.data?.projectId) {
      router.push(`/projects/${item.data.projectId}`);
    }
  };

  const renderItem = ({ item }) => {
    const icon = NOTIFICATION_ICONS[item.type] || { name: 'notifications-outline', color: colors.primary };

    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => handlePress(item)}
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

        {!item.isRead && <View style={styles.unreadDot} />}
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

  return (
    <View style={styles.container}>
      {/* Header actions */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending}
        >
          <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      )}

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
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.backgroundLight },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  markAllButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  markAllText:   { fontSize: 14, color: colors.primary, fontWeight: '600' },
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