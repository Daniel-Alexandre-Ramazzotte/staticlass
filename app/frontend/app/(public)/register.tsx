import { useRouter, Stack } from 'expo-router';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import styles from 'app/constants/style';
import { useState } from 'react';

import RegisterNewUserService from 'app/services/RegisterNewUserService';
import { appName } from 'app/constants/names';
/*

Tela de registro 

Verificar 



*/

export default function RegisterScreen() {
  const router = useRouter(); // Constante do roteador para navegação
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm_password, setConfirmPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [name, setName] = useState<string>('');

  const handleRegister = async () => {
    // Realiza a lógica de registro aqui
    // Após o registro bem-sucedido, navega para a tela principal (conjunto de abas)
    const response = await RegisterNewUserService({
      email,
      password,
      confirm_password,
      name,
    });
    if (response?.status !== 201) {
      setErrorMessage(
        response?.data?.error ?? 'Erro ao registrar. Tente novamente.'
      );
    } else {
      showAlert();
    }
  };
  const showAlert = () => {
    Alert.alert(
      'Email cadastrado com sucesso! Faça login para continuar.',
      '',
      [{ text: 'OK', onPress: () => router.push('/(public)/login') }]
    );
  };
  return (
    <View style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      ></Image>
      <Text style={styles.title}>Cadastre-se no {appName}!</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nome"
      />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Senha"
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        value={confirm_password}
        onChangeText={setConfirmPassword}
        placeholder="Confirmar Senha"
        secureTextEntry
      />

      <Text style={styles.errorText}>{errorMessage}</Text>

      <Pressable onPress={handleRegister} style={styles.startButton}>
        <Text style={styles.startText}>Registrar</Text>
      </Pressable>
    </View>
  );
}
