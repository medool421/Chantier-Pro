import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, TextInput, RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/theme/colors';
import api from '../../../src/api/axios';

export default function AssignManager() {
  const { projectId } = useLocalSearchParams();
  const router = useRouter();
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchManagers();
  }, []);

  useEffect(() => {
    // Filter managers based on search
    if (searchQuery.trim() === '') {
      setFilteredManagers(managers);
    } else {
      const filtered = managers.filter(m => 
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredManagers(filtered);
    }
  }, [searchQuery, managers]);

  const fetchManagers = async () => {
    try {
      const response = await api.get("/projects/managers");
      
      const allManagers = response.data.data || [];
      setManagers(allManagers);
      setFilteredManagers(allManagers);
    } catch (error) {
      console.error('Error fetching managers:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Erreur', 'Impossible de charger la liste des chefs de chantier');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchManagers();
  };

  const handleAssign = async () => {
    if (!selectedManager) {
      Alert.alert('Attention', 'Veuillez sélectionner un chef de chantier');
      return;
    }

    setAssigning(true);
    try {
      await api.patch(`/projects/${projectId}/assign-manager`, { 
        managerId: selectedManager.id 
      });
      
      Alert.alert('Succès', 'Chef de chantier assigné avec succès');
      router.back();
    } catch (error) {
      console.error('Error assigning manager:', error);
      Alert.alert('Erreur', 'L\'assignation a échoué');
    } finally {
      setAssigning(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedManager?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => setSelectedManager(item)}
      >
        <View style={styles.userInfo}>
          <View style={[styles.avatar, isSelected && styles.selectedAvatar]}>
            <Text style={[styles.avatarText, isSelected && styles.selectedAvatarText]}>
              {(item.firstName?.[0] || 'M').toUpperCase()}
              {(item.lastName?.[0] || '').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, isSelected && styles.selectedText]}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={[styles.email, isSelected && styles.selectedTextMuted]}>
              {item.email}
            </Text>
            {item.phone && (
              <Text style={[styles.phone, isSelected && styles.selectedTextMuted]}>
                📱 {item.phone}
              </Text>
            )}
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={28} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choisir un Chef de Chantier</Text>
        <Text style={styles.headerSubtitle}>
          Sélectionnez un responsable pour ce projet
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Managers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredManagers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucun manager disponible'}
              </Text>
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>Effacer la recherche</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Footer Button */}
      <View style={styles.footer}>
        {selectedManager && (
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              Sélectionné: {selectedManager.firstName} {selectedManager.lastName}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, (!selectedManager || assigning) && styles.disabledButton]}
          onPress={handleAssign}
          disabled={!selectedManager || assigning}
        >
          {assigning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Confirmer l'assignation</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.textDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedAvatar: {
    backgroundColor: '#fff',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  selectedAvatarText: {
    color: colors.primary,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
    color: colors.textMuted,
  },
  selectedText: {
    color: '#fff',
  },
  selectedTextMuted: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 16,
    fontSize: 16,
  },
  clearSearchText: {
    color: colors.primary,
    marginTop: 12,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
  },
  selectionInfo: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectionText: {
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});