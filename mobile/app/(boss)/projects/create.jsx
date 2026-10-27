import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../../src/theme/colors';
import ThemedTextInput from '../../../src/components/ThemedTextInput';
import { useCreateProject } from '../../../src/hooks/useProjects';

function parseDateValue(value) {
  if (!value) return new Date();

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CreateProject() {
  const router = useRouter();
  const createMutation = useCreateProject();
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.name || !form.address || !form.startDate) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (Nom, Lieu, Date de début)');
      return;
    }
    const payload = {
      ...form,
      budget: form.budget === '' ? null : Number(form.budget),
      endDate: form.endDate || null,
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Succès', 'Le chantier a été créé avec succès');
        router.back();
      },
      onError: () => {
        Alert.alert('Erreur', 'Impossible de créer le chantier');
      },
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text style={styles.headerTitle}>Nouveau Chantier</Text>
        <Text style={styles.headerSubtitle}>Entrez les détails du nouveau projet.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom du chantier *</Text>
          <ThemedTextInput style={styles.input} placeholder="Ex: Rénovation Villa H" value={form.name} onChangeText={(t) => handleChange('name', t)} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Lieu *</Text>
          <ThemedTextInput style={styles.input} placeholder="Ex: 12 Rue de la Paix, Paris" value={form.address} onChangeText={(t) => handleChange('address', t)} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <ThemedTextInput style={[styles.input, styles.textArea]} placeholder="Détails des travaux..." value={form.description} onChangeText={(t) => handleChange('description', t)} multiline numberOfLines={4} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Budget prévisionnel (DH)</Text>
          <ThemedTextInput
            style={styles.input}
            placeholder="ex: 250000"
            value={form.budget}
            onChangeText={(value) => handleChange('budget', value)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date de début (YYYY-MM-DD)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setActiveDatePicker('startDate')}
            accessibilityRole="button"
            accessibilityLabel="Choisir la date de début"
          >
            <Text style={form.startDate ? styles.dateValue : styles.datePlaceholder}>
              {form.startDate || 'Choisir une date'}
            </Text>
          </TouchableOpacity>
          {activeDatePicker === 'startDate' && (
            <DateTimePicker
              value={parseDateValue(form.startDate)}
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'default'}
              onChange={(event, selectedDate) => {
                setActiveDatePicker(null);
                if (event.type === 'set' && selectedDate) {
                  const startDate = formatDateValue(selectedDate);
                  setForm((previous) => ({
                    ...previous,
                    startDate,
                    endDate: previous.endDate && previous.endDate < startDate ? '' : previous.endDate,
                  }));
                }
              }}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date de fin (facultative)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setActiveDatePicker('endDate')}
            accessibilityRole="button"
            accessibilityLabel="Choisir la date de fin"
          >
            <Text style={form.endDate ? styles.dateValue : styles.datePlaceholder}>
              {form.endDate || 'Choisir une date'}
            </Text>
          </TouchableOpacity>
          {form.endDate ? (
            <TouchableOpacity onPress={() => handleChange('endDate', '')} style={styles.clearDateButton}>
              <Text style={styles.datePlaceholder}>Effacer la date de fin</Text>
            </TouchableOpacity>
          ) : null}
          {activeDatePicker === 'endDate' && (
            <DateTimePicker
              value={parseDateValue(form.endDate || form.startDate)}
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'default'}
              minimumDate={form.startDate ? parseDateValue(form.startDate) : undefined}
              onChange={(event, selectedDate) => {
                setActiveDatePicker(null);
                if (event.type === 'set' && selectedDate) {
                  handleChange('endDate', formatDateValue(selectedDate));
                }
              }}
            />
          )}
        </View>
        <TouchableOpacity
          style={[styles.submitButton, createMutation.isPending && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          <Text style={styles.submitButtonText}>
            {createMutation.isPending ? 'Création...' : 'Créer le Chantier'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 24, paddingBottom: 48 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: colors.textMuted, marginBottom: 32 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textDark, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#FAFAFA' },
  dateValue: { color: colors.textDark, fontSize: 16 },
  datePlaceholder: { color: colors.textMuted, fontSize: 16 },
  clearDateButton: { alignSelf: 'flex-start', paddingTop: 8 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 20 },
  disabledButton: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
