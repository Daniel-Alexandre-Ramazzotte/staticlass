import { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';

import CheckAnswer from '../services/CheckAnswer';
import styles from '../constants/style';
import CustomButton from 'app/components/CustomButton/CustomButton';
import GradientWrapper from 'app/components/GradientWrapper/GradientWrapper';
import api from '../services/api';

interface QuizAnswer {
  id: string;
  text: string[];
}

interface QuizQuestions {
  num_questions: number;
  counter: number;
  issues: string[];
  answers: QuizAnswer[]; // Mudou de string[][] para QuizAnswer[]
  correct_answers: string[];
  solutions: string[];
  image_q?: string[];
  image_s?: string[];
}


const QuizInProgressScreen = () => {
  const { qtd } = useLocalSearchParams();
  const router = useRouter();

  const [quizQuestions, setQuestions] = useState<QuizQuestions>({
    num_questions: 0,
    counter: 0,
    issues: [],
    answers: [],
    correct_answers: [],
    solutions: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [counter, setCounter] = useState<number>(0);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/questions/rand/${qtd}`);
      const data = response.data;

      // Log para debug: Verifique se 'answers' no terminal é um [] ou {}
      console.log("RESPOSTA API:", data);
      
      setQuestions({
        num_questions: Number(qtd),
        counter: 0,
        issues: data.issue || [],
        // Forçamos a transformação para garantir que seja uma lista de listas
        answers: Array.isArray(data.answers) 
          ? data.answers 
          : Object.values(data.answers || {}), 
        correct_answers: data.correct_answer || [],
        solutions: data.solution || [],
        image_q: data.image_q || [],
        image_s: data.image_s || [],
      });
      
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao buscar questões');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchQuestion();
      return () => {};
    }, [qtd])
  );

  useEffect(() => {
    setSelected(null);
    setUserAnswer('');
  }, [counter]);

  const handleAltPress = (alt: string, index: number) => {
    setUserAnswer(alt);
    setSelected(index);
  };

  const handleNextQuestion = async () => {
    if (userAnswer === '') return;

    
    const correct = quizQuestions.correct_answers[counter];
    
    const currentQuestionResult = {
      message: userAnswer === correct ? 'correct' : 'incorrect', 
      userAnswer: userAnswer,
      issue: quizQuestions.issues[counter],
      correct_answer: correct,
      solution: quizQuestions.solutions[counter],
      image_q: quizQuestions.image_q?.[counter] || null,
      image_s: quizQuestions.image_s?.[counter] || null,
    };

    const newResponses = [...userResponses, currentQuestionResult];
    setUserResponses(newResponses as any);

    const nextIndex = counter + 1;

    if (nextIndex >= quizQuestions.num_questions) {
     
      router.push({
        pathname: '../screens/ResultScreen' as any,
        params: { result: JSON.stringify(newResponses) },
      });
    } else {
      setCounter(nextIndex);
    }
  };

  const renderContent = () => {
    if (loading) return <ActivityIndicator size="large" color="#0000ff" style={{flex: 1}} />;
    if (error) return <Text style={{color: 'red', textAlign: 'center', marginTop: 50}}>{error}</Text>;

    // SOLUÇÃO DO ERRO: Garante que currentAnswers seja uma lista antes do .map
    const rawAnswers = quizQuestions.answers[counter];
    const currentAnswers = Array.isArray(rawAnswers) ? rawAnswers : [];

    return (
      <GradientWrapper>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.mainContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.gameContainer}>
              <Text style={styles.gtitle}>Questão {counter + 1} de {quizQuestions.num_questions}</Text>
              
              <Text style={styles.question}>
                {quizQuestions.issues[counter] || "Questão não encontrada"}
              </Text>

              <View style={styles.buttonContainer}>
                {/* quizQuestions.answers é o array com id: A, B, C... */}
                {quizQuestions.answers.length > 0 ? (
                  quizQuestions.answers.map((item: any, index: number) => (
                    <CustomButton
                      key={index}
                      // item.id é 'A', 'B'... | item.text[counter] é o texto da questão atual
                      buttonText={`${item.id}) ${item.text[counter]}`}
                      onPress={() => handleAltPress(item.id, index)}
                      type={selected === index ? "secondary" : "primary"}
                      fullWidth={true} width={undefined} disabled={undefined}                    />
                  ))
                ) : (
                  <Text>Nenhuma alternativa encontrada no banco.</Text>
                )}
              </View>
            </View>

            <Pressable
              style={[styles.restartButton, { opacity: userAnswer === '' ? 0.5 : 1, marginTop: 30 }]}
              onPress={handleNextQuestion}
              disabled={userAnswer === ''}
            >
              <Text style={styles.restartText}>
                {counter + 1 >= quizQuestions.num_questions ? "Ver Resultado" : "Próxima Questão"}
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </GradientWrapper>
    );
  };

  return <>{renderContent()}</>;
};

export default QuizInProgressScreen;