import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import axios from 'axios';
import { Button } from 'tamagui';
import { palette } from 'app/constants/style';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000');

type ScreenState = 'form' | 'loading' | 'success' | 'error';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>(token ? 'form' : 'error');
  const [errorMessage, setErrorMessage] = useState('');

  const handleReset = async () => {
    setErrorMessage('');
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Preencha todos os campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setScreenState('loading');
    try {
      await axios.post(`${BASE_URL}/auth/password-reset/confirm`, {
        token,
        new_password: newPassword,
      });
      setScreenState('success');
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Link inválido ou expirado.';
      setErrorMessage(msg);
      setScreenState('form');
    }
  };

  if (screenState === 'success') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.heading}>Senha redefinida!</Text>
        <Text style={styles.subtext}>
          Sua senha foi alterada com sucesso. Faça login com a nova senha.
        </Text>
        <Button
          backgroundColor={palette.primaryGreen}
          pressStyle={{ opacity: 0.75 }}
          onPress={() => router.replace('/(public)/login')}
          w="70%"
          borderRadius={14}
          mt="$4"
        >
          <Text style={styles.buttonText}>Fazer login</Text>
        </Button>
      </View>
    );
  }

  if (screenState === 'error' && !token) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.iconError}>✕</Text>
        <Text style={styles.heading}>Link inválido</Text>
        <Text style={styles.subtext}>
          Este link de redefinição é inválido ou expirou. Solicite um novo link.
        </Text>
        <Button
          backgroundColor={palette.primaryBlue}
          pressStyle={{ opacity: 0.75 }}
          onPress={() => router.replace('/(public)/RecoverPassword')}
          w="70%"
          borderRadius={14}
          mt="$4"
        >
          <Text style={styles.buttonText}>Solicitar novo link</Text>
        </Button>
      </View>
    );
  }

  const isLoading = screenState === 'loading';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.heading}>Nova senha</Text>
      <Text style={styles.subtext}>Digite e confirme sua nova senha abaixo.</Text>

      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Nova senha"
        placeholderTextColor={palette.grey}
        secureTextEntry
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirmar nova senha"
        placeholderTextColor={palette.grey}
        secureTextEntry
        editable={!isLoading}
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <Button
        onPress={handleReset}
        disabled={isLoading}
        backgroundColor={isLoading ? palette.grey : palette.primaryBlue}
        pressStyle={{ opacity: 0.75, backgroundColor: palette.darkBlue }}
        w="70%"
        borderRadius={14}
        mt="$3"
      >
        {isLoading ? (
          <ActivityIndicator color={palette.offWhite} size="small" />
        ) : (
          <Text style={styles.buttonText}>Redefinir senha</Text>
        )}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 12,
  },
  icon: {
    fontSize: 56,
    color: palette.primaryGreen,
    fontWeight: 'bold',
  },
  iconError: {
    fontSize: 56,
    color: palette.red,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: palette.darkBlue,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: palette.offBlack,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  errorText: {
    fontSize: 14,
    color: palette.red,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonText: {
    color: palette.offWhite,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
