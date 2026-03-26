import React, { useEffect, useRef } from 'react';
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

  // Controle para não enviar o resultado mais de uma vez (evita re-render duplo)
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current || total === 0) return;
    enviado.current = true;

    // Salva o resultado no backend e atualiza o score do aluno
    api.post('/users/salvar-resultado', {
      acertos,
      total,
      capitulo_id,
      dificuldade,
    }).catch(() => {
      // Falha silenciosa — o aluno vê o resultado mesmo se o servidor não responder
    });

    // Se era a questão diária, marca como concluída para hoje
    if (ehDiaria) {
      api.post('/questions/diaria/marcar').catch(() => {});
    }
  }, []);

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
          <Text fontSize={14} color="rgba(255,255,255,0.7)" mb="$4">
            Pontuação: +{acertos * 10} pts
          </Text>

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
