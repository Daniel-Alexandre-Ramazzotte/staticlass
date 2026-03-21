import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { XStack, YStack, Button, Text, ScrollView, Input } from 'tamagui';
import { palette, primaryFontA } from 'app/constants/style';
import { ChevronLeft, Search, Trash2 } from 'lucide-react-native';
import { AppButton } from 'app/components/AppButton';
import api from 'app/services/api';
import { useAuth } from 'app/context/AuthContext';

type Student = {
  id: number;
  name: string;
  email: string;
};

export default function AlunoManager() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
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

    const fetchStudents = async () => {
      try {
        const result = await api.get('/users/admin/get-all-alunos');
        setStudents(result.data as Student[]);
        setErrorMessage(null);
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
        setErrorMessage('Nao foi possivel carregar os alunos.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [userId, isAuthLoading]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return students;
    }

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch)
    );
  }, [searchValue, students]);

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
          color={palette.white}
          fontSize="$8"
          fontWeight="bold"
          textAlign="center"
          mr="$6"
        >
          Gerenciar Alunos
        </Text>
      </XStack>

      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <YStack px="$4" pt="$7" pb="$4" ai="center" gap="$4">
          {/*}
          <AppButton
            width={240}
            height={52}
            type="primary"
            buttonSize="default"
            borderRadius={28}
            backgroundColor="#3f6f92"
            onPress={() => {}}
          >
            <Text
              color={palette.offWhite}
              fontFamily={primaryFontA}
              fontSize={20}
              lineHeight={20}
              mt={2}
            >
              Adicionar Aluno
            </Text>
          </AppButton>*/}

          <XStack
            width="100%"
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
              placeholder="Buscar aluno"
              placeholderTextColor="#cce0ef"
              color="#e8f2fa"
              fontSize={12}
              fontFamily={primaryFontA}
              ml="$2"
              flex={1}
            />
          </XStack>

          <YStack
            width="100%"
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
                Carregando alunos...
              </Text>
            )}

            {!isLoading && errorMessage && (
              <Text color="#8f1f1f" textAlign="center" py="$2">
                {errorMessage}
              </Text>
            )}

            {!isLoading && !errorMessage && filteredStudents.length === 0 && (
              <Text color="#24506e" textAlign="center" py="$2">
                Nenhum aluno encontrado.
              </Text>
            )}

            {!isLoading &&
              !errorMessage &&
              filteredStudents.map((student) => (
                <XStack
                  key={student.id}
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
                      {student.name}
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
