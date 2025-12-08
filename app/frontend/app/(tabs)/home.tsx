import React from 'react';
import { Image, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import styles from '../constants/style';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const startQuiz = () => {
    router.push('/screens/QuizInProgressScreen');
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
        onPress={startQuiz}
      >
        <Text style={styles.startText}>Iniciar Quiz</Text>
      </TouchableOpacity>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>UEM • Footer • Patrocinadores</Text>
      </View>
    </View>
  );
}
