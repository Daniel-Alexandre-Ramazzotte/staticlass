import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { PersonalizarAccordion, Chapter } from 'app/components/CustomAccordion';
import { XStack, YStack, Text } from 'tamagui';
import { palette, primaryFontA } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';

export default function QuestionsScreen() {
  const router = useRouter();
  const { name } = useAuth();
  const [qtdQuestoes, setQtdQuestoes] = useState('5');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);

  useEffect(() => {
    api.get('/questions/chapters').then((res) => setChapters(res.data)).catch(() => {});
  }, []);

  const handleStartQuiz = () => {
    const params: Record<string, any> = { qtd: qtdQuestoes };
    if (chapterId !== null) params.chapter_id = chapterId;
    if (difficulty !== null) params.difficulty = difficulty;
    router.push({ pathname: '/(app)/QuizInProgressScreen', params });
  };

  return (
    <YStack f={1} jc="center">
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$8"
        pb="$4"
        px="$4"
        ai="center"
        jc="space-between"
        width="100%"
      >
        <Text color="#fff" fontSize="$6" fontWeight="bold" fontFamily={primaryFontA}>
          {`Olá, ${name || 'Usuário'}!`}
        </Text>
      </XStack>

      <YStack f={1} jc="center" ai="center" gap="$4">
        <AppButton
          type="primary"
          buttonSize="big"
          backgroundColor={palette.primaryGreen}
          onPress={handleStartQuiz}
          fontFamily={primaryFontA}
        >
          Iniciar Quiz
        </AppButton>

        <PersonalizarAccordion
          num={qtdQuestoes}
          setNum={setQtdQuestoes}
          chapters={chapters}
          chapterId={chapterId}
          setChapterId={setChapterId}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />
      </YStack>
    </YStack>
  );
}
