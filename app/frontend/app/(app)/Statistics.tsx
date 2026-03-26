import React, { useState, useCallback } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { YStack, XStack, Text, Stack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette as paletaEstatica, primaryFontA } from 'app/constants/style';
import { useTema } from '../../src/context/ThemeContext';
import api from 'app/services/api';

// Tipo que representa uma tentativa de quiz salva no backend
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

export default function StatisticsScreen() {
  const router = useRouter();
  const { paleta: palette } = useTema();
  const [historico, setHistorico]    = useState<Tentativa[]>([]);
  const [carregando, setCarregando]  = useState(true);
  const [erro, setErro]              = useState<string | null>(null);

  // Busca o histórico sempre que a tela recebe foco
  const buscarHistorico = useCallback(() => {
    setCarregando(true);
    setErro(null);
    api.get('/users/historico')
      .then((res) => setHistorico(res.data))
      .catch(() => setErro('Não foi possível carregar o histórico.'))
      .finally(() => setCarregando(false));
  }, []);

  useFocusEffect(buscarHistorico);

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
          Últimas 10 tentativas
        </Text>
      </YStack>

      {/* Conteúdo */}
      {carregando ? (
        <YStack f={1} jc="center" ai="center">
          <ActivityIndicator size="large" color={palette.primaryBlue} />
        </YStack>
      ) : erro ? (
        <YStack f={1} jc="center" ai="center" px="$6">
          <Text color={palette.red} fontSize={15} textAlign="center">{erro}</Text>
        </YStack>
      ) : historico.length === 0 ? (
        <YStack f={1} jc="center" ai="center" px="$6">
          <Text fontSize={16} textAlign="center" color={palette.offBlack}>
            Nenhuma tentativa registrada ainda.{'\n'}Complete um quiz para ver seu histórico!
          </Text>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {historico.map((tentativa, indice) => {
            const porcentagem = Math.round((tentativa.acertos / tentativa.total) * 100);
            const corPlacar   = porcentagem >= 70 ? palette.primaryGreen : palette.red;

            return (
              <YStack
                key={tentativa.id}
                backgroundColor={palette.white}
                borderRadius={12}
                px="$4"
                py="$3"
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
          })}
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
