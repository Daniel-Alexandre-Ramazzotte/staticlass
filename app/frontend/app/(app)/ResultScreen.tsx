import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { YStack, XStack, Text, View } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from 'app/constants/style';
import api from 'app/services/api';

type QuizResultItem = {
  message: 'correct' | 'incorrect';
  userAnswer?: string;
  id: number;
  correct_answer: string;
  solution: string | null;
  image_q: string | null;
  image_s: string | null;
};

type ListSubmissionSummary = {
  submitted_at: string;
  score_pct: number;
  student_status: 'entregue' | 'entregue_fora_do_prazo';
  is_late: boolean;
  correct_count: number;
  total_questions: number;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

const ResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawResult = firstParam(params.result);
  const resultado = useMemo<QuizResultItem[]>(
    () => (rawResult ? JSON.parse(rawResult) : []),
    [rawResult],
  );
  const capituloId = firstParam(params.chapter_id);
  const dificuldade = firstParam(params.difficulty);
  const ehDiaria = firstParam(params.daily) === 'true';
  const listId = firstParam(params.list_id);
  const listTitle = firstParam(params.list_title);
  const listMode = firstParam(params.list_mode) === '1';
  const submissionView = firstParam(params.submission_view) === '1';
  const isListMode = Boolean(listId) && (listMode || submissionView);

  const acertos = resultado.filter((r) => r.message === 'correct').length;
  const total = resultado.length;
  const [xpGanho, setXpGanho] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const [xpLoading, setXpLoading] = useState(!submissionView);
  const [listSummary, setListSummary] = useState<ListSubmissionSummary | null>(null);
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;

    const processar = async () => {
      if (isListMode && listId) {
        if (submissionView) {
          const response = await api.get<ListSubmissionSummary & { title?: string }>(`/lists/${listId}/me`);
          setListSummary(response.data);
          setXpLoading(false);
          return;
        }

        const responses = resultado.map((resposta) => ({
          question_id: resposta.id,
          selected_answer: resposta.userAnswer ?? null,
          is_correct: resposta.message === 'correct',
        }));

        const submitResponse = await api.post<ListSubmissionSummary>(`/lists/${listId}/submit`, {
          responses,
          correct_count: acertos,
          total_questions: total,
        });
        setListSummary({
          ...submitResponse.data,
          correct_count: acertos,
          total_questions: total,
        });

        try {
          const xpResponse = await api.post('/gamification/record-session', {
            acertos,
            total,
            capitulo_id: capituloId ? Number(capituloId) : undefined,
            dificuldade: dificuldade ? Number(dificuldade) : undefined,
          });
          setXpGanho(xpResponse.data?.xp_ganho ?? null);
          setStreak(xpResponse.data?.streak ?? null);
          setMultiplier(xpResponse.data?.multiplier ?? null);
        } catch {
          setXpGanho(acertos * 10 + 20);
          setStreak(null);
          setMultiplier(null);
        } finally {
          setXpLoading(false);
        }
        return;
      }

      if (total > 0) {
        try {
          const response = await api.post('/gamification/record-session', {
            acertos,
            total,
            capitulo_id: capituloId ? Number(capituloId) : undefined,
            dificuldade: dificuldade ? Number(dificuldade) : undefined,
          });
          setXpGanho(response.data?.xp_ganho ?? null);
          setStreak(response.data?.streak ?? null);
          setMultiplier(response.data?.multiplier ?? null);
        } catch {
          setXpGanho(acertos * 10 + 20);
          setStreak(null);
          setMultiplier(null);
        } finally {
          setXpLoading(false);
        }
      } else {
        setXpLoading(false);
      }

      if (ehDiaria) {
        api.post('/questions/diaria/marcar').catch(() => undefined);
      }
    };

    processar().catch(() => {
      setXpLoading(false);
    });
  }, [acertos, capituloId, dificuldade, ehDiaria, isListMode, listId, resultado, submissionView, total]);

  const displayCorrect = listSummary?.correct_count ?? acertos;
  const displayTotal = listSummary?.total_questions ?? total;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.primaryBlue }}>
      <Stack.Screen options={{ headerShown: false }} />

      <YStack f={1} ai="center" jc="center" px="$5">
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

        <YStack
          backgroundColor={palette.darkBlue}
          width="100%"
          borderRadius={20}
          pt="$8"
          pb="$6"
          px="$6"
          ai="center"
        >
          {isListMode && listTitle ? (
            <Text fontSize={16} fontWeight="700" color="rgba(255,255,255,0.9)" mb="$2">
              {listTitle}
            </Text>
          ) : null}
          <Text fontSize={56} fontWeight="900" color={palette.white} mb="$1">
            {displayCorrect}/{displayTotal}
          </Text>
          {isListMode && listSummary ? (
            <YStack ai="center" mb="$4" gap="$1">
              <Text fontSize={18} color={palette.primaryGreen} fontWeight="700">
                {listSummary.score_pct.toFixed(0)}%
              </Text>
              {listSummary.is_late || listSummary.student_status === 'entregue_fora_do_prazo' ? (
                <Text fontSize={13} color="#ffcf99" fontWeight="700">
                  Fora do prazo
                </Text>
              ) : null}
              <Text fontSize={12} color="rgba(255,255,255,0.8)">
                Concluída em {new Date(listSummary.submitted_at).toLocaleString('pt-BR')}
              </Text>
            </YStack>
          ) : xpLoading ? (
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
            {resultado.map((resposta, indice) => {
              const correto = resposta.message === 'correct';
              return (
                <XStack key={indice} jc="space-between" ai="center" py="$2" width="100%">
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
