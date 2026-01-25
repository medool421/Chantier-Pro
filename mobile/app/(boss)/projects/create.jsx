import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../src/theme/colors';
import api from '../../../src/api/axios';

export default function CreateProject() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        address: '',
        startDate: '', // Could be improved with a date picker
    });

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!form.name || !form.address) {
            Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (Nom, Lieu)');
            return;
        }

        setLoading(true);
        try {
            await api.post('/projects', form);
            Alert.alert('Succès', 'Le chantier a été créé avec succès');
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible de créer le chantier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Nouveau Chantier</Text>
                <Text style={styles.headerSubtitle}>Entrez les détails du nouveau projet.</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nom du chantier *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Rénovation Villa H"
                        value={form.name}
                        onChangeText={(t) => handleChange('name', t)}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Lieu *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 12 Rue de la Paix, Paris"
                        value={form.address}
                        onChangeText={(t) => handleChange('address', t)}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Détails des travaux..."
                        value={form.description}
                        onChangeText={(t) => handleChange('description', t)}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Date de début (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 2023-10-01"
                        value={form.startDate}
                        onChangeText={(t) => handleChange('startDate', t)}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Création...' : 'Créer le Chantier'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textDark,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: colors.textMuted,
        marginBottom: 32,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 20,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
