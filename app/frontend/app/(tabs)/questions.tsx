import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { PersonalizarAccordion, Chapter, Topic } from 'app/components/CustomAccordion';
import { XStack, YStack, Text } from 'tamagui';
import { palette, primaryFontA } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';
import { useLayout } from '../../src/constants/layout';

export default function QuestionsScreen() {
  const router = useRouter();
  const { name } = useAuth();
  const { isWide, fs, pad, btnH, maxW } = useLayout();
  const [qtdQuestoes, setQtdQuestoes] = useState('5');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [chapterIds, setChapterIds] = useState<number[]>([]);
  const [topicIds, setTopicIds] = useState<number[]>([]);
  const [difficulties, setDifficulties] = useState<number[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    api.get('/questions/chapters').then((res) => setChapters(res.data)).catch(() => {});
    api.get('/questions/topics').then((res) => setAllTopics(res.data)).catch(() => {});
  }, []);

  const handleStartQuiz = () => {
    const params: Record<string, any> = { qtd: qtdQuestoes };
    if (chapterIds.length) params.chapter_id = chapterIds;
    if (topicIds.length) params.topic_id = topicIds;
    if (difficulties.length) params.difficulty = difficulties;
    if (sources.length) params.source = sources;
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
        <Text color="#fff" fontSize={fs(20)} fontWeight="bold" fontFamily={primaryFontA}>
          {`Olá, ${name || 'Usuário'}!`}
        </Text>
      </XStack>

      <YStack f={1} jc="center" ai="center" gap="$4" alignSelf="center" width="100%" maxWidth={maxW ?? '100%'} px={pad(16)}>
        <AppButton
          type="primary"
          buttonSize={isWide ? 'wide' : 'big'}
          backgroundColor={palette.primaryGreen}
          onPress={handleStartQuiz}
          fontFamily={primaryFontA}
          width={isWide ? 360 : '80%'}
        >
          Iniciar Quiz
        </AppButton>

        <PersonalizarAccordion
          num={qtdQuestoes}
          setNum={setQtdQuestoes}
          chapters={chapters}
          chapterIds={chapterIds}
          setChapterIds={setChapterIds}
          topics={allTopics}
          topicIds={topicIds}
          setTopicIds={setTopicIds}
          difficulties={difficulties}
          setDifficulties={setDifficulties}
          sources={sources}
          setSources={setSources}
        />
      </YStack>
    </YStack>
  );
}
