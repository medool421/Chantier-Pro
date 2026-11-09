import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HeaderHeightContext } from '@react-navigation/elements';
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
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const createMutation = useCreateProject();
  const [activeDatePicker, setActiveDatePicker] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef(null);
  const fieldLayouts = useRef({});
  const focusedFieldRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  const scrollToField = useCallback((fieldKey) => {
    const y = fieldLayouts.current[fieldKey];
    if (typeof y === 'number' && scrollViewRef.current) {
      // Offset so the label is comfortably visible
      const targetY = Math.max(0, y - 16);
      scrollViewRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, []);

  const handleFocus = useCallback((fieldKey) => {
    focusedFieldRef.current = fieldKey;
    scrollToField(fieldKey);
  }, [scrollToField]);

  const handleBlur = useCallback((fieldKey) => {
    if (focusedFieldRef.current === fieldKey) {
      focusedFieldRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onKeyboardShow = (e) => {
      const height = e.endCoordinates ? e.endCoordinates.height : 0;
      setKeyboardHeight(height);
      if (focusedFieldRef.current) {
        scrollToField(focusedFieldRef.current);
      }
    };

    const onKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onKeyboardShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onKeyboardHide
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToField]);

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

  const dynamicPaddingBottom = Platform.select({
    android: keyboardHeight > 0 ? Math.max(keyboardHeight, 160) : 48,
    ios: keyboardHeight > 0 ? 32 : 48,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: dynamicPaddingBottom },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Nouveau Chantier</Text>
        <Text style={styles.headerSubtitle}>Entrez les détails du nouveau projet.</Text>

        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.name = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Nom du chantier *</Text>
          <ThemedTextInput
            style={styles.input}
            placeholder="Ex: Rénovation Villa H"
            value={form.name}
            onChangeText={(t) => handleChange('name', t)}
            onFocus={() => handleFocus('name')}
            onBlur={() => handleBlur('name')}
            returnKeyType="next"
          />
        </View>

        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.address = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Lieu *</Text>
          <ThemedTextInput
            style={styles.input}
            placeholder="Ex: 12 Rue de la Paix, Paris"
            value={form.address}
            onChangeText={(t) => handleChange('address', t)}
            onFocus={() => handleFocus('address')}
            onBlur={() => handleBlur('address')}
            returnKeyType="next"
          />
        </View>

        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.description = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Description</Text>
          <ThemedTextInput
            style={[styles.input, styles.textArea]}
            placeholder="Détails des travaux..."
            value={form.description}
            onChangeText={(t) => handleChange('description', t)}
            onFocus={() => handleFocus('description')}
            onBlur={() => handleBlur('description')}
            multiline
            numberOfLines={4}
          />
        </View>

        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.budget = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Budget prévisionnel (DH)</Text>
          <ThemedTextInput
            style={styles.input}
            placeholder="ex: 250000"
            value={form.budget}
            onChangeText={(value) => handleChange('budget', value)}
            onFocus={() => handleFocus('budget')}
            onBlur={() => handleBlur('budget')}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.startDate = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Date de début (YYYY-MM-DD)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              Keyboard.dismiss();
              setActiveDatePicker('startDate');
            }}
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

        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.endDate = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Date de fin (facultative)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              Keyboard.dismiss();
              setActiveDatePicker('endDate');
            }}
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
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 48 },
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
