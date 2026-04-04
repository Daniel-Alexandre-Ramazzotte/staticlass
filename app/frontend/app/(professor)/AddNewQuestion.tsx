import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Input,
  YStack,
  XStack,
  ZStack,
  Text,
  ScrollView,
  Button,
} from 'tamagui';
import { palette } from 'app/constants/style';
import api from 'app/services/api';
import { AppButton } from 'app/components/AppButton';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from 'app/context/AuthContext';

type Alternative = {
  letter: string;
  text: string;
  is_correct: boolean;
};

type QuestionDetail = {
  id: number;
  issue: string;
  correct_answer: string;
  solution: string | null;
  difficulty: number | null;
  section: string | null;
  alternatives: Alternative[];
};

export default function AddNewQuestion() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { userId } = useAuth();

  const questionId = params.id ? Number(params.id) : null;
  const isEditing = useMemo(() => questionId !== null && !Number.isNaN(questionId), [questionId]);

  const [issue, setIssue] = useState('');
  const [altA, setAltA] = useState('');
  const [altB, setAltB] = useState('');
  const [altC, setAltC] = useState('');
  const [altD, setAltD] = useState('');
  const [altE, setAltE] = useState('');
  const [correctAlt, setCorrectAlt] = useState('');
  const [section, setSection] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [solution, setSolution] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  useEffect(() => {
    if (!isEditing || questionId === null) {
      return;
    }

    const loadQuestion = async () => {
      setLoadingQuestion(true);
      try {
        const response = await api.get(`/questions/${questionId}`);
        const question = response.data as QuestionDetail;
        setIssue(question.issue || '');
        setCorrectAlt(question.correct_answer || '');
        setSection(question.section || '');
        setDifficulty(question.difficulty ? String(question.difficulty) : '');
        setSolution(question.solution || '');

        const alternativesByLetter = new Map(
          (question.alternatives || []).map((alternative) => [alternative.letter, alternative.text])
        );
        setAltA(alternativesByLetter.get('A') || '');
        setAltB(alternativesByLetter.get('B') || '');
        setAltC(alternativesByLetter.get('C') || '');
        setAltD(alternativesByLetter.get('D') || '');
        setAltE(alternativesByLetter.get('E') || '');
      } catch (error) {
        console.error('Erro ao carregar questão:', error);
        alert('Nao foi possivel carregar a questao.');
        router.back();
      } finally {
        setLoadingQuestion(false);
      }
    };

    loadQuestion();
  }, [isEditing, questionId, router]);

  const handleQuestionSubmit = async () => {
    if (!userId) {
      alert('Usuario nao autenticado. Faca login novamente.');
      return;
    }

    if (!issue || !altA || !altB || !altC || !altD || !altE || !correctAlt || !solution) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const payload = {
        id: questionId ?? undefined,
        issue,
        correct_answer: correctAlt.toUpperCase(),
        solution,
        section: section || undefined,
        difficulty: difficulty ? Number(difficulty) : undefined,
        alternatives: [
          { letter: 'A', text: altA },
          { letter: 'B', text: altB },
          { letter: 'C', text: altC },
          { letter: 'D', text: altD },
          { letter: 'E', text: altE },
        ],
      };

      const response = isEditing
        ? await api.put('/questions/update', payload)
        : await api.post('/questions/add', payload, {
            headers: { 'Content-Type': 'application/json' },
          });

      if (response.status === 200 || response.status === 201) {
        alert(isEditing ? 'Questão atualizada com sucesso!' : 'Questão adicionada com sucesso!');
        router.replace('/(professor)/QuestionsManager');
      } else {
        alert('Erro ao salvar questão. Tente novamente.');
      }
    } catch (error: any) {
      const apiError = error?.response?.data?.error;
      console.error('Erro ao salvar questão:', error?.response?.data ?? error);
      alert(apiError ? `Erro: ${apiError}` : 'Erro ao salvar questão. Tente novamente.');
    }
  };

  return (
    <ZStack f={1}>
      <YStack
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
        backgroundColor={palette.backgroundLight}
        opacity={0.2}
        pointerEvents="none"
      />
      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <YStack>
          <XStack
            backgroundColor={palette.primaryBlue}
            pt="$8"
            pb="$4"
            px="$4"
            ai="center"
            jc="space-between"
            width="100%"
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
              {isEditing ? 'Editar Questão' : 'Gerenciar Questões'}
            </Text>
          </XStack>

          <YStack ai="center" gap="$4" width="70%" alignSelf="center" py="$4">
            {loadingQuestion && (
              <Text color={palette.darkBlue}>Carregando questão...</Text>
            )}

            <YStack width="100%" gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Seção:
              </Text>
              <Input
                width="94%"
                alignSelf="flex-end"
                marginTop="$1"
                value={section}
                onChangeText={setSection}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <YStack width="100%" gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Enunciado:
              </Text>
              <Input
                width="94%"
                alignSelf="flex-end"
                marginTop="$1"
                value={issue}
                onChangeText={setIssue}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            {[
              ['Alternativa A:', altA, setAltA],
              ['Alternativa B:', altB, setAltB],
              ['Alternativa C:', altC, setAltC],
              ['Alternativa D:', altD, setAltD],
              ['Alternativa E:', altE, setAltE],
            ].map(([label, value, setter]) => (
              <YStack width="100%" gap={0} key={label}>
                <Text
                  backgroundColor={palette.darkBlue}
                  color={palette.offWhite}
                  padding="$1"
                  width="40%"
                  borderRadius={4}
                  alignSelf="flex-start"
                  marginLeft="$1"
                  textAlign="left"
                  fontWeight="bold"
                >
                  {label}
                </Text>
                <Input
                  width="94%"
                  alignSelf="flex-end"
                  marginTop="$1"
                  value={value as string}
                  onChangeText={setter as (value: string) => void}
                  backgroundColor={palette.backgroundLight}
                  opacity={0.3}
                  color={palette.offWhite}
                />
              </YStack>
            ))}

            <YStack width="100%" gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Dificuldade:
              </Text>
              <XStack width="94%" alignSelf="flex-end" marginTop="$1" gap="$2">
                {[
                  { value: '1', label: 'Fácil' },
                  { value: '2', label: 'Médio' },
                  { value: '3', label: 'Difícil' },
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    flex={1}
                    size="$3"
                    backgroundColor={difficulty === value ? palette.primaryGreen : palette.backgroundLight}
                    borderWidth={1}
                    borderColor={difficulty === value ? palette.primaryGreen : palette.darkBlue}
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => setDifficulty(value)}
                  >
                    <Text
                      color={difficulty === value ? palette.offWhite : palette.darkBlue}
                      fontWeight="bold"
                      fontSize="$4"
                    >
                      {label}
                    </Text>
                  </Button>
                ))}
              </XStack>
            </YStack>

            <YStack width="100%" gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Resposta correta:
              </Text>
              <XStack width="94%" alignSelf="flex-end" marginTop="$1" gap="$2">
                {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                  <Button
                    key={letter}
                    flex={1}
                    size="$3"
                    backgroundColor={correctAlt === letter ? palette.primaryGreen : palette.backgroundLight}
                    borderWidth={1}
                    borderColor={correctAlt === letter ? palette.primaryGreen : palette.darkBlue}
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => setCorrectAlt(letter)}
                  >
                    <Text
                      color={correctAlt === letter ? palette.offWhite : palette.darkBlue}
                      fontWeight="bold"
                      fontSize="$5"
                    >
                      {letter}
                    </Text>
                  </Button>
                ))}
              </XStack>
            </YStack>

            <YStack width="100%" gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Solução:
              </Text>
              <Input
                width="94%"
                alignSelf="flex-end"
                marginTop="$1"
                value={solution}
                onChangeText={setSolution}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <AppButton
              backgroundColor={palette.darkBlue}
              onPress={handleQuestionSubmit}
            >
              {isEditing ? 'Salvar Alterações' : 'Adicionar Nova Questão'}
            </AppButton>
          </YStack>
        </YStack>
      </ScrollView>
    </ZStack>
  );
}
