import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { YStack, XStack, Text } from 'tamagui';
import { ActivityIndicator } from 'react-native';
import { Lightbulb, Menu } from '@tamagui/lucide-icons';
import { palette as paletaEstatica, primaryFontA } from 'app/constants/style';
import { useAuth } from 'app/context/AuthContext';
import { AppButton } from 'app/components/AppButton';
import api from 'app/services/api';
import { useTema } from '../../src/context/ThemeContext';

export default function DailyScreen() {
  const router = useRouter();
  const { name } = useAuth();
  const { paleta: palette } = useTema();

  // Estado da questão diária: null = carregando, true = feita, false = disponível
  const [feita, setFeita]         = useState<boolean | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Verifica no backend se o aluno já fez a questão diária hoje.
  // useFocusEffect garante que a checagem acontece sempre que a aba é aberta.
  const verificarStatus = useCallback(() => {
    setCarregando(true);
    api.get('/questions/diaria/status')
      .then((res) => setFeita(res.data.feita))
      .catch(() => setFeita(false))  // em caso de erro, libera para tentar
      .finally(() => setCarregando(false));
  }, []);

  useFocusEffect(verificarStatus);

  // Navega para o quiz de 1 questão e, ao voltar, marca como concluída
  const iniciarDiaria = () => {
    router.push({
      pathname: '/(app)/QuizInProgressScreen',
      params: { qtd: '1', daily: 'true' },
    });
  };

  return (
    <YStack f={1} backgroundColor={palette.offWhite}>
      {/* Cabeçalho */}
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$10"
        pb="$4"
        px="$4"
        ai="center"
        jc="space-between"
      >
        <XStack ai="center" gap="$3">
          <YStack
            width={42}
            height={42}
            borderRadius={21}
            backgroundColor="rgba(255,255,255,0.3)"
            ai="center"
            jc="center"
          >
            <Text color={palette.white} fontWeight="bold" fontSize={16}>
              {name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </YStack>
          <YStack>
            <Text color={palette.white} fontSize={16} fontWeight="bold" fontFamily={primaryFontA}>
              {name || 'Usuário'}
            </Text>
            <Text color="rgba(255,255,255,0.8)" fontSize={12}>Nível 1 ⭐</Text>
          </YStack>
        </XStack>
        <Menu color={palette.white} size={28} />
      </XStack>

      {/* Corpo */}
      <YStack f={1} jc="center" ai="center" px="$6">
        {carregando ? (
          <ActivityIndicator size="large" color={palette.primaryBlue} />
        ) : feita ? (
          /* Aluno já completou a questão diária hoje */
          <YStack
            backgroundColor={palette.primaryGreen}
            borderRadius={16}
            px="$6"
            py="$8"
            ai="center"
            gap="$4"
            width="100%"
          >
            <Text color={palette.white} fontSize={18} fontWeight="bold" textAlign="center">
              Você já fez a sua questão diária!
            </Text>
            <Text fontSize={48}>🏆</Text>
            <Text color="rgba(255,255,255,0.85)" fontSize={13} textAlign="center">
              Volte amanhã para uma nova questão.
            </Text>
          </YStack>
        ) : (
          /* Questão disponível */
          <YStack
            backgroundColor={palette.primaryGreen}
            borderRadius={16}
            px="$6"
            py="$8"
            ai="center"
            gap="$4"
            width="100%"
          >
            <Lightbulb color={palette.white} size={40} />
            <Text color={palette.white} fontSize={20} fontWeight="bold" textAlign="center">
              Questão diária disponível!
            </Text>
            <AppButton
              backgroundColor={palette.red}
              onPress={iniciarDiaria}
            >
              Realizar
            </AppButton>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
