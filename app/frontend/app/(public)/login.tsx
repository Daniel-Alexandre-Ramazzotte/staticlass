import { useRouter } from 'expo-router';
import styles, { palette } from 'app/constants/style';
import { useState } from 'react';
import CheckLogin from 'app/services/CheckLogin';
import { useAuth } from 'app/context/AuthContext';
import {
  XStack,
  YStack,
  Button,
  Text,
  Input,
  Image,
} from 'tamagui';

/*

    Tela de Login/Registro

    A tela de login deve permitir que os usuários façam login ou se registrem.
    
    Deve incluir:
        - Campos para email e senha
        - Botão de login
        - Link para a tela de registro (Login ou em um site externo ou outra tela)

    Notas:
        - Verificar no emulador se a primeira tela que aparece é a de login.
        - Após o login, o usuário deve ser redirecionado para a tela principal (conjunto de abas).
*/

export default function LoginScreen() {
  const router = useRouter(); // Constante do roteador para navegação
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { signIn } = useAuth();

  function extractToken(payload: unknown): string | null {
    if (typeof payload === 'string') {
      const trimmed = payload.trim();

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return extractToken(JSON.parse(trimmed));
        } catch {
          return null;
        }
      }

      if (trimmed.split('.').length === 3) {
        return trimmed;
      }

      return null;
    }

    if (payload && typeof payload === 'object') {
      const data = payload as Record<string, unknown>;
      const candidate = data.access_token ?? data.token ?? data.accessToken;
      return typeof candidate === 'string' && candidate ? candidate : null;
    }

    return null;
  }

  const handleLogin = async () => {
    // Realiza a lógica de autenticação
    // Após o login bem-sucedido, navega para a tela principal (conjunto de abas)
    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
    } else {
      setErrorMessage('');
    }

    try {
      const response = await CheckLogin({ email, password });
      if (!response) {
        setErrorMessage('Sem resposta do servidor. Verifique sua conexão.');
        return;
      }
      if (response.status !== 200) {
        setErrorMessage(response.data?.error || 'Email ou senha incorretos.');
        return;
      }
      const token = extractToken(response.data);
      if (!token) {
        setErrorMessage('Resposta de login inválida. Token não recebido.');
        return;
      }
      await signIn(token);
    } catch {
      setErrorMessage('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <YStack
      f={1}
      jc="center"
      ai="center"
      gap="$4"
      backgroundColor={palette.offWhite}
    >
      <Image
        source={require('../../assets/images/logo.png')}
        width={220}
        height={220}
        objectFit="contain"
      />

      {/* Campo de email*/}

      <YStack
        jc="center"
        padding="$4"
        gap="$4"
        width={'80%'}
        backgroundColor={palette.offWhite}
      >
        <Text fontSize={16} color={palette.offBlack}>
          Email:
        </Text>
        <Input
          gap="$4"
          width={'100%'}
          onChangeText={setEmail}
          placeholder="Email"
          backgroundColor={palette.darkBlue}
          color={palette.offWhite}
          placeholderTextColor={palette.grey}
        />

        {/* Campo de senha */}
        <Text fontSize={16} color={palette.offBlack}>
          Senha:
        </Text>
        <XStack width={'100%'} ai="center">
          <Input
            f={1}
            onChangeText={setPassword}
            placeholder="Senha"
            secureTextEntry={!showPassword}
            backgroundColor={palette.darkBlue}
            color={palette.offWhite}
            placeholderTextColor={palette.grey}
            borderTopRightRadius={0}
            borderBottomRightRadius={0}
          />
          <Button
            onPress={() => setShowPassword(v => !v)}
            backgroundColor={palette.darkBlue}
            borderTopLeftRadius={0}
            borderBottomLeftRadius={0}
            px="$3"
            height={44}
          >
            <Text color={palette.grey} fontSize={13}>
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Button>
        </XStack>

        {/* Botão de login */}
        <Button
          onPress={handleLogin}
          backgroundColor={palette.primaryBlue}
          color={palette.offWhite}
          w={'50%'}
          alignSelf="center"
        >
          <Text color={palette.offWhite} fontWeight={'bold'} fontSize={20}>
            Entrar
          </Text>
        </Button>

        {/* Botao de recuperacao de senha */}
        <Button
          onPress={() => router.push('/(public)/RecoverPassword')}
          backgroundColor={palette.offWhite}
          color={palette.primaryBlue}
          w={'100%'}
          alignSelf="center"
        >
          <Text color={palette.primaryBlue} fontWeight={'bold'} fontSize={16}>
            Esqueci minha senha
          </Text>
        </Button>
        {/* Botao de registro */}
        <Button
          onPress={() => router.push('/(public)/register')}
          backgroundColor={palette.offWhite}
          color={palette.primaryBlue}
          w={'100%'}
          alignSelf="center"
        >
          <Text color={palette.primaryBlue} fontWeight={'bold'} fontSize={16}>
            CADASTRE-SE
          </Text>
        </Button>

        <Text style={styles.errorLoginText}>{errorMessage}</Text>
      </YStack>
    </YStack>
  );
}
