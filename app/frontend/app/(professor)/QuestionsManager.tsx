import { useRouter } from 'expo-router';
import { XStack, YStack, Button, Text, ScrollView } from 'tamagui';
import { palette } from 'app/constants/style';
import { ChevronLeft, Eye, Pencil, Trash2 } from 'lucide-react-native';
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';
import { useEffect, useState } from 'react';
import { AppButton } from 'app/components/AppButton';

// esse gerenciador ainda nao esta funcionando, apenas tem o visual aplicado
// O que falta:
// - Listar as questoes disponiveis (fazer a requisicao para o backend)
// - Implementar a funcionalidade dos botoes de editar, visualizar e excluir (fazer as requisicoes para o backend)

export default function QuestionsManager() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading, role } = useAuth();
  type ProfessorQuestion = {
    id: number;
    issue: string;
  };

  const [questions, setQuestions] = useState<ProfessorQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!userId) {
      setIsLoading(false);
      setErrorMessage('Usuario nao autenticado. Faca login novamente.');
      return;
    }

    setIsLoading(true);

    const fetchQuestions = async () => {
      try {
        if (role === 'professor') {
          const result = await api.get(`/questions/professor/${userId}`);
          setQuestions(result.data as ProfessorQuestion[]);
        } else if (role === 'admin') {
          const result = await api.get(`/questions/admin/${userId}`);
          setQuestions(result.data as ProfessorQuestion[]);
        }
      } catch (error) {
        console.error('Erro ao buscar questões:', error);
        setErrorMessage('Nao foi possivel carregar as questoes.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [userId, isAuthLoading]);

  return (
    <YStack f={1} backgroundColor="#d6d6db">
      {/*Header*/}
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$8" // Testar melhor
        pb="$4"
        px="$4"
        ai="center"
        jc="flex-start"
        width={'100%'}
        gap="$2"
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
        <YStack px="$4" pt="$6" pb="$4" ai="center" gap="$6">
          <YStack
            width={'100%'}
            maxWidth={360}
            backgroundColor="#9ec1db"
            borderRadius={10}
            overflow="hidden"
            p="$4"
            gap="$3"
          >
            <Text
              backgroundColor="#74add1"
              color={palette.offWhite}
              fontWeight="700"
              fontSize="$7"
              textAlign="center"
              py="$2"
              borderRadius={8}
              mt={-8}
              mx={-8}
              mb="$2"
            >
              Questoes
            </Text>

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

            {!isLoading && !errorMessage && questions.length === 0 && (
              <Text color={palette.offWhite} textAlign="center" py="$2">
                Nenhuma questao cadastrada para este professor.
              </Text>
            )}

            {!isLoading &&
              !errorMessage &&
              questions.map((question) => (
                <XStack
                  key={question.id}
                  ai="center"
                  jc="space-between"
                  gap="$2"
                >
                  <YStack
                    backgroundColor="#4f7ea0"
                    px="$3"
                    py="$2"
                    borderRadius={4}
                    flex={1}
                    gap="$1"
                  >
                    <Text color={palette.offWhite} fontWeight="700">
                      Questao {question.id}
                    </Text>
                    <Text color={palette.offWhite} numberOfLines={2}>
                      {question.issue}
                    </Text>
                  </YStack>

                  <XStack ai="center" gap="$2" mr="$2">
                    <Button
                      size="$2"
                      circular
                      backgroundColor="transparent"
                      pressStyle={{ opacity: 0.7 }}
                      icon={<Pencil color="#24506e" size={16} />}
                    />
                    <Button
                      size="$2"
                      circular
                      backgroundColor="transparent"
                      pressStyle={{ opacity: 0.7 }}
                      icon={<Eye color="#24506e" size={16} />}
                    />
                  </XStack>

                  <Button
                    size="$2"
                    circular
                    backgroundColor="transparent"
                    pressStyle={{ opacity: 0.7 }}
                    icon={<Trash2 color="#24506e" size={18} />}
                  />
                </XStack>
              ))}
          </YStack>

          <AppButton
            backgroundColor={palette.darkBlue}
            onPress={() => router.push('/(professor)/AddNewQuestion')}
          >
            Adicionar Nova Questão
          </AppButton>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
