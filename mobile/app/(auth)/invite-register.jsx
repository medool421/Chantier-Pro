import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { invitationsService } from '../../src/api/invitations.service';
import { colors } from '../../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';

const ROLE_LABELS = {
  MANAGER: 'Chef de chantier',
  WORKER: 'Ouvrier',
};

export default function InviteRegister() {
  const { token } = useLocalSearchParams();

  const registerInvited = useAuthStore((s) => s.registerInvited);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [isValidating, setIsValidating] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [tokenError, setTokenError] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError("Lien d'invitation invalide ou manquant.");
      setIsValidating(false);
      return;
    }

    (async () => {
      try {
        const res = await invitationsService.validate(token);
        setInviteData(res.data);
        setEmail(res.data.email);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          "Ce lien d'invitation est invalide ou a expiré.";
        setTokenError(msg);
      } finally {
        setIsValidating(false);
      }
    })();
  }, [token]);

  const handleRegister = async () => {
    if (!firstName || !lastName || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs correctement.');
      return;
    }

    try {
      // Do NOT send email — backend derives it from the invitation token
      await registerInvited({
        firstName,
        lastName,
        password,
        inviteToken: token,
        ...(process.env.NODE_ENV === 'development' && { email }),
      });

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

  // Loading state
  if (isValidating) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Validation de votre invitation…</Text>
      </View>
    );
  }

  // Error state
  if (tokenError) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.primary} />
        <Text style={styles.errorTitle}>Invitation invalide</Text>
        <Text style={styles.errorText}>{tokenError}</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.primaryText}>Se connecter</Text>
        </Pressable>
      </View>
    );
  }

  // Main UI
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Banner */}
      <View style={styles.inviteBanner}>
        <Ionicons name="mail-open-outline" size={28} color={colors.primary} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.bannerTitle}>Invitation reçue</Text>
          <Text style={styles.bannerCompany}>
            {inviteData.company?.name || 'ChantierPro'}
          </Text>
          <Text style={styles.bannerRole}>
            {ROLE_LABELS[inviteData.role] || inviteData.role}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>Créer votre compte</Text>
      <Text style={styles.subtitle}>
        Finalisez votre inscription pour rejoindre l'équipe
      </Text>

      {process.env.NODE_ENV === 'development' ? (
  <TextInput
    placeholder="Email"
    value={email}
    onChangeText={setEmail}
    style={styles.input}
  />
) : (
  <View style={styles.lockedInput}>
    <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
    <Text style={styles.lockedText}>{inviteData.email}</Text>
    <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
  </View>
)}

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
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Pressable
        style={[
          styles.primaryButton,
          (isLoading || !inviteData) && styles.primaryButtonDisabled,
        ]}
        onPress={handleRegister}
        disabled={isLoading || !inviteData}
      >
        <Text style={styles.primaryText}>
          {isLoading ? 'Création en cours...' : "Rejoindre l'équipe"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.link}>J'ai déjà un compte</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 15,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.backgroundLight,
    padding: 24,
    justifyContent: 'center',
  },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  bannerCompany: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  bannerRole: {
    fontSize: 13,
    color: colors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.textDark,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 24,
  },
  lockedInput: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    flex: 1,
    color: colors.textMuted,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  primaryButton: {
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
    marginTop: 16,
  },
});