import { useEffect, useCallback, useState, useRef } from 'react';
import { ActivityIndicator, Animated, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import styles, { palette } from 'app/constants/style';
import api from 'app/services/api';
import { ChevronLeft } from 'lucide-react-native';
import { ScrollView, XStack, YStack, Text, View, Button, Progress } from 'tamagui';
import { AppButton } from 'app/components/AppButton';

interface Alternative {
  letter: string;
  text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  id: number;
  issue: string;
  alternatives: Alternative[];
  correct_answer: string;
  solution: string | null;
  image_q: string | null;
  image_s: string | null;
}

const QuizInProgressScreen = () => {
  const { qtd, chapter_id, difficulty } = useLocalSearchParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [counter, setCounter] = useState(0);
  const [userResponses, setUserResponses] = useState<any[]>([]);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = { num: qtd };
      if (chapter_id) params.chapter_id = chapter_id;
      if (difficulty) params.difficulty = difficulty;
      const response = await api.get('/questions/filtered', { params });
      if (response.status !== 200) throw new Error('Erro ao buscar as questões');
      setQuestions(response.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar as questões');
    } finally {
      setLoading(false);
    }
  };

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
      reader.readAsDataURL(response.data);
      reader.onload = () => {
        setCurrentImageBase64(reader.result as string);
        setImageLoading(false);
      };
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
      fetchQuestions();
      return () => {};
    }, [])
  );

  useEffect(() => {
    setSelected(null);
    scaleAnim.setValue(1);
  }, [counter]);

  const handleAltPress = (letter: string) => {
    setUserAnswer(letter);
  };

  const handleNextQuestion = () => {
    if (!userAnswer) return;

    const current = questions[counter];
    const result = {
      message: userAnswer === current.correct_answer ? 'correct' : 'incorrect',
      userAnswer,
      id: current.id,
      issue: current.issue,
      correct_answer: current.correct_answer,
      solution: current.solution,
      image_q: current.image_q,
      image_s: current.image_s,
    };

    const newResponses = [...userResponses, result];
    setUserResponses(newResponses);
    setUserAnswer('');

    if (counter + 1 >= questions.length) {
      router.push({
        pathname: '/(app)/ResultScreen' as any,
        params: { result: JSON.stringify(newResponses) },
      });
    } else {
      setCounter(counter + 1);
    }
  };

  const renderContent = () => {
    if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
    if (error) return <Text style={styles.errorText}>Erro: {error}</Text>;
    if (!questions.length)
      return <Text style={styles.errorText}>Nenhuma questão encontrada.</Text>;

    const current = questions[counter];
    const progress = (counter / questions.length) * 100;

    return (
      <ScrollView>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack f={1} backgroundColor={palette.white}>
          {/* Header */}
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

          {/* Enunciado */}
          <YStack minHeight={400} px="$5" pt="$8" gap="$6">
            <Text fontSize={22} fontWeight="900" color={palette.offBlack}>
              QUESTÃO {counter + 1}
            </Text>
            <YStack gap="$4" ai="center">
              <Text style={styles.issueText}>{current.issue}</Text>
              {current.image_q && current.image_q !== 'null' && (
                <View style={styles.image}>
                  {imageLoading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                  ) : (
                    currentImageBase64 && (
                      <Image
                        source={{ uri: currentImageBase64 }}
                        style={styles.image}
                        resizeMode="contain"
                      />
                    )
                  )}
                </View>
              )}
            </YStack>
          </YStack>

          {/* Alternativas */}
          <YStack backgroundColor={palette.primaryBlue} px="$5" py="$6" gap="$3">
            <YStack style={styles.buttonContainer} gap="$3">
              {current.alternatives.map((alt) => (
                <Button
                  key={alt.letter}
                  onPress={() => handleAltPress(alt.letter)}
                  borderRadius={25}
                  pressStyle={{ opacity: 0.8 }}
                  height="auto"
                  minHeight={50}
                  py="$3"
                  backgroundColor={
                    userAnswer === alt.letter ? palette.lightBlue : palette.darkBlue
                  }
                >
                  <XStack f={1} ai="center" w="100%" px="$4">
                    <Text fontWeight="bold" fontSize={18}>
                      {alt.letter}
                      {')  '}
                    </Text>
                    <Text
                      color={selected ? palette.darkBlue : palette.offWhite}
                      fontWeight="bold"
                      fontSize={18}
                      width="100%"
                    >
                      {alt.text}
                    </Text>
                  </XStack>
                </Button>
              ))}
            </YStack>
          </YStack>

          <AppButton
            mt="auto"
            buttonSize="big"
            type={userAnswer ? 'secondary' : 'inactive'}
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
