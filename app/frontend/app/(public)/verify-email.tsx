import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import axios from 'axios';
import { AppButton } from 'app/components/AppButton';
import { palette } from 'app/constants/style';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000');

type VerifyState = 'loading' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [state, setState] = useState<VerifyState>('loading');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    axios
      .post(`${BASE_URL}/auth/verify-email-token`, { token })
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    try {
      await axios.post(`${BASE_URL}/auth/resend-verification`, {
        email: resendEmail.trim(),
      });
    } catch {
      // Always show success to avoid email enumeration
    } finally {
      setResendLoading(false);
      setResendSent(true);
    }
  };

  if (state === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={palette.offWhite} />
        <Text style={styles.loadingText}>Verificando email...</Text>
      </View>
    );
  }

  if (state === 'success') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.heading}>Email verificado!</Text>
        <Text style={styles.subtext}>
          Sua conta está ativa. Faça login para continuar.
        </Text>
        <AppButton
          backgroundColor={palette.primaryGreen}
          onPress={() => router.replace('/(public)/login')}
          width="70%"
        >
          <Text style={styles.buttonText}>Fazer login</Text>
        </AppButton>
      </View>
    );
  }

  // Error state
  return (
    <View style={styles.container}>
      <Text style={styles.iconError}>✕</Text>
      <Text style={styles.heading}>Link inválido ou expirado</Text>
      <Text style={styles.subtext}>
        O link de verificação expirou ou já foi usado.
      </Text>

      {resendSent ? (
        <Text style={styles.successText}>
          Email reenviado! Verifique sua caixa de entrada.
        </Text>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={resendEmail}
            onChangeText={setResendEmail}
            placeholder="Seu email de cadastro"
            placeholderTextColor={palette.grey}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <AppButton
            backgroundColor={palette.darkBlue}
            onPress={handleResend}
            disabled={resendLoading || !resendEmail.trim()}
            width="70%"
          >
            <Text style={styles.buttonText}>
              {resendLoading ? 'Enviando...' : 'Reenviar email'}
            </Text>
          </AppButton>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  icon: {
    fontSize: 64,
    color: palette.primaryGreen,
    fontWeight: 'bold',
  },
  iconError: {
    fontSize: 64,
    color: palette.red,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: palette.white,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: palette.offWhite,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: palette.offWhite,
  },
  successText: {
    fontSize: 16,
    color: palette.primaryGreen,
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    width: '80%',
    height: 48,
    backgroundColor: palette.darkBlue,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: palette.offWhite,
    borderWidth: 1,
    borderColor: palette.grey,
  },
  buttonText: {
    color: palette.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
