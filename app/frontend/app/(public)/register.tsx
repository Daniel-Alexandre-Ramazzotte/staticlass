import { useRouter, Stack } from 'expo-router';
import {
  View,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import styles, { palette } from 'app/constants/style';
import { useState } from 'react';
import { Button, Text } from 'tamagui';
import RegisterNewUserService from 'app/services/RegisterNewUserService';
import { appName } from 'app/constants/names';

type ScreenState = 'form' | 'loading' | 'success';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('form');

  const handleRegister = async () => {
    setErrorMessage('');
    setScreenState('loading');
    const response = await RegisterNewUserService({ email, password, confirm_password, name });
    if (response?.status !== 201) {
      setErrorMessage(response?.data?.error ?? 'Erro ao registrar. Tente novamente.');
      setScreenState('form');
    } else {
      setScreenState('success');
    }
  };

  if (screenState === 'success') {
    return (
      <View style={[styles.mainContainer, { gap: 16, paddingHorizontal: 32 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text fontSize={56} color={palette.primaryGreen} fontWeight="bold" textAlign="center">
          ✓
        </Text>
        <Text fontSize={22} color={palette.darkBlue} fontWeight="bold" textAlign="center">
          Cadastro realizado!
        </Text>
        <Text fontSize={15} color="#555" textAlign="center">
          Enviamos um link de verificação para{'\n'}
          <Text fontSize={15} color={palette.primaryBlue} fontWeight="bold">{email}</Text>
          {'\n\n'}Confirme seu email antes de fazer login.
        </Text>
        <Button
          backgroundColor={palette.primaryBlue}
          pressStyle={{ opacity: 0.75, backgroundColor: palette.darkBlue }}
          onPress={() => router.replace('/(public)/login')}
          mt="$4"
          w="70%"
          borderRadius={14}
        >
          <Text color={palette.offWhite} fontWeight="bold" fontSize={16}>
            Ir para o login
          </Text>
        </Button>
      </View>
    );
  }

  const isLoading = screenState === 'loading';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.mainContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Cadastre-se no {appName}!</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nome"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          secureTextEntry
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          value={confirm_password}
          onChangeText={setConfirmPassword}
          placeholder="Confirmar Senha"
          secureTextEntry
          editable={!isLoading}
        />

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <Button
          onPress={handleRegister}
          disabled={isLoading}
          backgroundColor={isLoading ? palette.grey : palette.primaryBlue}
          pressStyle={{ opacity: 0.75, backgroundColor: palette.darkBlue }}
          style={styles.startButton}
          minWidth={180}
          borderRadius={14}
        >
          {isLoading ? (
            <ActivityIndicator color={palette.offWhite} size="small" />
          ) : (
            <Text style={styles.startText}>Registrar</Text>
          )}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
