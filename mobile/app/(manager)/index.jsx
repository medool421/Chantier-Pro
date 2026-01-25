import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api/axios';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/auth.store';


export default function ManagerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

  const fetchAssignedProjects = async () => {
    try {
      const res = await api.get('/projects/my-project');
      setProjects(res.data.data || []);
    } catch (err) {
      console.error('Error fetching manager projects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAssignedProjects();
  }, []);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PLANNED':
        return 'Planifié';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'COMPLETED':
        return 'Terminé';
      case 'ON_HOLD':
        return 'En pause';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNED':
        return '#E3F2FD';
      case 'IN_PROGRESS':
        return '#C8E6C9';
      case 'COMPLETED':
        return '#E8F5E9';
      case 'ON_HOLD':
        return '#FFF3E0';
      default:
        return '#F5F5F5';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.username}>{user?.firstName || 'Manager'}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(manager)/profile')}
        >
          <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Projects List */}
      {projects.length > 0 ? (
        projects.map((project) => (
          <TouchableOpacity
          key={project.id}
          style={styles.card}
          activeOpacity={0.85}
          onPress={() =>
            router.push(`/(manager)/projects/${project.id}`)
          }
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="construct-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.projectName}>
                  {project.name}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(project.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusLabel(project.status)}
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.textMuted}
              />
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="briefcase-outline"
            size={64}
            color={colors.textMuted}
          />
          <Text style={styles.emptyTitle}>
            Aucun chantier assigné
          </Text>
          <Text style={styles.emptyText}>
            Un chantier vous sera attribué par le responsable.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 24,
   },
  greeting: {
    fontSize: 16,
    color: colors.textMuted,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  profileButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },

  /* Card */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 6,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },

  /* Empty state */
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});
