import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { PersonalizarAccordion } from 'app/components/CustomAccordion';
import { XStack, YStack, Button, Text } from 'tamagui';
import { palette } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';
import { useAuth } from 'app/context/AuthContext';

export default function QuestionsScreen() {
  const router = useRouter();
  const [qtdQuestoes, setQtdQuestoes] = useState('5');
  const { name } = useAuth();
  const handleStartQuiz = () => {
    router.push({
      pathname: '/(app)/QuizInProgressScreen',
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
          {`Olá, ${name || 'Usuário'}!`}
        </Text>
      </XStack>
      <YStack f={1} jc="center" ai="center" gap="$4">
        <AppButton
          type="primary"
          buttonSize="big"
          backgroundColor={palette.primaryGreen}
          onPress={handleStartQuiz}
        >
          Iniciar Quiz
        </AppButton>

        <PersonalizarAccordion num={qtdQuestoes} setNum={setQtdQuestoes} />
      </YStack>
    </YStack>
  );
}
