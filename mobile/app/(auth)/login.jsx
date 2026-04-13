import { View, Text, TextInput, Pressable, StyleSheet, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/theme/colors';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
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

  return (
    <View style={styles.container}>
      <Image source={require('../../src/assets/ChantierPro.png')} style={styles.image} />
      <Text style={styles.title}>Se connecter</Text>

      <TextInput
        placeholder="Email"
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

      <Text style={styles.hint}>
        Vous avez reçu une invitation ? Ouvrez le lien dans votre email.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.backgroundLight,
    padding: 24,
    justifyContent: 'flex-start',
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