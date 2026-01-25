import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../../src/api/axios';
import { colors } from '../../../../src/theme/colors';

export default function ProjectTeam() {
  const { id } = useLocalSearchParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      const res = await api.get(`/teams/project/${id}`);
      setTeam(res.data.data);
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Aucune équipe assignée</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Chef de chantier</Text>
      <View style={styles.card}>
        <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
        <Text style={styles.name}>
          {team.manager.firstName} {team.manager.lastName}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Ouvriers</Text>
      {team.members.map((m) => (
        <View key={m.id} style={styles.card}>
          <Ionicons name="person-outline" size={22} color={colors.textMuted} />
          <Text style={styles.name}>
            {m.user.firstName} {m.user.lastName}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.textDark,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { marginLeft: 12, fontSize: 16, fontWeight: '500' },
  empty: { color: colors.textMuted, fontStyle: 'italic' },
});
