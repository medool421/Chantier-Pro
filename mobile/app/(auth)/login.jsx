import { View, Text, Pressable, StyleSheet, Alert, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/theme/colors';
import ThemedTextInput from '../../src/components/ThemedTextInput';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [invitationInput, setInvitationInput] = useState('');

  const handleLogin = async () => {
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/');
    } catch (err) {
      let message = 'Impossible de se connecter';

      if (err.response && err.response.data) {
        message = err.response.data.message;
      } else if (err.request) {
        message = 'Serveur injoignable. Vérifiez votre connexion.';
      } else if (err.message) {
        message = err.message;
      }

      Alert.alert('Erreur de connexion', message);
    }
  };

  const openInvitation = () => {
    const value = invitationInput.trim();
    const token = value.match(/(?:\/invite\/|invite\/)([^/?#]+)/i)?.[1] || value;
    if (!token || /\s/.test(token)) {
      Alert.alert('Lien invalide', 'Collez un code ou un lien d’invitation valide.');
      return;
    }
    router.push({ pathname: '/invite/[token]', params: { token } });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardContainer}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <Image source={require('../../src/assets/ChantierPro.png')} style={styles.image} />
      <Text style={styles.title}>Se connecter</Text>

      <ThemedTextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <View style={styles.passwordContainer}>
        <ThemedTextInput
          placeholder="Mot de passe"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={styles.passwordInput}
        />
        <Pressable onPress={() => setShowPassword((visible) => !visible)} accessibilityRole="button" accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} hitSlop={10}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={21} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.primaryText}>
          {isLoading ? 'Connexion...' : 'Connexion'}
        </Text>
      </Pressable>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Boss registration */}
      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push('/(auth)/register-boss')}
      >
        <Text style={styles.secondaryText}>Créer mon entreprise</Text>
      </Pressable>

      <Text style={styles.hint}>Vous avez reçu une invitation ?</Text>
      <ThemedTextInput
        placeholder="Coller le code ou le lien d’invitation"
        autoCapitalize="none"
        autoCorrect={false}
        value={invitationInput}
        onChangeText={setInvitationInput}
        style={styles.input}
      />
      <Pressable onPress={openInvitation} style={styles.invitationButton}>
        <Text style={styles.invitationLink}>J'ai un code / lien d'invitation</Text>
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
    justifyContent: 'flex-start',
    paddingBottom: 48,
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.textDark,
    marginBottom: 28,
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
  passwordContainer: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: { flex: 1, height: 52, fontSize: 16, color: colors.textDark, paddingRight: 10 },
  invitationButton: { alignItems: 'center', paddingVertical: 8 },
  invitationLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  primaryButton: {
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: colors.textMuted,
    fontSize: 13,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
