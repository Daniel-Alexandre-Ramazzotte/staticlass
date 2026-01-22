import { useRouter } from 'expo-router';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import styles from 'app/constants/style';
import { useState } from 'react';
import CheckLogin from '../services/CheckLogin';
import RecoverPassword from '../services/RecoverPasswordService';
import { appName } from 'app/constants/names';
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
  const handleLogin = async () => {
    // Realiza a lógica de autenticação aqui
    // Após o login bem-sucedido, navega para a tela principal (conjunto de abas)

    if ((await CheckLogin({ email, password })) === true) {
      console.log('Login bem-sucedido');

      router.replace('/(tabs)/home');
    } else {
      console.log('Falha no login');
      setErrorMessage('Email ou senha incorretos. Por favor, tente novamente.');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>{appName}</Text>
      {/* Campo de email*/}

      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        // style={styles.input}
        placeholder="Email"
      />

      {/* Campo de senha */}

      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        // style={styles.input}
        placeholder="Senha"
        secureTextEntry={true}
      />

      {/* Botao de login */}
      <Pressable style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.startText}>Entrar</Text>
      </Pressable>

      <Text style={styles.errorLoginText}>{errorMessage}</Text>
      {/* Botao de recuperacao de senha */}
      <Pressable onPress={() => router.push('/(public)/recover-password')}>
        <Text>Esqueci minha senha</Text>
      </Pressable>
      {/* Botao de registro */}
      <Pressable onPress={() => router.push('/(public)/register')}>
        <Text>Registrar</Text>
      </Pressable>
    </View>
  );
}
