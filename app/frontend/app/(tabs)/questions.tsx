import React, { useState } from 'react';
import {
  Image,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';

import { useRouter } from 'expo-router';
import { PersonalizarAccordion } from 'app/components/CustomAccordion';
import { useAuth } from 'app/context/AuthContext';
import { XStack, YStack, Button, Text } from 'tamagui';
import styles, { palette } from 'app/constants/style';
export default function QuestionsScreen() {
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
    <YStack f={1} jc="center">
      {/*Header*/}
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$8" // Testar melhor
        pb="$4"
        px="$4"
        ai="center" // Alinhamento vertical
        jc="space-between" // Espaço entre os itens
        width={'100%'}
      >
        <Text color="#fff" fontSize="$6" fontWeight="bold">
          {`Olá Nome do Usuário!`}
        </Text>
      </XStack>
      <YStack f={1} jc="center" ai="center" gap="$4">
        <Button
          backgroundColor={palette.primaryGreen}
          onPress={handleStartQuiz}
          width={'70%'}
        >
          <Text color="#fff" fontSize="$7" fontWeight="bold">
            Iniciar Quiz
          </Text>
        </Button>

        <PersonalizarAccordion num={qtdQuestoes} setNum={setQtdQuestoes} />
      </YStack>
    </YStack>
  );
}
