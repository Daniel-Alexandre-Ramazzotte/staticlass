import { Text, View, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { Button } from 'tamagui';
import RecoverPasswordService from 'app/services/RecoverPasswordService';
import { palette } from 'app/constants/style';

type ScreenState = 'form' | 'loading' | 'sent';

export default function RecoverPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('form');

  const handleRecoverPassword = async () => {
    if (!email.trim()) return;
    setScreenState('loading');
    try {
      await RecoverPasswordService({ email: email.trim() });
    } catch {
      // Always show sent — do not reveal if email exists
    }
    setScreenState('sent');
  };

  if (screenState === 'sent') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.icon}>✉</Text>
        <Text style={styles.heading}>Link enviado!</Text>
        <Text style={styles.subtext}>
          Se o email estiver cadastrado, você receberá um link para redefinir sua senha.
          Verifique também a caixa de spam.
        </Text>
        <Button
          backgroundColor={palette.primaryBlue}
          pressStyle={{ opacity: 0.75, backgroundColor: palette.darkBlue }}
          onPress={() => router.replace('/(public)/login')}
          w="70%"
          borderRadius={14}
          mt="$4"
        >
          <Text style={styles.buttonText}>Voltar ao login</Text>
        </Button>
      </View>
    );
  }

  const isLoading = screenState === 'loading';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.heading}>Recuperar senha</Text>
      <Text style={styles.subtext}>
        Digite seu email de cadastro e enviaremos um link para criar uma nova senha.
      </Text>
      <TextInput
        placeholder="Seu email de cadastro"
        placeholderTextColor={palette.grey}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />
      <Button
        onPress={handleRecoverPassword}
        disabled={isLoading || !email.trim()}
        backgroundColor={isLoading || !email.trim() ? palette.grey : palette.primaryBlue}
        pressStyle={{ opacity: 0.75, backgroundColor: palette.darkBlue }}
        w="70%"
        borderRadius={14}
        mt="$3"
      >
        {isLoading ? (
          <ActivityIndicator color={palette.offWhite} size="small" />
        ) : (
          <Text style={styles.buttonText}>Enviar link de recuperação</Text>
        )}
      </Button>
      <Button
        backgroundColor="transparent"
        pressStyle={{ opacity: 0.6 }}
        onPress={() => router.back()}
        mt="$2"
      >
        <Text style={[styles.buttonText, { color: palette.primaryBlue }]}>Voltar</Text>
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
    color: palette.primaryBlue,
    marginBottom: 4,
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
  buttonText: {
    color: palette.offWhite,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
