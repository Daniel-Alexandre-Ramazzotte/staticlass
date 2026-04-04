import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { XStack, YStack, Button, Text, ScrollView, Input } from 'tamagui';
import { palette } from 'app/constants/style';
import { ChevronLeft, Eye, Pencil, Search, Trash2 } from 'lucide-react-native';
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';
import { AppButton } from 'app/components/AppButton';

type Alternative = {
  letter: string;
  text: string;
  is_correct: boolean;
};

type QuestionListItem = {
  id: number;
  issue?: string;
  enunciado?: string;
  difficulty?: number | null;
  chapter_id?: number | null;
  capitulo?: string | null;
  topico?: string | null;
};

type QuestionDetail = {
  id: number;
  issue: string;
  correct_answer: string;
  solution: string | null;
  difficulty: number | null;
  section: string | null;
  chapter_name?: string | null;
  chapter_number?: number | null;
  topic_name?: string | null;
  capitulo?: string | null;
  topico?: string | null;
  alternatives: Alternative[];
};

type Chapter = {
  id: number;
  name: string;
  number: number;
};

export default function QuestionsManager() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading, role } = useAuth();
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDetail | null>(null);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    try {
      if (role === 'admin') {
        const params: Record<string, number> = { page: 1, per_page: 100 };
        if (chapterId !== null) params.chapter_id = chapterId;
        if (difficulty !== null) params.difficulty = difficulty;
        const result = await api.get('/admin/questoes', { params });
        setQuestions(result.data.questoes as QuestionListItem[]);
      } else {
        const result = await api.get(`/questions/professor/${userId}`);
        setQuestions(result.data as QuestionListItem[]);
      }
      setErrorMessage(null);
    } catch (error) {
      console.error('Erro ao buscar questões:', error);
      setErrorMessage('Nao foi possivel carregar as questoes.');
    } finally {
      setIsLoading(false);
    }
  }, [chapterId, difficulty, role, userId]);

  useEffect(() => {
    api.get('/questions/chapters').then((result) => setChapters(result.data as Chapter[])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!userId) {
      setIsLoading(false);
      setErrorMessage('Usuario nao autenticado. Faca login novamente.');
      return;
    }
    fetchQuestions();
  }, [userId, isAuthLoading, fetchQuestions]);

  const handleViewQuestion = async (questionId: number) => {
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(null);
      setSelectedQuestion(null);
      return;
    }

    setSelectedQuestionId(questionId);
    setDetailLoading(true);
    try {
      const result = await api.get(`/questions/${questionId}`);
      setSelectedQuestion(result.data as QuestionDetail);
      setErrorMessage(null);
    } catch (error) {
      console.error('Erro ao buscar detalhes da questão:', error);
      setErrorMessage('Nao foi possivel carregar os detalhes da questao.');
      setSelectedQuestionId(null);
      setSelectedQuestion(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    Alert.alert(
      'Excluir questão',
      'Deseja remover esta questão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/questions/${questionId}`);
              if (selectedQuestionId === questionId) {
                setSelectedQuestionId(null);
                setSelectedQuestion(null);
              }
              await fetchQuestions();
            } catch (error: any) {
              const apiMessage = error?.response?.data?.error;
              setErrorMessage(apiMessage || 'Nao foi possivel excluir a questao.');
            }
          },
        },
      ]
    );
  };

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return questions;
    }
    return questions.filter((question) => {
      const title = (question.issue || question.enunciado || '').toLowerCase();
      return title.includes(normalizedSearch);
    });
  }, [questions, searchValue]);

  return (
    <YStack f={1} backgroundColor="#d6d6db">
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$8"
        pb="$4"
        px="$4"
        ai="center"
        jc="flex-start"
        width="100%"
        gap="$2"
      >
        <Button
          size="$3"
          circular
          backgroundColor="transparent"
          pressStyle={{ opacity: 0.7 }}
          onPress={() => router.back()}
          icon={<ChevronLeft color={palette.white} size={28} />}
        />
        <Text
          f={1}
          color="#fff"
          fontSize="$8"
          fontWeight="bold"
          textAlign="center"
          mr="$6"
        >
          Gerenciar Questões
        </Text>
      </XStack>

      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <YStack px="$4" pt="$6" pb="$4" ai="center" gap="$4">
          <AppButton
            backgroundColor={palette.darkBlue}
            onPress={() => router.push('/(professor)/AddNewQuestion')}
          >
            Adicionar Nova Questão
          </AppButton>

          <XStack
            width="100%"
            maxWidth={420}
            height={38}
            ai="center"
            backgroundColor="#78aad0"
            px="$2"
            borderRadius={0}
          >
            <Search color="#cce0ef" size={14} />
            <Input
              unstyled
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Buscar questão"
              placeholderTextColor="#cce0ef"
              color="#e8f2fa"
              fontSize={12}
              ml="$2"
              flex={1}
            />
          </XStack>

          {role === 'admin' && (
            <XStack width="100%" maxWidth={420} gap="$2" flexWrap="wrap">
              <Button
                size="$2"
                backgroundColor={chapterId === null ? palette.primaryBlue : palette.darkBlue}
                color={palette.offWhite}
                onPress={() => setChapterId(null)}
              >
                Todos capítulos
              </Button>
              {chapters.map((chapter) => (
                <Button
                  key={chapter.id}
                  size="$2"
                  backgroundColor={chapterId === chapter.id ? palette.primaryBlue : palette.darkBlue}
                  color={palette.offWhite}
                  onPress={() => setChapterId(chapterId === chapter.id ? null : chapter.id)}
                >
                  {`Cap. ${chapter.number}`}
                </Button>
              ))}
              <Button
                size="$2"
                backgroundColor={difficulty === null ? palette.primaryGreen : palette.darkBlue}
                color={palette.offWhite}
                onPress={() => setDifficulty(null)}
              >
                Todas dificuldades
              </Button>
              {[1, 2, 3].map((level) => (
                <Button
                  key={level}
                  size="$2"
                  backgroundColor={difficulty === level ? palette.primaryGreen : palette.darkBlue}
                  color={palette.offWhite}
                  onPress={() => setDifficulty(difficulty === level ? null : level)}
                >
                  {level === 1 ? 'Fácil' : level === 2 ? 'Médio' : 'Difícil'}
                </Button>
              ))}
            </XStack>
          )}

          <YStack
            width="100%"
            maxWidth={420}
            backgroundColor="#9ec1db"
            borderRadius={10}
            overflow="hidden"
            p="$4"
            gap="$3"
          >
            {isLoading && (
              <Text color={palette.offWhite} textAlign="center" py="$2">
                Carregando questoes...
              </Text>
            )}

            {!isLoading && errorMessage && (
              <Text color="#8f1f1f" textAlign="center" py="$2">
                {errorMessage}
              </Text>
            )}

            {!isLoading && !errorMessage && filteredQuestions.length === 0 && (
              <Text color={palette.offWhite} textAlign="center" py="$2">
                Nenhuma questao encontrada.
              </Text>
            )}

            {!isLoading &&
              !errorMessage &&
              filteredQuestions.map((question) => {
                const title = question.issue || question.enunciado || '';
                const expanded = selectedQuestionId === question.id;

                return (
                  <YStack key={question.id} gap="$2" mb="$2">
                    <XStack ai="center" jc="space-between" gap="$2">
                      <YStack
                        backgroundColor="#4f7ea0"
                        px="$3"
                        py="$2"
                        borderRadius={4}
                        flex={1}
                        gap="$1"
                      >
                        <Text color={palette.offWhite} fontWeight="700">
                          Questão {question.id}
                        </Text>
                        <Text color={palette.offWhite} numberOfLines={2}>
                          {title}
                        </Text>
                      </YStack>

                      <XStack ai="center" gap="$1">
                        <Button
                          size="$2"
                          circular
                          backgroundColor="transparent"
                          pressStyle={{ opacity: 0.7 }}
                          onPress={() => router.push({ pathname: '/(professor)/AddNewQuestion', params: { id: String(question.id) } })}
                          icon={<Pencil color="#24506e" size={16} />}
                        />
                        <Button
                          size="$2"
                          circular
                          backgroundColor="transparent"
                          pressStyle={{ opacity: 0.7 }}
                          onPress={() => handleViewQuestion(question.id)}
                          icon={<Eye color="#24506e" size={16} />}
                        />
                        <Button
                          size="$2"
                          circular
                          backgroundColor="transparent"
                          pressStyle={{ opacity: 0.7 }}
                          onPress={() => handleDeleteQuestion(question.id)}
                          icon={<Trash2 color="#24506e" size={18} />}
                        />
                      </XStack>
                    </XStack>

                    {expanded && (
                      <YStack backgroundColor="#dbeaf4" borderRadius={8} px="$3" py="$3" gap="$2">
                        {detailLoading || !selectedQuestion ? (
                          <Text color="#24506e">Carregando detalhes...</Text>
                        ) : (
                          <>
                            <Text color="#24506e" fontWeight="700">
                              {selectedQuestion.issue}
                            </Text>
                            <Text color="#24506e">
                              {`Dificuldade: ${selectedQuestion.difficulty ?? 'Não informada'}`}
                            </Text>
                            <Text color="#24506e">
                              {`Capítulo: ${selectedQuestion.chapter_name || selectedQuestion.capitulo || 'Não informado'}`}
                            </Text>
                            <Text color="#24506e">
                              {`Tópico: ${selectedQuestion.topic_name || selectedQuestion.topico || 'Não informado'}`}
                            </Text>
                            <Text color="#24506e">
                              {`Seção: ${selectedQuestion.section || 'Não informada'}`}
                            </Text>
                            {selectedQuestion.alternatives.map((alternative) => (
                              <Text
                                key={alternative.letter}
                                color={alternative.is_correct ? palette.primaryGreen : '#24506e'}
                                fontWeight={alternative.is_correct ? '700' : '400'}
                              >
                                {`${alternative.letter}) ${alternative.text}`}
                              </Text>
                            ))}
                            <Text color="#24506e" fontWeight="700">
                              {`Resposta correta: ${selectedQuestion.correct_answer}`}
                            </Text>
                            {selectedQuestion.solution && (
                              <Text color="#24506e">{`Solução: ${selectedQuestion.solution}`}</Text>
                            )}
                          </>
                        )}
                      </YStack>
                    )}
                  </YStack>
                );
              })}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
