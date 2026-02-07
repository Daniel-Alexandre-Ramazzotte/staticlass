import { useRouter } from 'expo-router';
import {
  View,
  Text,
  Image,
} from 'react-native';
import styles, { tamaguiStyles } from 'app/constants/style';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, XStack, YStack } from 'tamagui';
import { Settings, Trophy, Flame, BarChart2, Award, Camera } from '@tamagui/lucide-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState("0");

  useEffect(() => {
    const loadUserData = async () => {
      try {
       
        const savedEmail = await AsyncStorage.getItem('userEmail');
       

        if (!savedEmail) {
          console.log("Aviso: Nenhum e-mail encontrado no armazenamento.");
          return;
        }

        const response = await api.get(`/users/profile/${savedEmail.trim()}`);
      
        const userData = response.data;

       
        if (userData) {
          const nameToSet = userData.name || userData.nome || 'Usuário';
          const scoreToSet = userData.score ?? 0;

          setUserName(nameToSet);
          setScore(scoreToSet);
         
        }

      } catch (err: any) {
 
        console.dir(err);
       
        if (err.response) {
          // O backend respondeu, mas com erro (Ex: 404, 500)
          console.log("Status do Backend:", err.response.status);
          console.log("Resposta do Backend:", err.response.data);
          alert(`Erro do Servidor: ${err.response.status}`);
        } else if (err.request) {
          // O app não conseguiu nem falar com o backend
          console.log("O servidor não respondeu. O IP da API pode estar errado.");
          alert("Erro de conexão: Servidor offline ou IP incorreto.");
        } else {
          // Erro de código no JavaScript
          console.log("Erro de código:", err.message);
          alert(`Erro de código: ${err.message}`);
        }
      }
    };

  loadUserData();
  }, []);
  return (

  <View style={styles.mainContainer}>
      <View style={styles.profileHeader}>
        {/* A imagem entra aqui, antes do texto */}
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo} // Certifique-se que o estilo tenha largura e altura
        />
       
        <Text style={styles.userNameText}>{userName}</Text>
      </View>

      {/* Cards de Status (Pontuação e Streak Fixos) */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Trophy size={28} color="#FFD700" />
          <Text style={styles.statValue}>{score}</Text>
          <Text style={styles.statLabel}>Pontos</Text>
        </View>
       
        <View style={styles.statItem}>
          <Flame size={28} color="#FF4500" />
          <Text style={styles.statValue}>{streak} dias</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Menu de Opções com Tamagui */}
      <YStack space="$3" width="90%" paddingHorizontal="$4">
       
        <Button
          icon={BarChart2}
          size="$5"
          backgroundColor="#007AFF"
          color="white"
          onPress={() => router.push('/statistics')}
        >
          Estatísticas
        </Button>

        <Button
          icon={<Award color="#007AFF" size={20} />}
          onPress={() => router.push('/ranking')}
          {...tamaguiStyles.rankingButton}
        >
          Ranking Global
        </Button>

        <Button
          icon={Settings}
          {...tamaguiStyles.buttonOutline}
          onPress={() => router.push('/settings')}
        >
          Configurações
        </Button>

      </YStack>
    </View>
  );
}


