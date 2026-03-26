import { Text, View, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import RecoverPasswordService from 'app/services/RecoverPasswordService';
import styles from 'app/constants/style';

export default function RecoverPassword() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');

  const handleRecoverPassword = async () => {
    // Lógica para recuperação de senha

    const response = await RecoverPasswordService({ email });

    showAlert();
  };

  const showAlert = () => {
    Alert.alert(
      'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
      '',
      [{ text: 'OK', onPress: () => router.push('/(public)/Login') }]
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text>Recuperacao de senha</Text>
      <TextInput
        placeholder="Digite seu email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <Pressable style={styles.loginButton} onPress={handleRecoverPassword}>
        <Text style={styles.startText}>Enviar link de recuperacao</Text>
      </Pressable>
    </View>
  );
}
