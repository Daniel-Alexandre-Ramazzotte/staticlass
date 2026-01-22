import React, { useState } from 'react';
import { Image, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import styles from '../constants/style';
import { useRouter } from 'expo-router';
import { PersonalizarAccordion } from '../components/CustomAccordion';

export default function HomeScreen() {
  const router = useRouter();
  const [qtdQuestoes, setQtdQuestoes] = useState('5');
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
      <TouchableOpacity
        style={styles.startButton}
        activeOpacity={0.85}
        onPress={handleStartQuiz}
      >
        <Text style={styles.startText}>Iniciar Quiz</Text>
      </TouchableOpacity>

      <PersonalizarAccordion num={qtdQuestoes} setNum={setQtdQuestoes} />

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>UEM • Footer • Patrocinadores</Text>
      </View>
    </View>
  );
}
