import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { XStack, YStack, Button, Text, ScrollView, Input } from 'tamagui';
import { palette, primaryFontA } from 'app/constants/style';
import { ChevronLeft, Pencil, Search, Trash2, Check, X } from 'lucide-react-native';
import { AppButton } from 'app/components/AppButton';
import api from 'app/services/api';
import { useAuth } from 'app/context/AuthContext';

type Professor = {
  id: number;
  name: string;
  email: string;
  active?: boolean;
};

export default function ProfessorManager() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading } = useAuth();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchProfessors = useCallback(async () => {
    if (isAuthLoading) return;
    if (!userId) {
      setIsLoading(false);
      setErrorMessage('Usuario nao autenticado. Faca login novamente.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await api.get('/users/admin/professors');
      setProfessors(result.data as Professor[]);
      setErrorMessage(null);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      setErrorMessage('Nao foi possivel carregar os professores.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthLoading]);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  useFocusEffect(
    useCallback(() => {
      fetchProfessors();
    }, [fetchProfessors])
  );

  const handleDeleteProfessor = async (id: number) => {
    try {
      await api.delete(`/users/admin/professors/${id}`);
      setConfirmDeleteId(null);
      await fetchProfessors();
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error;
      setErrorMessage(apiMessage || 'Nao foi possivel excluir o professor.');
      setConfirmDeleteId(null);
    }
  };

  const filteredProfessors = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return professors;
    return professors.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedSearch) ||
        p.email.toLowerCase().includes(normalizedSearch)
    );
  }, [searchValue, professors]);

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
        <Text f={1} color="#fff" fontSize="$8" fontWeight="bold" textAlign="center" mr="$6">
          Gerenciar Professores
        </Text>
      </XStack>

      <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        <YStack px="$4" pt="$7" pb="$4" ai="center" gap="$4">
          <AppButton
            width={240}
            height={52}
            type="primary"
            buttonSize="default"
            borderRadius={28}
            backgroundColor="#0e83ca"
            onPress={() => router.push('/(admin)/AddProfessor')}
          >
            <Text color={palette.offWhite} fontFamily={primaryFontA} fontSize={20} lineHeight={20} mt={2}>
              Adicionar Professor
            </Text>
          </AppButton>

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
              <Text color="#24506e" textAlign="center" py="$2">Carregando professores...</Text>
            )}
            {!isLoading && errorMessage && (
              <Text color="#8f1f1f" textAlign="center" py="$2">{errorMessage}</Text>
            )}
            {!isLoading && !errorMessage && filteredProfessors.length === 0 && (
              <Text color="#24506e" textAlign="center" py="$2">Nenhum professor cadastrado.</Text>
            )}

            {!isLoading && !errorMessage && filteredProfessors.map((professor) => (
              <YStack key={professor.id} mb="$2" gap="$1">
                <XStack ai="center" jc="space-between" gap="$3">
                  <XStack backgroundColor="#4f7ea0" px="$2" py="$1" flex={1} minHeight={32} ai="center">
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

                  <XStack gap="$1">
                    <Button
                      size="$2"
                      circular
                      backgroundColor="transparent"
                      pressStyle={{ opacity: 0.7 }}
                      onPress={() =>
                        router.push({
                          pathname: '/(admin)/AddProfessor',
                          params: { id: String(professor.id), name: professor.name, email: professor.email },
                        })
                      }
                      icon={<Pencil color="#3c6b89" size={20} />}
                    />
                    <Button
                      size="$2"
                      circular
                      backgroundColor="transparent"
                      pressStyle={{ opacity: 0.7 }}
                      onPress={() => setConfirmDeleteId(professor.id)}
                      icon={<Trash2 color="#3c6b89" size={20} />}
                    />
                  </XStack>
                </XStack>

                {confirmDeleteId === professor.id && (
                  <XStack ai="center" gap="$2" backgroundColor="#fdecea" px="$2" py="$1" borderRadius={6}>
                    <Text color="#8f1f1f" fontSize={13} flex={1}>Excluir {professor.name}?</Text>
                    <Button
                      size="$2"
                      backgroundColor={palette.red}
                      borderRadius={6}
                      onPress={() => handleDeleteProfessor(professor.id)}
                      icon={<Check color="#fff" size={14} />}
                    >
                      <Text color="#fff" fontSize={12}>Confirmar</Text>
                    </Button>
                    <Button
                      size="$2"
                      backgroundColor="#aaa"
                      borderRadius={6}
                      onPress={() => setConfirmDeleteId(null)}
                      icon={<X color="#fff" size={14} />}
                    >
                      <Text color="#fff" fontSize={12}>Cancelar</Text>
                    </Button>
                  </XStack>
                )}
              </YStack>
            ))}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
