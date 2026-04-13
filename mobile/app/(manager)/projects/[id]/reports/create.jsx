import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../src/theme/colors';
import { useCreateReport } from '../../../../../src/hooks/useReports';

const REPORT_TYPES = [
  { label: 'Journalier', value: 'DAILY', icon: 'document-text-outline', color: colors.primary },
  { label: 'Hebdomadaire', value: 'WEEKLY', icon: 'calendar-outline', color: '#1976D2' },
  { label: 'Incident', value: 'INCIDENT', icon: 'alert-circle-outline', color: '#C62828' },
];

export default function CreateReport() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const projectId = id;

  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'DAILY',
    reportDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  const createMutation = useCreateReport(projectId);

  const handleSubmit = () => {
    if (!form.title || !form.content) {
      Alert.alert('Champs requis', 'Veuillez remplir le titre et le contenu du rapport.');
      return;
    }

    createMutation.mutate(form, {
      onSuccess: () => {
        Alert.alert('Succès', 'Rapport créé avec succès', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || "Impossible de créer le rapport.";
        Alert.alert('Erreur', msg);
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.titleText}>Nouveau Rapport</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Type de rapport</Text>
        </View>

        <View style={styles.typeContainer}>
          {REPORT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                form.type === type.value && { borderColor: type.color, backgroundColor: type.color + '10' }
              ]}
              onPress={() => setForm({ ...form, type: type.value })}
            >
              <Ionicons
                name={type.icon}
                size={24}
                color={form.type === type.value ? type.color : colors.textMuted}
              />
              <Text style={[
                styles.typeLabel,
                form.type === type.value && { color: type.color, fontWeight: '700' }
              ]}>
                {type.label}
              </Text>
              {form.type === type.value && (
                <View style={[styles.checkCircle, { backgroundColor: type.color }]}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Titre du rapport</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Avancement gros œuvre - Secteur A"
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date du rapport</Text>
          <View style={styles.datePickerContainer}>
            <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.dateInput}
              value={form.reportDate}
              onChangeText={(t) => setForm({ ...form, reportDate: t })}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <Text style={styles.helperText}>Format: AAAA-MM-JJ (ex: 2024-03-20)</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contenu / Détails</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez les travaux effectués, les problèmes rencontrés, etc."
            multiline
            numberOfLines={8}
            value={form.content}
            onChangeText={(t) => setForm({ ...form, content: t })}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, createMutation.isPending && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Envoyer le Rapport</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 24 },
  titleText: { fontSize: 24, fontWeight: '800', color: colors.textDark, marginBottom: 24 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  typeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
  },
  typeLabel: { fontSize: 11, marginTop: 8, color: colors.textMuted, textAlign: 'center' },
  checkCircle: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: colors.textDark, marginBottom: 8 },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dateInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: colors.textDark,
  },
  helperText: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginLeft: 4 },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
