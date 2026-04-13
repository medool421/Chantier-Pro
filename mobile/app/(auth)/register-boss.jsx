import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/theme/colors';

export default function RegisterBoss() {
  const registerBoss = useAuthStore((s) => s.registerBoss);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !companyName) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.');
      return;
    }

    try {
      await registerBoss({ firstName, lastName, email, password, companyName });
      router.replace('/');
    } catch (err) {
      let message = 'Impossible de créer le compte';
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.request) {
        message = 'Serveur injoignable. Vérifiez votre connexion.';
      }
      Alert.alert("Erreur d'inscription", message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Image source={require('../../src/assets/ChantierPro.png')} style={styles.image} />
      <Text style={styles.title}>Créer votre entreprise</Text>
      <Text style={styles.subtitle}>Accès Administrateur · Boss</Text>

      <Text style={styles.sectionLabel}>INFORMATIONS PERSONNELLES</Text>

      <TextInput
        placeholder="Prénom"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />
      <TextInput
        placeholder="Nom"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email professionnel"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Text style={styles.sectionLabel}>VOTRE ENTREPRISE</Text>

      <TextInput
        placeholder="Nom de l'entreprise"
        value={companyName}
        onChangeText={setCompanyName}
        style={styles.input}
      />

      <Pressable
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.primaryText}>
          {isLoading ? 'Création en cours...' : 'Créer mon espace'}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.link}>J'ai déjà un compte</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.backgroundLight,
    padding: 24,
    justifyContent: 'center',
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 28,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    color: colors.textDark,
  },
  primaryButton: {
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  link: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
