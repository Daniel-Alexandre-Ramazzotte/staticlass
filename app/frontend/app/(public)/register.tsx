import { useRouter, Stack } from 'expo-router';
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
import style from 'app/constants/style';

/*

Tela de registro 

Verificar 



*/

const appName = 'Staticlass';

export default function RegisterScreen() {
  const router = useRouter(); // Constante do roteador para navegação
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [name, setName] = useState<string>('');
  const handleRegister = async () => {
    // Realiza a lógica de registro aqui
    // Após o registro bem-sucedido, navega para a tela principal (conjunto de abas)

    router.push('/(public)/login');
  };
  return (
    <View style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      ></Image>
      <Text style={styles.title}>Cadastre-se!</Text>
      <TextInput
        style={style.input}
        value={name}
        onChangeText={setName}
        placeholder="Nome"
      />
      <TextInput
        style={style.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
      />
      <TextInput
        style={style.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Senha"
        secureTextEntry
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
      <Pressable onPress={handleRegister} style={styles.startButton}>
        <Text style={styles.startText}>Registrar</Text>
      </Pressable>
    </View>
  );
}
