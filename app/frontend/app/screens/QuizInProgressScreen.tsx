import { useEffect, useCallback, useState, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation, Provider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import CheckAnswer from '../services/CheckAnswer';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import styles, {
  palette,
  SELECTED,
  BG,
  BUTTONS,
  PRIMARY,
} from '../constants/style';
import CustomButton from 'app/components/CustomButton/CustomButton';
import GradientWrapper from 'app/components/GradientWrapper/GradientWrapper';
import api from '../services/api';
import { ChevronLeft } from 'lucide-react-native';
import {
  ScrollView,
  XStack,
  YStack,
  Text,
  View,
  Button,
  Progress,
} from 'tamagui';

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

// OBS: Muitos chamados na API, atualmente a cada questao é feita uma chamada para verificar a resposta, e outra para buscar a imagem (se houver).
// Talvez seja interessante otimizar isso futuramente, buscando todas as respostas de uma vez
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
  const [selected, setSelected] = useState(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Função para buscar as questões do quiz, chamada ao iniciar a tela
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

  // Função para buscar a imagem associada à questão atual
  const fetchImage = async (imageName: string) => {
    if (!imageName || imageName === 'null') {
      setCurrentImageBase64(null);
      return;
    }

    setImageLoading(true);
    try {
      // Rota flask para buscar a imagem, passando o nome da imagem como parâmetro
      const response = await api.get(`questions/${imageName}`, {
        responseType: 'blob',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      // Converte o blob recebido para base64 para exibir a imagem
      const fileReaderInstance = new FileReader();
      fileReaderInstance.readAsDataURL(response.data);
      fileReaderInstance.onload = () => {
        const base64data = fileReaderInstance.result as string;
        setCurrentImageBase64(base64data);
        setImageLoading(false);
      };
    } catch (err: any) {
      // Logs
      console.log('URL tentada:', `/uploads/${imageName}`);
      if (err.response) {
        // Resposta recebida do servidor com status de erro
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

  useEffect(() => {
    setSelected(null);
    scaleAnim.setValue(1);
  }, [counter]);

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#0000ff" />;
    }
    if (error) {
      return <Text style={styles.errorText}>Erro: {error}</Text>;
    }
    const progressoAtual = (counter / quizQuestions.num_questions) * 100;
    return (
      <ScrollView>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack f={1} backgroundColor={palette.white}>
          {/*Header*/}
          <XStack
            backgroundColor={palette.primaryBlue}
            pt="$8" // Testar melhor
            pb="$4"
            px="$4"
            ai="center" // Alinhamento vertical
            jc="space-between" // Espaço entre os itens
          >
            {/*Botão de Voltar*/}
            <Button
              size="$3" // Testar tamanhos
              circular
              backgroundColor="transparent"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => router.back()}
              icon={<ChevronLeft color={palette.white} size={28} />} // Ícone de seta para esquerda, Testar tamanhos
            />

            {/*Barra de Progresso*/}
            <Progress
              f={1}
              value={progressoAtual}
              size="$3"
              backgroundColor={palette.white}
            >
              <Progress.Indicator
                backgroundColor={palette.primaryGreen}
                transition={'quicker'}
              />
            </Progress>
          </XStack>

          {/*Conteúdo da Questão*/}
          <YStack minHeight={400} px="$5" pt="$8" gap="$6">
            <Text fontSize={22} fontWeight={'900'} color={palette.offBlack}>
              QUESTÃO {counter + 1}
            </Text>

            {/*Conteudo da Questão */}
            <YStack gap="$4" ai="center">
              <Text style={styles.issueText}>
                {quizQuestions.issues[counter]}
              </Text>
              {/* Verifica se existe uma imagem configurada para a questão atual */}
              {quizQuestions?.image_questions?.[counter] &&
                quizQuestions.image_questions[counter] !== 'null' && (
                  /* Início do Bloco Visual da Imagem */
                  <View style={styles.image}>
                    {imageLoading ? (
                      /* Carregando */
                      <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                      /* Carregado (Só exibe se o base64 existir) */
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

          {/*Alternativas*/}
          <YStack
            backgroundColor={palette.primaryBlue}
            px="$5"
            py="$6"
            gap="$3"
          >
            <YStack style={styles.buttonContainer} gap="$3">
              {quizQuestions.answers.map((answer, index) => (
                <Button
                  key={index}
                  onPress={() => handleAltPress(answer.id)}
                  borderRadius={25}
                  pressStyle={{ opacity: 0.8 }}
                  height="auto"
                  minHeight={50}
                  py="$3"
                  backgroundColor={
                    userAnswer === answer.id
                      ? palette.lightBlue
                      : palette.darkBlue
                  }
                >
                  <XStack f={1} ai="center" w="100%" px="$4">
                    <Text fontWeight="bold" fontSize={18}>
                      {String.fromCharCode(65 + index)}
                      {')  '}
                      {/* Letras A, B, C... */}
                    </Text>

                    <Text
                      color={selected ? palette.darkBlue : palette.offWhite}
                      fontWeight="bold"
                      fontSize={18}
                      width={'100%'}
                    >
                      {answer.text[counter]}
                    </Text>
                  </XStack>
                </Button>
              ))}
            </YStack>
          </YStack>

          <Button
            mt="auto"
            onPress={handleNextQuestion}
            backgroundColor={userAnswer ? palette.primaryGreen : palette.grey}
          >
            <Text color={palette.offWhite} fontWeight="bold" fontSize={26}>
              CONFIRMAR
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    );
  };

  const handleAltPress = async (alt: string) => {
    setUserAnswer(alt);
    console.log(alt);
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
      image_q: quizQuestions.image_questions?.[counter] || null,
      image_s: quizQuestions.image_solutions?.[counter] || null,
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

  return <>{renderContent()}</>;
};

export default QuizInProgressScreen;
