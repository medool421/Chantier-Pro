import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsService } from '../../../src/api/invitations.service';
import api from '../../../src/api/axios';
import { colors } from '../../../src/theme/colors';
import { QUERY_KEYS } from '../../../src/utils/queryKeys';

const ROLES = ['MANAGER', 'WORKER'];
const ROLE_LABELS = { MANAGER: 'Chef de chantier', WORKER: 'Ouvrier' };

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:  { label: 'En attente', bg: '#FFF3E0', text: '#E65100' },
  ACCEPTED: { label: 'Acceptée',   bg: '#E8F5E9', text: '#2E7D32' },
  REVOKED:  { label: 'Révoquée',   bg: '#FFEBEE', text: '#C62828' },
  EXPIRED:  { label: 'Expirée',    bg: '#F5F5F5', text: '#757575' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function InvitationsScreen() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MANAGER');

  // GET /api/invitations — list of invitations sent by this boss
  const {
    data: invitations = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.invitations.all,
    queryFn: () => api.get('/invitations').then((r) => r.data.data ?? r.data),
  });

  // Send invite mutation
  const sendMutation = useMutation({
    mutationFn: ({ email, role }) => invitationsService.send({ email, role }),
    onSuccess: () => {
      Alert.alert('Invitation envoyée', `Un email a été envoyé à ${email}.`);
      setEmail('');
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.all });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Impossible d'envoyer l'invitation.";
      Alert.alert('Erreur', msg);
    },
  });

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: (id) => invitationsService.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.all }),
    onError: (err) => {
      const msg = err.response?.data?.message || 'Impossible de révoquer.';
      Alert.alert('Erreur', msg);
    },
  });

  const handleSend = () => {
    if (!email.trim()) {
      Alert.alert('Champ manquant', 'Veuillez saisir une adresse email.');
      return;
    }
    sendMutation.mutate({ email: email.trim(), role });
  };

  const handleRevoke = (invitation) => {
    Alert.alert(
      "Révoquer l'invitation",
      `Révoquer l'invitation envoyée à ${invitation.email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: () => revokeMutation.mutate(invitation.id),
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.cardRole}>{ROLE_LABELS[item.role] || item.role}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {item.status === 'PENDING' && (
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>
            Envoyée le{' '}
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('fr-FR')
              : '—'}
          </Text>
          <TouchableOpacity
            style={styles.revokeButton}
            onPress={() => handleRevoke(item)}
            disabled={revokeMutation.isPending}
          >
            <Ionicons name="close-circle-outline" size={16} color="#C62828" />
            <Text style={styles.revokeText}>Révoquer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Send invitation form ── */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Inviter un membre</Text>

        <TextInput
          placeholder="Email du collaborateur"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => setEmail(text.replace(/\s/g, ''))}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />

        {/* Role selector */}
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <Pressable
              key={r}
              style={[styles.roleChip, role === r && styles.roleChipActive]}
              onPress={() => setRole(r)}
            >
              <Ionicons
                name={r === 'MANAGER' ? 'briefcase-outline' : 'hammer-outline'}
                size={16}
                color={role === r ? '#fff' : colors.textMuted}
              />
              <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                {ROLE_LABELS[r]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.sendButton, sendMutation.isPending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sendMutation.isPending}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.sendButtonText}>Envoyer l'invitation</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* ── Sent invitations list ── */}
      <Text style={styles.listTitle}>Invitations envoyées</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="mail-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucune invitation envoyée</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  // ── Form ──
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 16,
  },
  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  roleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  roleChipTextActive: {
    color: '#fff',
  },
  sendButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // ── List ──
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 2,
  },
  cardRole: {
    fontSize: 13,
    color: colors.textMuted,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  cardDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  revokeText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '600',
  },
  // ── Empty ──
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
