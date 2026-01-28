import { useRouter } from 'expo-router';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import styles from 'app/constants/style';
import { useEffect, useState } from 'react';
import api from '../services/api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState();
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState('0');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('userEmail');

        if (savedEmail) {
          const response = await api.get(`/users/profile/${savedEmail}`);
          const data = await response.data;

          if (!data.error) {
            setUserName(data.name);
            setScore(data.score);
            //setStreak(data.streak);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      }
    };

    loadUserData();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.subtitle}>👤 {userName}</Text>

      <Text style={styles.subtitle}>⭐ Pontuação: {score}</Text>

      <TextInput
        style={styles.input}
        value={streak}
        onChangeText={setStreak}
        placeholder="Streak"
      />

      <Pressable
        style={styles.loginButton}
        onPress={() => router.push('/settings')}
      >
        <Text style={styles.startText}>Configurações</Text>
      </Pressable>

      {/* Botão de Ranking corrigido (removido o erro de comentário) */}
      <Pressable
        style={styles.loginButton}
        onPress={() => router.push('/ranking')}
      >
        <Text style={styles.startText}>Ranking</Text>
      </Pressable>

      <Pressable
        style={styles.loginButton}
        onPress={() => router.push('/statistics')}
      >
        <Text style={styles.startText}>Estatísticas</Text>
      </Pressable>
    </View>
  );
}
