import { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Button,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation, Text, Provider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import CheckAnswer from '../services/CheckAnswer';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import styles, { SELECTED, BG, BUTTONS, PRIMARY } from '../constants/style';
import CustomButton from 'app/components/CustomButton/CustomButton';
import GradientWrapper from 'app/components/GradientWrapper/GradientWrapper';
import api from '../services/api';
interface QuizQuestions {
  num_questions: number;
  counter: number;
  issues: [string];
  answers: string[][];
  correct_answers: [string];
  solutions: [string];
}

// Fazer funcao para voltar e avancar as questoes

const QuizInProgressScreen = () => {
  const { qtd } = useLocalSearchParams();
  const altLetters = ['A', 'B', 'C', 'D', 'E'];
  const router = useRouter();
  const [quizQuestions, setQuestions] = useState<QuizQuestions>({
    num_questions: 0,
    counter: 0,
    issues: [''],
    answers: [['']],
    correct_answers: [''],
    solutions: [''],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [counter, setCounter] = useState<number>(0);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/questions/rand/${qtd}`);

      if (!response.ok) {
        throw new Error('Erro na resposta do servidor');
      }
      const data = await response.json();
      console.log(data);

      await setQuestions({
        num_questions: Number(qtd),
        counter: 0,
        issues: data.issue,
        answers: data.answers,
        correct_answers: data.correct_answer,
        solutions: data.solution,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar a questão');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchQuestion();
      return () => {};
    }, [])
  );
  const [selected, setSelected] = useState(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    setSelected(null);
    scaleAnim.setValue(1);
  }, [counter]);

  console.log('answers:', quizQuestions.answers);
  console.log('current index:', counter);
  console.log('answers[counter]:', quizQuestions.answers[counter]);

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#0000ff" />;
    }
    if (error) {
      return <Text style={styles.errorText}>Erro: {error}</Text>;
    }
    return (
      <GradientWrapper>
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView style={styles.mainContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.gameContainer}>
              <Text style={styles.gtitle}>Questão {counter + 1}</Text>
              <Text style={styles.question}>
                {quizQuestions.issues[counter]}
              </Text>

              <View style={styles.buttonContainer}>
                {quizQuestions.answers.map((answer, index) => (
                  <CustomButton
                    key={index}
                    buttonText={answer.text[counter]}
                    onPress={() => handleAltPress(answer.id)}
                    type="primary"
                    fullWidth
                  />
                ))}
              </View>
            </View>

            <Pressable
              style={styles.restartButton}
              onPress={() => handleNextQuestion()}
            >
              <Text style={styles.restartText}>Próxima Questão</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </GradientWrapper>
    );
  };

  const handleAltPress = async (alt: string) => {
    setUserAnswer(alt);
  };

  const handleNextQuestion = async () => {
    if (userAnswer === '') {
      return;
    }
    let res = await CheckAnswer(userAnswer, counter);
    let count = counter + 1;
    setCounter(count);
    const newResponses = [...userResponses, res];
    setUserResponses(newResponses);
    if (count >= quizQuestions.num_questions) {
      router.push({
        pathname: '../screens/ResultScreen',
        params: { result: JSON.stringify(newResponses) },
      });
    } else {
      setUserAnswer('');
    }
  };

  return <>{renderContent()}</>;
};

export default QuizInProgressScreen;
