import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../../src/api/axios';
import { colors } from '../../../../src/theme/colors';

export default function ProjectFiles() {
  const { id } = useLocalSearchParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchFiles();
  }, [id]);

  const fetchFiles = async () => {
    try {
      const res = await api.get(`/files/projects/${id}`);
      setFiles(res.data.data || []);
    } catch {
      setFiles([]);
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

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <Text style={styles.empty}>Aucun fichier pour ce projet</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.title}>{item.originalName}</Text>
            <Text style={styles.subtitle}>{item.type}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: { fontWeight: '600', fontSize: 15 },
  subtitle: { fontSize: 12, color: colors.textMuted },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
