import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/theme/colors';
import { extractInvitationToken } from '../../src/api/invitations.service';
import ThemedTextInput from '../../src/components/ThemedTextInput';

export default function Login() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Invitation state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [invitationInput, setInvitationInput] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const invitationInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const invitationLayoutY = useRef(0);
  const isInviteOpenRef = useRef(isInviteOpen);

  useEffect(() => {
    isInviteOpenRef.current = isInviteOpen;
  }, [isInviteOpen]);

  const scrollToInvitation = useCallback(() => {
    if (scrollViewRef.current) {
      if (invitationLayoutY.current > 0) {
        const targetY = Math.max(0, invitationLayoutY.current - 24);
        scrollViewRef.current.scrollTo({ y: targetY, animated: true });
      } else {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }
  }, []);

  useEffect(() => {
    if (isInviteOpen) {
      const handle = requestAnimationFrame(() => {
        invitationInputRef.current?.focus();
        scrollToInvitation();
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [isInviteOpen, scrollToInvitation]);

  useEffect(() => {
    const onKeyboardShow = (e) => {
      const height = e.endCoordinates ? e.endCoordinates.height : 0;
      setKeyboardHeight(height);
      if (isInviteOpenRef.current) {
        scrollToInvitation();
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
  }, [scrollToInvitation]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Champs requis', 'Veuillez saisir votre email et votre mot de passe.');
      return;
    }

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

  const handleForgotPassword = () => {
    Alert.alert(
      'Mot de passe oublié',
      "Veuillez contacter le support ou l'administrateur de votre entreprise pour réinitialiser votre accès."
    );
  };

  const openInvitation = () => {
    Keyboard.dismiss();
    const cleanToken = extractInvitationToken(invitationInput);
    if (!cleanToken) {
      Alert.alert('Lien invalide', 'Collez un code ou un lien d’invitation valide.');
      return;
    }
    setIsInviteOpen(false);
    setInvitationInput('');
    router.push({ pathname: '/(auth)/invite-register', params: { token: cleanToken } });
  };

  const handleLeadGenPress = async () => {
    const url = 'https://chantierpro.ma';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'ChantierPro Entreprise',
          'Découvrez nos offres BTP sur https://chantierpro.ma'
        );
      }
    } catch {
      Alert.alert(
        'ChantierPro Entreprise',
        'Découvrez nos offres BTP sur https://chantierpro.ma'
      );
    }
  };

  const dynamicPaddingBottom = Platform.select({
    android: keyboardHeight > 0 ? Math.max(keyboardHeight, 160) : Math.max(insets.bottom, 24),
    ios: keyboardHeight > 0 ? 32 : Math.max(insets.bottom, 24),
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: dynamicPaddingBottom },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Logo */}
        <Image
          source={require('../../src/assets/ChantierPro.png')}
          style={styles.image}
        />
        <Text style={styles.title}>Se connecter</Text>

        {/* Inputs */}
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
          <Pressable
            onPress={() => setShowPassword((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            hitSlop={10}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={21}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        {/* Right-aligned Forgot Password Link */}
        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={handleForgotPassword}
          accessibilityRole="button"
          accessibilityLabel="Mot de passe oublié ?"
          hitSlop={8}
        >
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        {/* Primary Solid Button: Connexion */}
        <Pressable
          style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Connexion"
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

        {/* Outlined Secondary Button: Rejoindre avec une invitation */}
        {!isInviteOpen ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setIsInviteOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Rejoindre avec une invitation"
          >
            <Ionicons
              name="link-outline"
              size={18}
              color={colors.primary}
              style={styles.secondaryButtonIcon}
            />
            <Text style={styles.secondaryText}>Rejoindre avec une invitation</Text>
          </TouchableOpacity>
        ) : (
          <View
            style={styles.invitationBox}
            onLayout={(e) => {
              invitationLayoutY.current = e.nativeEvent.layout.y;
              if (isInviteOpen) {
                scrollToInvitation();
              }
            }}
          >
            <View style={styles.invitationInputRow}>
              <Ionicons
                name="link-outline"
                size={18}
                color={colors.textMuted}
                style={styles.invitationInputIcon}
              />
              <ThemedTextInput
                ref={invitationInputRef}
                placeholder="Code ou lien d’invitation"
                autoCapitalize="none"
                autoCorrect={false}
                value={invitationInput}
                onChangeText={setInvitationInput}
                style={styles.invitationInput}
                returnKeyType="go"
                onSubmitEditing={openInvitation}
              />
              <Pressable
                onPress={openInvitation}
                style={[
                  styles.invitationSubmitBtn,
                  !invitationInput.trim() && styles.invitationSubmitBtnDisabled,
                ]}
                disabled={!invitationInput.trim()}
                accessibilityRole="button"
                accessibilityLabel="Valider l'invitation"
              >
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </View>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                setIsInviteOpen(false);
                setInvitationInput('');
              }}
              style={styles.invitationCancelBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Annuler"
            >
              <Text style={styles.invitationCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Flex Spacer pushes bottom link to the absolute bottom */}
        <View style={styles.flexSpacer} />

        {/* Company creation text link at absolute bottom */}
        <TouchableOpacity
          style={styles.bottomLinkContainer}
          onPress={handleLeadGenPress}
          accessibilityRole="link"
          accessibilityLabel="Vous êtes dirigeant ? Découvrez nos offres"
          hitSlop={10}
        >
          <Text style={styles.bottomLinkText}>
            Vous êtes dirigeant ?{' '}
            <Text style={styles.bottomLinkHighlight}>Découvrez nos offres ↗</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 24,
    paddingTop: 110,
    paddingBottom: 24,
  },
  image: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.textDark,
    marginBottom: 24,
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
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: colors.textDark,
    paddingRight: 10,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginVertical: 12,
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
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  secondaryButtonIcon: {
    marginRight: 8,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  invitationBox: {
    width: '100%',
    marginTop: 4,
    marginBottom: 16,
  },
  invitationInputRow: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 6,
    marginBottom: 6,
  },
  invitationInputIcon: {
    marginRight: 8,
  },
  invitationInput: {
    flex: 1,
    height: 52,
    fontSize: 15,
    color: colors.textDark,
  },
  invitationSubmitBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationSubmitBtnDisabled: {
    opacity: 0.4,
  },
  invitationCancelBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  invitationCancelText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  flexSpacer: {
    flex: 1,
    minHeight: 28,
  },
  bottomLinkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingTop: 52,
  },
  bottomLinkText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bottomLinkHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
});
