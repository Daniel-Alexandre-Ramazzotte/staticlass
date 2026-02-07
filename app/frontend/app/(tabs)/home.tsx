import React, { useState } from 'react';
import {
  Image,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import styles from '../constants/style';
import { useRouter } from 'expo-router';
import { PersonalizarAccordion } from '../components/CustomAccordion';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const [qtdQuestoes, setQtdQuestoes] = useState('5');
  const { signOut, role, email } = useAuth();

  const handleStartQuiz = () => {
    router.push({
      pathname: '/screens/QuizInProgressScreen',
      params: { qtd: qtdQuestoes },
    });
  };
  return (
    <View style={styles.homeWrap}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Bem-vindo ao app!</Text>
      <Text style={styles.subtitle}>Usuário: {email}</Text>
      <Text style={styles.subtitle}>Função: {role}</Text>
      <TouchableOpacity
        style={styles.startButton}
        activeOpacity={0.85}
        onPress={handleStartQuiz}
      >
        <Text style={styles.startText}>Iniciar Quiz</Text>
      </TouchableOpacity>

      <PersonalizarAccordion num={qtdQuestoes} setNum={setQtdQuestoes} />
      <Pressable onPress={() => signOut()}>
        <Text>SAIR</Text>
      </Pressable>

      {role === 'admin' && (
          <Pressable onPress={() => router.push('/screens/AdminScreen')}>
            <Text>Ir para Admin</Text>
          </Pressable>
        ) && (
          <Pressable
            onPress={() => router.push('/(professor)/QuestionsManager')}
          >
            <Text>Gerenciar Questões</Text>
          </Pressable>
        )}

      {role === 'professor' && (
        <Pressable onPress={() => router.push('/(professor)/ProfessorMenu')}>
          <Text>Gerenciar Questões</Text>
        </Pressable>
      )}


      <View style={styles.footerNote}>
        <Text style={styles.footerText}>UEM • Footer • Patrocinadores</Text>
      </View>
    </View>
  );
}
