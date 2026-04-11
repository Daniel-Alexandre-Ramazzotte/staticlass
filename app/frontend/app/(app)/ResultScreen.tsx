import React, { useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { YStack, XStack, Text, View } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from 'app/constants/style';
import api from 'app/services/api';

const ResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Resultado recebido do QuizInProgressScreen como JSON serializado
  const resultado = params.result ? JSON.parse(params.result as string) : [];

  // Parâmetros opcionais de filtro usados no quiz — enviados ao backend ao salvar
  const capitulo_id  = params.chapter_id  ? Number(params.chapter_id)  : undefined;
  const dificuldade  = params.difficulty  ? Number(params.difficulty)  : undefined;
  const ehDiaria     = params.daily === 'true';

  const acertos = resultado.filter((r: any) => r.message === 'correct').length;
  const total   = resultado.length;
  const [xpGanho, setXpGanho] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const [xpLoading, setXpLoading] = useState(true);

  // Controle para não enviar o resultado mais de uma vez (evita re-render duplo)
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current || total === 0) return;
    enviado.current = true;

    api.post('/gamification/record-session', {
      acertos,
      total,
      capitulo_id,
      dificuldade,
    })
      .then((response) => {
        setXpGanho(response.data?.xp_ganho ?? null);
        setStreak(response.data?.streak ?? null);
        setMultiplier(response.data?.multiplier ?? null);
      })
      .catch(() => {
        setXpGanho(acertos * 10 + 20);
        setStreak(null);
        setMultiplier(null);
      })
      .finally(() => setXpLoading(false));

    // Se era a questão diária, marca como concluída para hoje
    if (ehDiaria) {
      api.post('/questions/diaria/marcar').catch(() => {});
    }
  }, [acertos, capitulo_id, dificuldade, ehDiaria, total]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.primaryBlue }}>
      <Stack.Screen options={{ headerShown: false }} />

      <YStack f={1} ai="center" jc="center" px="$5">
        {/* Badge de resumo */}
        <YStack
          backgroundColor={palette.primaryGreen}
          px="$8"
          py="$3"
          borderRadius={14}
          position="relative"
          ai="center"
          zIndex={10}
          mb={-14}
        >
          <YStack
            position="absolute"
            top={-18}
            width={36}
            height={36}
            borderRadius={18}
            backgroundColor={palette.primaryGreen}
            ai="center"
            jc="center"
          >
            <View width={10} height={10} borderRadius={5} backgroundColor={palette.white} />
          </YStack>
          <Text fontSize={20} fontWeight="900" color={palette.white} mt="$1">
            RESUMO
          </Text>
        </YStack>

        {/* Card de pontuação */}
        <YStack
          backgroundColor={palette.darkBlue}
          width="100%"
          borderRadius={20}
          pt="$8"
          pb="$6"
          px="$6"
          ai="center"
        >
          <Text fontSize={56} fontWeight="900" color={palette.white} mb="$1">
            {acertos}/{total}
          </Text>
          {xpLoading ? (
            <Text fontSize={15} color="rgba(255,255,255,0.6)" mb="$4">
              Calculando XP...
            </Text>
          ) : (
            <YStack ai="center" mb="$4" gap="$1">
              <Text fontSize={20} fontWeight="bold" color={palette.primaryGreen}>
                +{xpGanho ?? 0} XP
              </Text>
              {multiplier && multiplier >= 1.25 ? (
                <XStack gap="$3" ai="center" flexWrap="wrap" jc="center">
                  <Text fontSize={12} color="rgba(255,255,255,0.8)">
                    Sequência: {streak} dias
                  </Text>
                  <Text fontSize={12} color={palette.primaryGreen} fontWeight="700">
                    Multiplicador {multiplier === 1.5 ? '1.5x' : '1.25x'} aplicado
                  </Text>
                </XStack>
              ) : streak !== null ? (
                <Text fontSize={12} color="rgba(255,255,255,0.8)">
                  Sequência: {streak} dias
                </Text>
              ) : null}
            </YStack>
          )}

          <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
            {resultado.map((resposta: any, indice: number) => {
              const correto = resposta.message === 'correct';
              return (
                <XStack
                  key={indice}
                  jc="space-between"
                  ai="center"
                  py="$2"
                  width="100%"
                >
                  <Text
                    fontSize={15}
                    fontWeight="bold"
                    color={correto ? palette.primaryGreen : palette.red}
                  >
                    Questão {String(indice + 1).padStart(2, '0')}:
                  </Text>
                  <Text
                    color={palette.white}
                    textDecorationLine="underline"
                    fontWeight="bold"
                    fontSize={14}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/SolutionScreen',
                        params: { questionData: JSON.stringify(resposta) },
                      })
                    }
                  >
                    Resolução
                  </Text>
                </XStack>
              );
            })}
          </ScrollView>
        </YStack>
      </YStack>

      {/* Botão de voltar */}
      <YStack
        backgroundColor={palette.red}
        width="100%"
        py="$5"
        ai="center"
        onPress={() => router.replace('/(tabs)/home')}
        pressStyle={{ opacity: 0.85 }}
      >
        <Text color={palette.white} fontWeight="bold" fontSize={20}>
          VOLTAR
        </Text>
      </YStack>
    </SafeAreaView>
  );
};

export default ResultScreen;
