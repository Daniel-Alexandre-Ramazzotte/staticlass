import React, { useState, useCallback } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { YStack, XStack, Text, Stack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette as paletaEstatica, primaryFontA } from 'app/constants/style';
import { useTema } from '../../src/context/ThemeContext';
import api from 'app/services/api';

type Estatisticas = {
  total_quizzes:     number;
  total_acertos:     number;
  total_questoes:    number;
  media_pct:         number;
  capitulo_favorito: string | null;
};

type Tentativa = {
  id:          number;
  acertos:     number;
  total:       number;
  dificuldade: number | null;
  capitulo:    string | null;
  criado_em:   string;
};

const ROTULO_DIFICULDADE: Record<number, string> = {
  1: 'Fácil',
  2: 'Médio',
  3: 'Difícil',
};

function formatarData(isoString: string): string {
  const data = new Date(isoString);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function CardResumo({
  label,
  valor,
  cor,
  palette,
}: {
  label: string;
  valor: string;
  cor: string;
  palette: any;
}) {
  return (
    <YStack
      f={1}
      backgroundColor={palette.white}
      borderRadius={12}
      p="$3"
      ai="center"
      style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4 }}
    >
      <Text fontSize={22} fontWeight="900" color={cor}>{valor}</Text>
      <Text fontSize={11} color="rgba(0,0,0,0.5)" textAlign="center" mt="$1">{label}</Text>
    </YStack>
  );
}

export default function StatisticsScreen() {
  const router = useRouter();
  const { paleta: palette } = useTema();

  const [stats, setStats]         = useState<Estatisticas | null>(null);
  const [historico, setHistorico] = useState<Tentativa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]            = useState<string | null>(null);

  const buscarDados = useCallback(() => {
    setCarregando(true);
    setErro(null);

    Promise.all([
      api.get('/users/estatisticas'),
      api.get('/users/historico'),
    ])
      .then(([resStats, resHist]) => {
        setStats(resStats.data);
        setHistorico(resHist.data);
      })
      .catch(() => setErro('Não foi possível carregar as estatísticas.'))
      .finally(() => setCarregando(false));
  }, []);

  useFocusEffect(buscarDados);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.offWhite }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Cabeçalho */}
      <YStack
        backgroundColor={palette.primaryBlue}
        pt="$6"
        pb="$4"
        px="$4"
        ai="center"
      >
        <Text color={palette.white} fontSize={22} fontWeight="bold" fontFamily={primaryFontA}>
          Estatísticas
        </Text>
        <Text color="rgba(255,255,255,0.75)" fontSize={13}>
          Seu desempenho no Staticlass
        </Text>
      </YStack>

      {carregando ? (
        <YStack f={1} jc="center" ai="center">
          <ActivityIndicator size="large" color={palette.primaryBlue} />
        </YStack>
      ) : erro ? (
        <YStack f={1} jc="center" ai="center" px="$6">
          <Text color={palette.red} fontSize={15} textAlign="center">{erro}</Text>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>

          {/* Cards de resumo */}
          {stats && (
            <>
              <XStack gap="$3" mb="$1">
                <CardResumo
                  label="Quizzes feitos"
                  valor={String(stats.total_quizzes)}
                  cor={palette.primaryBlue}
                  palette={palette}
                />
                <CardResumo
                  label="Média de acertos"
                  valor={`${stats.media_pct}%`}
                  cor={stats.media_pct >= 70 ? palette.primaryGreen : palette.red}
                  palette={palette}
                />
              </XStack>

              <XStack gap="$3" mb="$3">
                <CardResumo
                  label="Questões respondidas"
                  valor={String(stats.total_questoes)}
                  cor={palette.darkBlue}
                  palette={palette}
                />
                <CardResumo
                  label="Total de acertos"
                  valor={String(stats.total_acertos)}
                  cor={palette.primaryGreen}
                  palette={palette}
                />
              </XStack>

              {stats.capitulo_favorito && (
                <YStack
                  backgroundColor={palette.primaryBlue}
                  borderRadius={12}
                  px="$4"
                  py="$3"
                  mb="$3"
                  flexDirection="row"
                  ai="center"
                  gap="$2"
                >
                  <Text fontSize={18}>📚</Text>
                  <YStack>
                    <Text color="rgba(255,255,255,0.75)" fontSize={11}>Capítulo mais praticado</Text>
                    <Text color={palette.white} fontSize={15} fontWeight="bold">
                      {stats.capitulo_favorito}
                    </Text>
                  </YStack>
                </YStack>
              )}
            </>
          )}

          {/* Histórico */}
          <Text fontSize={14} fontWeight="bold" color={palette.darkBlue} mb="$1">
            Últimas tentativas
          </Text>

          {historico.length === 0 ? (
            <YStack jc="center" ai="center" py="$6">
              <Text fontSize={15} textAlign="center" color={palette.offBlack}>
                Nenhuma tentativa ainda.{'\n'}Complete um quiz para ver seu histórico!
              </Text>
            </YStack>
          ) : (
            historico.map((tentativa, indice) => {
              const porcentagem = Math.round((tentativa.acertos / tentativa.total) * 100);
              const corPlacar   = porcentagem >= 70 ? palette.primaryGreen : palette.red;

              return (
                <YStack
                  key={tentativa.id}
                  backgroundColor={palette.white}
                  borderRadius={12}
                  px="$4"
                  py="$3"
                  mb="$2"
                  style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4 }}
                >
                  <XStack jc="space-between" ai="center" mb="$1">
                    <Text fontSize={13} color="rgba(0,0,0,0.5)">
                      #{indice + 1} — {formatarData(tentativa.criado_em)}
                    </Text>
                    <Text fontSize={20} fontWeight="bold" color={corPlacar}>
                      {tentativa.acertos}/{tentativa.total}
                    </Text>
                  </XStack>

                  <XStack gap="$3" flexWrap="wrap">
                    {tentativa.capitulo && (
                      <Text fontSize={12} color={palette.primaryBlue} fontWeight="bold">
                        📚 {tentativa.capitulo}
                      </Text>
                    )}
                    {tentativa.dificuldade && (
                      <Text fontSize={12} color={palette.darkBlue}>
                        🎯 {ROTULO_DIFICULDADE[tentativa.dificuldade] ?? tentativa.dificuldade}
                      </Text>
                    )}
                    <Text fontSize={12} color={corPlacar} fontWeight="bold">
                      {porcentagem}% de acerto
                    </Text>
                  </XStack>
                </YStack>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Botão voltar */}
      <YStack
        backgroundColor={palette.primaryBlue}
        py="$4"
        ai="center"
        onPress={() => router.back()}
        pressStyle={{ opacity: 0.85 }}
      >
        <Text color={palette.white} fontWeight="bold" fontSize={16}>
          VOLTAR
        </Text>
      </YStack>
    </SafeAreaView>
  );
}
