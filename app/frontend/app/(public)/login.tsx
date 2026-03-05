import { useRouter } from 'expo-router';
import {
  View,
  Image,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import styles, { palette } from 'app/constants/style';
import { useState } from 'react';
import CheckLogin from '../services/CheckLogin';
import RecoverPassword from '../services/RecoverPasswordService';
import { appName } from 'app/constants/names';
import { useAuth } from '../context/AuthContext';
import {
  XStack,
  YStack,
  ZStack,
  Button,
  Text,
  SizeTokens,
  Input,
  TextArea,
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

  const { signIn } = useAuth();

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
        setErrorMessage('Falha no login. Verifique suas credenciais.');
        return;
      }
      const token = response?.data.token;

      await signIn(token);
    } catch (error: any) {
      console.error('Erro no login:', error);
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
        style={styles.logo}
      />
      <Text style={styles.title}>{appName}</Text>
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
        <Input
          gap="$4"
          width={'100%'}
          onChangeText={setPassword}
          placeholder="Senha"
          secureTextEntry={true}
          backgroundColor={palette.darkBlue}
          color={palette.offWhite}
          placeholderTextColor={palette.grey}
        />

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
          onPress={() => router.push('/(public)/recover-password')}
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
            Registrar
          </Text>
        </Button>

        <Text style={styles.errorLoginText}>{errorMessage}</Text>
      </YStack>
    </YStack>
  );
}
