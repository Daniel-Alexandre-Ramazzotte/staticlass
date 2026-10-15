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
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);

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
    setNeedsVerification(false);

    try {
      const response = await CheckLogin({ email, password });
      if (!response) {
        setErrorMessage('Sem resposta do servidor. Verifique sua conexão.');
        return;
      }
      if (response.status !== 200) {
        setErrorMessage(response.data?.error || 'Email ou senha incorretos.');
        setNeedsVerification(response.data?.email_verified === false);
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
    <YStack f={1} position="relative" backgroundColor={palette.offWhite}>

      {/* Fundo: logo Staticlass centralizada, baixa opacidade */}
      <YStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        ai="center"
        jc="center"
        pointerEvents="none"
      >
        <Image
          source={require('../../assets/images/logo.png')}
          width={340}
          height={340}
          objectFit="contain"
          opacity={0.07}
        />
      </YStack>

      {/* Logo Staticlass — canto superior direito */}
      <XStack position="absolute" top={48} right={16} zIndex={10}>
        <Image
          source={require('../../assets/images/logo.png')}
          width={52}
          height={52}
          objectFit="contain"
        />
      </XStack>

      {/* Conteúdo principal centralizado */}
      <YStack f={1} jc="center" ai="center" gap="$4" zIndex={1}>
        <YStack
          jc="center"
          padding="$5"
          gap="$4"
          width={'85%'}
          maxWidth={380}
          backgroundColor={palette.white}
          borderRadius={20}
          shadowColor="#000"
          shadowOpacity={0.08}
          shadowRadius={16}
          shadowOffset={{ width: 0, height: 6 }}
          elevation={4}
        >
          <Text fontSize={16} color={palette.offBlack} fontWeight="600">
            Email:
          </Text>
          <Input
            gap="$4"
            width={'100%'}
            borderRadius={12}
            onChangeText={setEmail}
            placeholder="Email"
            backgroundColor={palette.darkBlue}
            color={palette.offWhite}
            placeholderTextColor={palette.grey}
          />

          <Text fontSize={16} color={palette.offBlack} fontWeight="600">
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
              borderTopLeftRadius={12}
              borderBottomLeftRadius={12}
              borderTopRightRadius={0}
              borderBottomRightRadius={0}
            />
            <Button
              onPress={() => setShowPassword(v => !v)}
              backgroundColor={palette.darkBlue}
              borderTopLeftRadius={0}
              borderBottomLeftRadius={0}
              borderTopRightRadius={12}
              borderBottomRightRadius={12}
              px="$3"
              height={44}
            >
              <Text color={palette.grey} fontSize={13}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </Text>
            </Button>
          </XStack>

          <Button
            onPress={handleLogin}
            backgroundColor={palette.primaryBlue}
            color={palette.offWhite}
            borderRadius={14}
            w={'60%'}
            mt="$2"
            alignSelf="center"
            pressStyle={{ opacity: 0.85, backgroundColor: palette.darkBlue }}
          >
            <Text color={palette.offWhite} fontWeight={'bold'} fontSize={18}>
              Entrar
            </Text>
          </Button>

          <Button
            onPress={() => router.push('/(public)/RecoverPassword')}
            backgroundColor="transparent"
            color={palette.primaryBlue}
            w={'100%'}
            alignSelf="center"
          >
            <Text color={palette.primaryBlue} fontWeight={'bold'} fontSize={16}>
              Esqueci minha senha
            </Text>
          </Button>

          <Button
            onPress={() => router.push('/(public)/register')}
            backgroundColor="transparent"
            color={palette.primaryBlue}
            w={'100%'}
            alignSelf="center"
          >
            <Text color={palette.primaryBlue} fontWeight={'bold'} fontSize={16}>
              CADASTRE-SE
            </Text>
          </Button>

          <Text style={styles.errorLoginText}>{errorMessage}</Text>

          {needsVerification ? (
            <Button
              onPress={() => router.push('/(public)/verify-email')}
              backgroundColor="transparent"
              color={palette.primaryGreen}
              w={'100%'}
              alignSelf="center"
            >
              <Text color={palette.primaryGreen} fontWeight={'bold'} fontSize={15}>
                Reenviar email de verificação
              </Text>
            </Button>
          ) : null}
        </YStack>
      </YStack>

      {/* Rodapé institucional: UEM + Ação 11 */}
      <XStack
        jc="center"
        ai="center"
        gap="$6"
        pb="$5"
        pt="$2"
        zIndex={1}
        borderTopWidth={1}
        borderTopColor={palette.grey + '33'}
      >
        <Image
          source={require('../../assets/images/uem-logo.png')}
          width={90}
          height={45}
          objectFit="contain"
          opacity={0.75}
        />
        <Image
          source={require('../../assets/images/Logo_-_DataSci_PRPET_(Preto).webp')}
          width={80}
          height={45}
          objectFit="contain"
          opacity={0.75}
        />
      </XStack>

    </YStack>
  );
}
