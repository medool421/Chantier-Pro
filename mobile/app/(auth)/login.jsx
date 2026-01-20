import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
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

    // Axios error with response from backend
    if (err.response && err.response.data) {
      message = err.response.data.message;
    }
    // Network / server not reachable
    else if (err.request) {
      message = 'Serveur injoignable. Vérifiez votre connexion.';
    }
    // Other error
    else if (err.message) {
      message = err.message;
    }

    Alert.alert('Erreur de connexion', message);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Se connecter</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
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
        style={styles.primaryButton}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.primaryText}>
          {isLoading ? 'Connexion...' : 'Connexion'}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>
          Pas encore de compte ? S’inscrire
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.backgroundLight,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 24,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
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
