import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/theme/colors';
import ThemedTextInput from '../../src/components/ThemedTextInput';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterBoss() {
  const registerBoss = useAuthStore((s) => s.registerBoss);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !companyName.trim()) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.');
      return;
    }

    try {
      await registerBoss({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim(), companyName: companyName.trim() });
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardContainer}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <Image source={require('../../src/assets/ChantierPro.png')} style={styles.image} />
      <Text style={styles.title}>Créer votre entreprise</Text>
      <Text style={styles.subtitle}>Accès Administrateur · Boss</Text>

      <Text style={styles.sectionLabel}>INFORMATIONS PERSONNELLES</Text>

      <Text style={styles.fieldLabel}>Prénom <Text style={styles.required}>*</Text></Text>
      <ThemedTextInput
        placeholder="Prénom"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />
      <Text style={styles.fieldLabel}>Nom <Text style={styles.required}>*</Text></Text>
      <ThemedTextInput
        placeholder="Nom"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />
      <Text style={styles.fieldLabel}>Email professionnel <Text style={styles.required}>*</Text></Text>
      <ThemedTextInput
        placeholder="Email professionnel"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <Text style={styles.fieldLabel}>Mot de passe <Text style={styles.required}>*</Text></Text>
      <View style={styles.passwordContainer}>
        <ThemedTextInput placeholder="Mot de passe" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={styles.passwordInput} />
        <Pressable onPress={() => setShowPassword((visible) => !visible)} accessibilityRole="button" accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} hitSlop={10}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={21} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>VOTRE ENTREPRISE</Text>

      <Text style={styles.fieldLabel}>Nom de l'entreprise <Text style={styles.required}>*</Text></Text>
      <ThemedTextInput
        placeholder="Nom de l'entreprise"
        value={companyName}
        onChangeText={setCompanyName}
        style={styles.input}
      />
      <Text style={styles.fieldLabel}>Téléphone</Text>
      <ThemedTextInput placeholder="Téléphone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={styles.input} />

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: colors.backgroundLight },
  container: {
    flexGrow: 1,
    backgroundColor: colors.backgroundLight,
    padding: 24,
    justifyContent: 'center',
    paddingBottom: 48,
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
  fieldLabel: { color: colors.textDark, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  required: { color: '#dc2626' },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    color: colors.textDark,
  },
  passwordContainer: { height: 52, borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, height: 52, fontSize: 16, color: colors.textDark, paddingRight: 10 },
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
