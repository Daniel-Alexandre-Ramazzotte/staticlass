import { useRouter, Stack } from 'expo-router';
import {
  View,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import styles, { palette } from 'app/constants/style';
import { useState } from 'react';
import { Button, Text } from 'tamagui';
import RegisterNewUserService from 'app/services/RegisterNewUserService';
import api from 'app/services/api';
import { appName } from 'app/constants/names';
import { useAuth } from 'app/context/AuthContext';

type ScreenState = 'form' | 'loading' | 'verify' | 'success';

export default function RegisterScreen() {
  const router = useRouter();
  const { markEmailVerified } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isUem, setIsUem] = useState(false);
  const [ra, setRa] = useState('');
  const [anoIngresso, setAnoIngresso] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('form');

  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleRegister = async () => {
    setErrorMessage('');
    setScreenState('loading');
    const response = await RegisterNewUserService({
      email,
      password,
      confirm_password,
      name,
      ra: isUem ? ra : undefined,
      is_uem: isUem,
      ano_ingresso: anoIngresso.trim() ? Number(anoIngresso.trim()) : undefined,
    });
    if (response?.status !== 201) {
      setErrorMessage(response?.data?.error ?? 'Erro ao registrar. Tente novamente.');
      setScreenState('form');
    } else {
      setScreenState('verify');
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpLoading(true);
    try {
      await api.post('/auth/verify-code', { email, code: otpCode });
      await markEmailVerified();
      setScreenState('success');
    } catch (err: any) {
      setOtpError(err.response?.data?.error ?? 'Código inválido. Tente novamente.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/auth/resend-verification', { email });
    } catch {
      // silent
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
          Conta verificada!
        </Text>
        <Text fontSize={15} color="#555" textAlign="center">
          Seu email foi confirmado com sucesso.
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

  if (screenState === 'verify') {
    return (
      <View style={[styles.mainContainer, { gap: 16, paddingHorizontal: 32 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text fontSize={22} color={palette.darkBlue} fontWeight="bold" textAlign="center">
          Verifique seu email
        </Text>
        <Text fontSize={15} color="#555" textAlign="center">
          Enviamos um código de 6 dígitos para{'\n'}
          <Text fontSize={15} color={palette.primaryBlue} fontWeight="bold">{email}</Text>
        </Text>
        <TextInput
          style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
          value={otpCode}
          onChangeText={setOtpCode}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
        />
        {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
        <Button
          onPress={handleVerifyOtp}
          disabled={otpLoading || otpCode.length < 6}
          backgroundColor={otpLoading || otpCode.length < 6 ? palette.grey : palette.primaryGreen}
          pressStyle={{ opacity: 0.75 }}
          style={styles.startButton}
          minWidth={180}
          borderRadius={14}
        >
          {otpLoading ? (
            <ActivityIndicator color={palette.offWhite} size="small" />
          ) : (
            <Text style={styles.startText}>Verificar</Text>
          )}
        </Button>
        <TouchableOpacity onPress={handleResendOtp} style={{ marginTop: 8 }}>
          <Text color={palette.primaryBlue} fontSize={14} textAlign="center">
            Reenviar código
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(public)/login')} style={{ marginTop: 4 }}>
          <Text color="#888" fontSize={13} textAlign="center">
            Verificar mais tarde
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLoading = screenState === 'loading';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.mainContainer}>
          <Stack.Screen options={{ headerShown: false }} />
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Cadastre-se no {appName}!</Text>

          <View
            style={{
              width: '85%',
              maxWidth: 380,
              backgroundColor: palette.white,
              borderRadius: 20,
              padding: 20,
              marginTop: 12,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            }}
          >
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
            <TextInput
              style={styles.input}
              value={anoIngresso}
              onChangeText={(t) => setAnoIngresso(t.replace(/[^0-9]/g, ''))}
              placeholder="Ano de ingresso (opcional)"
              keyboardType="number-pad"
              maxLength={4}
              editable={!isLoading}
            />

            <TouchableOpacity
              onPress={() => setIsUem(!isUem)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 4 }}
            >
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: palette.primaryBlue,
                backgroundColor: isUem ? palette.primaryBlue : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {isUem && <Text color={palette.offWhite} fontSize={14} fontWeight="bold">✓</Text>}
              </View>
              <Text color={palette.darkBlue} fontSize={15}>Sou aluno da UEM</Text>
            </TouchableOpacity>

            {isUem && (
              <TextInput
                style={styles.input}
                value={ra}
                onChangeText={setRa}
                placeholder="Número do RA (ex: RA135899)"
                autoCapitalize="characters"
                editable={!isLoading}
              />
            )}

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <Button
              onPress={handleRegister}
              disabled={isLoading}
              backgroundColor={isLoading ? palette.grey : palette.primaryBlue}
              pressStyle={{ opacity: 0.75, backgroundColor: palette.darkBlue }}
              style={styles.startButton}
              alignSelf="center"
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
