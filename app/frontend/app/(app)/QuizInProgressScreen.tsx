import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import styles, { palette } from 'app/constants/style';
import { CAP_NOMES } from 'app/constants/names';
import { API_BASE_URL } from 'app/constants/apiBase';
import api from 'app/services/api';
import { ChevronLeft } from 'lucide-react-native';
import { ScrollView, XStack, YStack, Text, View, Button, Progress } from 'tamagui';
import { AppButton } from 'app/components/AppButton';
import { MathText } from 'app/components/MathText';

function QuizTag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[tagStyles.tag, { backgroundColor: color }]}>
      <Text color="#fff" fontSize={11} fontWeight="bold">
        {label}
      </Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  tag: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
});

interface Alternative {
  letter: string;
  text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  id: number;
  issue: string;
  question_type?: string | null;
  alternatives: Alternative[];
  correct_answer: string | null;
  solution: string | null;
  image_q: string | null;
  image_s: string | null;
  image_q_position: 'antes' | 'depois' | 'meio' | null;
  difficulty: number | null;
  chapter_name: string | null;
  chapter_number: number | null;
  topic_name: string | null;
  source: string | null;
}

interface QuizResultItem {
  message: 'correct' | 'incorrect';
  userAnswer: string;
  id: number;
  issue: string;
  correct_answer: string;
  solution: string | null;
  image_q: string | null;
  image_s: string | null;
  image_q_position: 'antes' | 'depois' | 'meio' | null;
}

function parseIds(val: string | string[] | undefined): number[] | null {
  if (!val) return null;
  const arr = Array.isArray(val) ? val : [val];
  const nums = arr.map(Number).filter((n) => !Number.isNaN(n));
  return nums.length ? nums : null;
}

function parseStrs(val: string | string[] | undefined): string[] | null {
  if (!val) return null;
  const arr = (Array.isArray(val) ? val : [val]).filter(Boolean);
  return arr.length ? arr : null;
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

const QuizInProgressScreen = () => {
  const {
    qtd,
    chapter_id,
    topic_id,
    difficulty,
    daily,
    source,
    list_id,
    list_title,
    list_mode,
  } = useLocalSearchParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [userAnswerVF, setUserAnswerVF] = useState<Record<string, 'V' | 'F'>>({});
  const [counter, setCounter] = useState(0);
  const [userResponses, setUserResponses] = useState<QuizResultItem[]>([]);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const startMarkedRef = useRef<string | null>(null);

  const currentListId = firstParam(list_id);
  const currentListTitle = firstParam(list_title);
  const isListMode = firstParam(list_mode) === '1' && Boolean(currentListId);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isListMode && currentListId) {
        const response = await api.get<QuizQuestion[]>(`/lists/${currentListId}/questions`);
        if (response.status !== 200) throw new Error('Erro ao buscar as questões da lista');
        setQuestions(response.data);
        setCounter(0);
        setUserResponses([]);
        setUserAnswer('');
        startMarkedRef.current = null;
        return;
      }

      const params: Record<string, string | number | number[] | string[]> = { num: qtd as string };
      const chapterIds = parseIds(chapter_id as string | string[]);
      const topicIds = parseIds(topic_id as string | string[]);
      const difficulties = parseIds(difficulty as string | string[]);
      const sources = parseStrs(source as string | string[]);
      if (chapterIds) params.chapter_id = chapterIds;
      if (topicIds) params.topic_id = topicIds;
      if (difficulties) params.difficulty = difficulties;
      if (sources) params.source = sources;

      const response = await api.get<QuizQuestion[]>('/questions/filtered', { params });
      if (response.status !== 200) throw new Error('Erro ao buscar as questões');
      setQuestions(response.data);
      setCounter(0);
      setUserResponses([]);
      setUserAnswer('');
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar as questões');
    } finally {
      setLoading(false);
    }
  }, [chapter_id, currentListId, difficulty, isListMode, qtd, source, topic_id]);

  const fetchImage = async (imageName: string) => {
    if (!imageName || imageName === 'null') {
      setCurrentImageBase64(null);
      return;
    }
    setImageLoading(true);
    try {
      const response = await api.get(`questions/uploads/${imageName}`, {
        responseType: 'blob',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const reader = new FileReader();
      reader.onload = () => {
        setCurrentImageBase64(reader.result as string);
        setImageLoading(false);
      };
      reader.onerror = () => {
        setCurrentImageBase64(null);
        setImageLoading(false);
      };
      reader.readAsDataURL(response.data);
    } catch {
      setCurrentImageBase64(null);
      setImageLoading(false);
    }
  };

  useEffect(() => {
    const imageName = questions[counter]?.image_q;
    if (imageName) fetchImage(imageName);
    else setCurrentImageBase64(null);
  }, [counter, questions]);

  useFocusEffect(
    useCallback(() => {
      fetchQuestions().catch(() => undefined);
      return () => undefined;
    }, [fetchQuestions]),
  );

  useEffect(() => {
    if (!isListMode || !currentListId || questions.length === 0) return;
    if (startMarkedRef.current === currentListId) return;

    startMarkedRef.current = currentListId;
    api.post(`/lists/${currentListId}/start`).catch(() => {
      startMarkedRef.current = null;
    });
  }, [currentListId, isListMode, questions.length]);

  useEffect(() => {
    scaleAnim.setValue(1);
  }, [counter, scaleAnim]);

  const handleNextQuestion = () => {
    const current = questions[counter];
    const qt = current.question_type ?? 'multiple_choice';

    if (qt === 'multiple_choice' && !userAnswer) return;
    if (qt === 'true_false' && Object.keys(userAnswerVF).length < current.alternatives.length) return;

    let message: 'correct' | 'incorrect' = 'incorrect';
    let displayAnswer = userAnswer;

    if (qt === 'open_answer') {
      if (!userAnswer.trim()) return;
      message = 'correct';
      displayAnswer = userAnswer;
    } else if (qt === 'true_false') {
      const allCorrect = current.alternatives.every(
        (alt) => (userAnswerVF[alt.letter] === 'V') === alt.is_correct,
      );
      message = allCorrect ? 'correct' : 'incorrect';
      displayAnswer = JSON.stringify(userAnswerVF);
    } else {
      message = userAnswer === current.correct_answer ? 'correct' : 'incorrect';
    }

    const result: QuizResultItem = {
      message,
      userAnswer: displayAnswer,
      id: current.id,
      issue: current.issue,
      correct_answer: current.correct_answer ?? '',
      solution: current.solution,
      image_q: current.image_q,
      image_s: current.image_s,
      image_q_position: current.image_q_position,
    };

    const newResponses = [...userResponses, result];
    setUserResponses(newResponses);
    setUserAnswer('');
    setUserAnswerVF({});

    if (counter + 1 >= questions.length) {
      router.push({
        pathname: '/(app)/ResultScreen',
        params: {
          result: JSON.stringify(newResponses),
          chapter_id: chapter_id ?? '',
          difficulty: difficulty ?? '',
          daily: daily ?? '',
          list_id: currentListId ?? '',
          list_title: currentListTitle ?? '',
          list_mode: isListMode ? '1' : '',
        },
      });
      return;
    }

    setCounter(counter + 1);
  };

  const renderContent = () => {
    if (loading) return <ActivityIndicator size="large" color={palette.primaryBlue} />;
    if (error) return <Text style={styles.errorText}>Erro: {error}</Text>;
    if (!questions.length) {
      return <Text style={styles.errorText}>Nenhuma questão encontrada.</Text>;
    }

    const current = questions[counter];
    const progress = (counter / questions.length) * 100;
    const hasQuestionImage = Boolean(current.image_q && current.image_q !== 'null');
    const questionImageBlock = (
      <View style={styles.image}>
        {imageLoading ? (
          <ActivityIndicator size="large" color={palette.primaryBlue} />
        ) : currentImageBase64 ? (
          <Image source={{ uri: currentImageBase64 }} style={styles.image} resizeMode="contain" />
        ) : null}
      </View>
    );

    return (
      <ScrollView>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack f={1} backgroundColor={palette.white}>
          <XStack
            backgroundColor={palette.primaryBlue}
            pt="$8"
            pb="$4"
            px="$4"
            ai="center"
            jc="space-between"
          >
            <Button
              size="$3"
              circular
              backgroundColor="transparent"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => router.back()}
              icon={<ChevronLeft color={palette.white} size={28} />}
            />
            <Progress f={1} value={progress || 0} size="$3" backgroundColor={palette.white}>
              <Progress.Indicator backgroundColor={palette.primaryGreen} transition="quicker" />
            </Progress>
          </XStack>

          <YStack minHeight={400} px="$5" pt="$8" gap="$6">
            {isListMode && currentListTitle ? (
              <Text color={palette.darkBlue} fontSize={16} fontWeight="700">
                {currentListTitle}
              </Text>
            ) : null}
            <XStack ai="center" jc="space-between" flexWrap="wrap" gap="$2">
              <Text fontSize={22} fontWeight="900" color={palette.offBlack}>
                QUESTÃO {counter + 1}
              </Text>
              <Text fontSize={12} color="#999">
                #{current.id}
              </Text>
            </XStack>
            <XStack flexWrap="wrap" gap="$2">
              {current.chapter_name ? (
                <QuizTag
                  label={
                    current.chapter_number
                      ? CAP_NOMES[current.chapter_number] ?? current.chapter_name
                      : current.chapter_name
                  }
                  color={palette.darkBlue}
                />
              ) : null}
              {current.topic_name ? <QuizTag label={current.topic_name} color="#5c7a9e" /> : null}
              {current.difficulty ? (
                <QuizTag
                  label={
                    current.difficulty === 1
                      ? 'Fácil'
                      : current.difficulty === 2
                        ? 'Médio'
                        : 'Difícil'
                  }
                  color={
                    current.difficulty === 1
                      ? palette.primaryGreen
                      : current.difficulty === 2
                        ? palette.warn
                        : palette.red
                  }
                />
              ) : null}
              {current.source ? (
                <QuizTag
                  label={current.source.toUpperCase()}
                  color={isListMode ? palette.primaryGreen : palette.lightBlue}
                />
              ) : null}
            </XStack>
            <YStack gap="$4" ai="center">
              {hasQuestionImage && current.image_q_position === 'antes' ? questionImageBlock : null}
              <MathText fontSize={16} color="#1a1a1a" style={styles.issueText} apiBase={API_BASE_URL}>
                {current.issue}
              </MathText>
              {hasQuestionImage && current.image_q_position !== 'antes' && current.image_q_position !== 'meio'
                ? questionImageBlock
                : null}
            </YStack>
          </YStack>

          <YStack backgroundColor={palette.primaryBlue} px="$5" py="$6" gap="$3">
            <YStack style={styles.buttonContainer} gap="$3">
              {(current.question_type ?? 'multiple_choice') === 'open_answer' ? (
                <TextInput
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  placeholder="Digite sua resposta..."
                  placeholderTextColor="#ccc"
                  multiline
                  style={{
                    backgroundColor: palette.darkBlue, color: '#fff',
                    borderRadius: 12, padding: 12, fontSize: 15, minHeight: 80,
                    borderWidth: 1, borderColor: palette.lightBlue,
                  }}
                />
              ) : (current.question_type ?? 'multiple_choice') === 'true_false' ? (
                current.alternatives.map((alt) => (
                  <YStack key={alt.letter} gap="$1">
                    <MathText fontSize={14} color={palette.offWhite} apiBase={API_BASE_URL}>
                      {`${alt.letter}) ${alt.text}`}
                    </MathText>
                    <XStack gap="$2">
                      <Button
                        flex={1} size="$3" borderRadius={8}
                        backgroundColor={userAnswerVF[alt.letter] === 'V' ? palette.primaryGreen : palette.darkBlue}
                        onPress={() => setUserAnswerVF((prev) => ({ ...prev, [alt.letter]: 'V' }))}
                      >
                        <Text color={palette.white} fontWeight="bold">Verdadeiro</Text>
                      </Button>
                      <Button
                        flex={1} size="$3" borderRadius={8}
                        backgroundColor={userAnswerVF[alt.letter] === 'F' ? palette.red : palette.darkBlue}
                        onPress={() => setUserAnswerVF((prev) => ({ ...prev, [alt.letter]: 'F' }))}
                      >
                        <Text color={palette.white} fontWeight="bold">Falso</Text>
                      </Button>
                    </XStack>
                  </YStack>
                ))
              ) : (
                current.alternatives.map((alt) => (
                  <Button
                    key={alt.letter}
                    onPress={() => setUserAnswer(alt.letter)}
                    borderRadius={25}
                    pressStyle={{ opacity: 0.8 }}
                    height="auto"
                    minHeight={50}
                    py="$3"
                    backgroundColor={userAnswer === alt.letter ? palette.lightBlue : palette.darkBlue}
                  >
                    <XStack f={1} ai="flex-start" w="100%" px="$4" gap="$2">
                      <Text color={palette.offWhite} fontWeight="bold" fontSize={18}>
                        {alt.letter})
                      </Text>
                      <MathText fontSize={16} color={palette.offWhite} style={{ flex: 1 }} apiBase={API_BASE_URL}>
                        {alt.text}
                      </MathText>
                    </XStack>
                  </Button>
                ))
              )}
            </YStack>
          </YStack>

          <AppButton
            mt="auto"
            buttonSize="big"
            type={
              (current.question_type ?? 'multiple_choice') === 'open_answer'
                ? (userAnswer.trim() ? 'secondary' : 'inactive')
                : (current.question_type === 'true_false'
                    ? (Object.keys(userAnswerVF).length >= current.alternatives.length ? 'secondary' : 'inactive')
                    : (userAnswer ? 'secondary' : 'inactive'))
            }
            onPress={handleNextQuestion}
          >
            CONFIRMAR
          </AppButton>
        </YStack>
      </ScrollView>
    );
  };

  return <>{renderContent()}</>;
};

export default QuizInProgressScreen;
