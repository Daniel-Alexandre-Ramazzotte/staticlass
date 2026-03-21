import { useRouter } from 'expo-router';
import { XStack, YStack, Button, Text, ScrollView, Input } from 'tamagui';
import { palette, primaryFontA } from 'app/constants/style';
import { ChevronLeft, Search, Trash2 } from 'lucide-react-native';
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';
import { useEffect, useState } from 'react';
import { AppButton } from 'app/components/AppButton';

// esse gerenciador ainda nao esta funcionando, apenas tem o visual aplicado
// O que falta:
// - Listar as questoes disponiveis (fazer a requisicao para o backend)
// - Implementar a funcionalidade dos botoes de editar, visualizar e excluir (fazer as requisicoes para o backend)

type Professor = {
  id: number;
  name: string;
  email: string;
};

export default function ProfessorManager() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading } = useAuth();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [searchValue, setSearchValue] = useState('');
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

    const fetchProfessors = async () => {
      try {
        const result = await api.get(`/users/admin/get-all-professors`);

        setProfessors(result.data as Professor[]);
        setErrorMessage(null);
      } catch (error) {
        console.error('Erro ao buscar professores:', error);
        setErrorMessage('Nao foi possivel carregar os professores.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfessors();
  }, [userId, isAuthLoading]);

  const filteredProfessors = professors.filter((professor) => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return true;
    }

    return (
      professor.name.toLowerCase().includes(normalizedSearch) ||
      professor.email.toLowerCase().includes(normalizedSearch)
    );
  });

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
          Gerenciar Professores
        </Text>
      </XStack>

      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <YStack px="$4" pt="$7" pb="$4" ai="center" gap="$4">
          <AppButton
            width={240}
            height={52}
            type="primary"
            buttonSize="default"
            borderRadius={28}
            backgroundColor="#0e83ca"
            onPress={() => {
              router.push('/(admin)/AddProfessor');
            }}
          >
            <Text
              color={palette.offWhite}
              fontFamily={primaryFontA}
              fontSize={20}
              lineHeight={20}
              mt={2}
            >
              Adicionar Professor
            </Text>
          </AppButton>

          <XStack
            width={'100%'}
            maxWidth={360}
            height={38}
            ai="center"
            backgroundColor="#78aad0"
            px="$2"
            borderRadius={0}
            mt="$2"
          >
            <Search color="#cce0ef" size={14} />
            <Input
              unstyled
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Buscar professor"
              placeholderTextColor="#cce0ef"
              color="#e8f2fa"
              fontSize={12}
              fontFamily={primaryFontA}
              ml="$2"
              flex={1}
            />
          </XStack>

          <YStack
            width={'100%'}
            maxWidth={360}
            backgroundColor="#9cc1dc"
            borderRadius={0}
            overflow="hidden"
            p="$4"
            minHeight={470}
            gap="$2"
          >
            {isLoading && (
              <Text color="#24506e" textAlign="center" py="$2">
                Carregando professores...
              </Text>
            )}

            {!isLoading && errorMessage && (
              <Text color="#8f1f1f" textAlign="center" py="$2">
                {errorMessage}
              </Text>
            )}

            {!isLoading && !errorMessage && filteredProfessors.length === 0 && (
              <Text color="#24506e" textAlign="center" py="$2">
                Nenhum professor cadastrado.
              </Text>
            )}

            {!isLoading &&
              !errorMessage &&
              filteredProfessors.map((professor) => (
                <XStack
                  key={professor.id}
                  ai="center"
                  jc="space-between"
                  gap="$3"
                  mb="$2"
                >
                  <XStack
                    backgroundColor="#4f7ea0"
                    px="$2"
                    py="$1"
                    flex={1}
                    minHeight={32}
                    ai="center"
                  >
                    <Text
                      color={palette.offWhite}
                      fontFamily={primaryFontA}
                      fontSize={24}
                      lineHeight={32}
                      numberOfLines={1}
                    >
                      {professor.name}
                    </Text>
                  </XStack>

                  <Button
                    size="$2"
                    circular
                    backgroundColor="transparent"
                    pressStyle={{ opacity: 0.7 }}
                    icon={<Trash2 color="#3c6b89" size={20} />}
                  />
                </XStack>
              ))}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
