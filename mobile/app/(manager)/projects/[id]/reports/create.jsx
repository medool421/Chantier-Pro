import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  Keyboard, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../../../src/theme/colors';
import ThemedTextInput from '../../../../../src/components/ThemedTextInput';
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
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'DAILY',
    reportDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  const [selectedImage, setSelectedImage] = useState(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef(null);
  const fieldLayouts = useRef({});
  const focusedFieldRef = useRef(null);

  const createMutation = useCreateReport(projectId);

  const scrollToField = useCallback((fieldKey) => {
    const y = fieldLayouts.current[fieldKey];
    if (typeof y === 'number' && scrollViewRef.current) {
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
        requestAnimationFrame(() => {
          scrollToField(focusedFieldRef.current);
        });
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

  const pickImage = async (source) => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission requise',
          source === 'camera'
            ? 'Veuillez autoriser l’accès à la caméra pour continuer.'
            : 'Veuillez autoriser l’accès à vos photos pour continuer.'
        );
        return;
      }

      const picker = source === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      const result = await picker({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImage(result.assets[0]);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'accéder à la photo.");
    }
  };

  const chooseSourceAlert = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez la source de votre photo :',
      [
        { text: 'Prendre une photo', onPress: () => pickImage('camera') },
        { text: 'Choisir dans la galerie', onPress: () => pickImage('gallery') },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const removePhoto = () => {
    setSelectedImage(null);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir le titre et le contenu du rapport.');
      return;
    }

    let payload;
    if (selectedImage?.uri) {
      const rawName = selectedImage.fileName || selectedImage.uri.split('/').pop() || `report-${Date.now()}.jpg`;
      const extension = rawName.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = selectedImage.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');

      payload = new FormData();
      payload.append('type', form.type);
      payload.append('title', form.title.trim());
      payload.append('content', form.content.trim());
      payload.append('reportDate', form.reportDate);
      payload.append('image', {
        uri: selectedImage.uri,
        name: rawName,
        type: mimeType,
      });
    } else {
      payload = {
        type: form.type,
        title: form.title.trim(),
        content: form.content.trim(),
        reportDate: form.reportDate,
      };
    }

    createMutation.mutate(payload, {
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

  const dynamicPaddingBottom = Platform.select({
    android: keyboardHeight > 0 ? keyboardHeight + 60 : Math.max(insets.bottom, 16) + 32,
    ios: keyboardHeight > 0 ? 32 : Math.max(insets.bottom, 16) + 32,
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
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

        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.title = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Titre du rapport</Text>
          <ThemedTextInput
            style={styles.input}
            placeholder="Ex: Avancement gros œuvre - Secteur A"
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
            onFocus={() => handleFocus('title')}
            onBlur={() => handleBlur('title')}
          />
        </View>

        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.reportDate = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Date du rapport</Text>
          <View style={styles.datePickerContainer}>
            <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
            <ThemedTextInput
              style={styles.dateInput}
              value={form.reportDate}
              onChangeText={(t) => setForm({ ...form, reportDate: t })}
              placeholder="YYYY-MM-DD"
              onFocus={() => handleFocus('reportDate')}
              onBlur={() => handleBlur('reportDate')}
            />
          </View>
          <Text style={styles.helperText}>Format: AAAA-MM-JJ (ex: 2024-03-20)</Text>
        </View>

        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.content = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Contenu / Détails</Text>
          <ThemedTextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez les travaux effectués, les problèmes rencontrés, etc."
            multiline
            scrollEnabled
            textAlignVertical="top"
            value={form.content}
            onChangeText={(t) => setForm({ ...form, content: t })}
            onFocus={() => handleFocus('content')}
            onBlur={() => handleBlur('content')}
            onContentSizeChange={() => {
              if (focusedFieldRef.current === 'content') {
                scrollToField('content');
              }
            }}
          />
        </View>

        {/* ─── Photos / Pièces justificatives ─── */}
        <View
          style={styles.formGroup}
          onLayout={(e) => {
            fieldLayouts.current.photo = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Photos / Pièces justificatives</Text>
          {selectedImage?.uri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.photoActionsRow}>
                <TouchableOpacity style={styles.photoActionSecondary} onPress={chooseSourceAlert}>
                  <Ionicons name="camera-reverse-outline" size={18} color={colors.primary} />
                  <Text style={styles.photoActionSecondaryText}>Changer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionDestructive} onPress={removePhoto}>
                  <Ionicons name="trash-outline" size={18} color="#C62828" />
                  <Text style={styles.photoActionDestructiveText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photoPickerContainer}>
              <View style={styles.photoPickerButtons}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={() => pickImage('camera')}
                >
                  <Ionicons name="camera-outline" size={22} color={colors.primary} />
                  <Text style={styles.photoButtonText}>Prendre une photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={() => pickImage('gallery')}
                >
                  <Ionicons name="images-outline" size={22} color={colors.primary} />
                  <Text style={styles.photoButtonText}>Galerie</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>Ajoutez une photo comme justificatif pour votre rapport (optionnel).</Text>
            </View>
          )}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 24, paddingBottom: 48 },
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
    minHeight: 140,
    maxHeight: 220,
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
  photoPickerContainer: {
    marginTop: 4,
  },
  photoPickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  previewContainer: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E9ECEF',
  },
  photoActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#fff',
  },
  photoActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  photoActionSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  photoActionDestructive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  photoActionDestructiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C62828',
  },
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
