import { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Button,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Image,
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
  image_questions: [string];
  image_solutions: [string];
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
    image_questions: [''],
    image_solutions: [''],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [counter, setCounter] = useState<number>(0);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(
    null
  );
  const [imageLoading, setImageLoading] = useState(false);
  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/questions/rand/${qtd}`);

      if (!response || response.status !== 200) {
        throw new Error('Erro ao buscar a questão');
      }
      const data = await response.data;
      console.log(data);

      await setQuestions({
        num_questions: Number(qtd),
        counter: 0,
        issues: data.issue,
        answers: data.answers,
        correct_answers: data.correct_answer,
        solutions: data.solution,
        image_questions: data.image_questions,
        image_solutions: data.image_solutions,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar a questão');
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
      // A rota deve bater com a que criamos no Flask (/uploads/nome.png)
      const response = await api.get(`questions/${imageName}`, {
        responseType: 'blob', // Importante: diz ao axios que virá um arquivo binário
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      // Agora precisamos converter o Blob para Base64 para o React Native exibir
      const fileReaderInstance = new FileReader();
      fileReaderInstance.readAsDataURL(response.data);
      fileReaderInstance.onload = () => {
        const base64data = fileReaderInstance.result as string;
        setCurrentImageBase64(base64data);
        setImageLoading(false);
      };
    } catch (err: any) {
      // Adicione estes logs detalhados
      console.log('URL tentada:', `/uploads/${imageName}`);
      if (err.response) {
        // O servidor respondeu (ex: 404, 500)
        console.log('Status:', err.response.status);
        console.log('Dados do erro:', err.response.data);
      } else if (err.request) {
        // A requisição foi feita mas não houve resposta (Erro de Network/IP)
        console.log('Sem resposta do servidor. Verifique IP e Porta.');
      } else {
        console.log('Erro na configuração:', err.message);
      }

      setCurrentImageBase64(null);
      setImageLoading(false);
    }
  };

  useEffect(() => {
    const imageName = quizQuestions?.image_questions?.[counter];
    if (imageName) {
      fetchImage(imageName);
    } else {
      setCurrentImageBase64(null);
    }
  }, [counter, quizQuestions]); // Executa quando mudar a pergunta

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
              {/* Verifica se existe uma imagem configurada para a questão atual */}
              {quizQuestions?.image_questions?.[counter] &&
                quizQuestions.image_questions[counter] !== 'null' && (
                  /* Início do Bloco Visual da Imagem */
                  <View style={styles.image}>
                    {imageLoading ? (
                      /* Estado 1: Carregando */
                      <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                      /* Estado 2: Carregado (Só exibe se o base64 existir) */
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
