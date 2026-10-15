import React from 'react';
import { Image, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { YStack, XStack, Text, Button } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';
import { MathText } from 'app/components/MathText';
import { API_BASE_URL } from 'app/constants/apiBase';

const SolutionScreen = () => {
  const router = useRouter();
  const { questionData } = useLocalSearchParams();
  const q = JSON.parse(questionData as string);

  const isCorrect = q.message === 'correct';
  const hasQuestionImage = Boolean(q.image_q && q.image_q !== 'null');
  const questionImage = (
    <Image
      source={{ uri: `${API_BASE_URL}/questions/uploads/${q.image_q}` }}
      style={{ width: '100%', height: 200, borderRadius: 12 }}
      resizeMode="contain"
    />
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.darkBlue }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$12"
        pb="$3"
        px="$4"
        ai="center"
        jc="center"
        position="relative"
      >
        <YStack position="absolute" left="$4" top="$11">
          <Button
            circular
            size="$3"
            backgroundColor="transparent"
            pressStyle={{ opacity: 0.7 }}
            onPress={() => router.back()}
            icon={<ChevronLeft color={palette.white} size={28} />}
          />
        </YStack>
        <YStack
          backgroundColor={palette.primaryBlue}
          px="$6"
          py="$2"
          borderRadius={20}
          borderWidth={2}
          borderColor="rgba(255,255,255,0.4)"
        >
          <Text color={palette.white} fontWeight="900" fontSize={16} fontFamily={primaryFontA}>
            QUESTÃO {q.id || ''}
          </Text>
        </YStack>
      </XStack>

      {/* Enunciado */}
      <YStack backgroundColor={palette.darkBlue} p="$6" gap="$3">
        {hasQuestionImage && q.image_q_position === 'antes' ? questionImage : null}
        <MathText color={palette.white} fontSize={15} apiBase={API_BASE_URL}>
          {q.issue}
        </MathText>
        {hasQuestionImage && q.image_q_position !== 'antes' && q.image_q_position !== 'meio'
          ? questionImage
          : null}
      </YStack>

      {/* Resposta e Solução */}
      <YStack backgroundColor={palette.darkBlue} px="$6" pb="$6" gap="$5">
        {isCorrect ? (
          <YStack gap="$2">
            <Text color={palette.primaryGreen} fontSize={18} fontWeight="bold">
              GABARITO: {q.correct_answer}
            </Text>
          </YStack>
        ) : (
          <YStack gap="$2">
            <Text color={palette.red} fontSize={16} fontWeight="bold">
              Alternativa {q.userAnswer}: Errada
            </Text>
          </YStack>
        )}

        <YStack gap="$2">
          <Text color={palette.white} fontSize={16} fontWeight="bold">
            Solução:
          </Text>
          {q.solution ? (
            <MathText color="rgba(255,255,255,0.85)" fontSize={14} apiBase={API_BASE_URL}>
              {q.solution}
            </MathText>
          ) : (
            <Text color="rgba(255,255,255,0.85)" fontSize={14} lineHeight={22}>
              Sem explicação disponível.
            </Text>
          )}
          {q.image_s && q.image_s !== 'null' ? (
            <Image
              source={{ uri: `${API_BASE_URL}/questions/uploads/${q.image_s}` }}
              style={{ width: '100%', height: 200, borderRadius: 12 }}
              resizeMode="contain"
            />
          ) : null}
        </YStack>

        {q.section && (
          <YStack
            backgroundColor={palette.primaryGreen}
            borderRadius={12}
            px="$4"
            py="$3"
          >
            <Text color={palette.white} fontSize={13} textAlign="center">
              Assunto: {q.section}
            </Text>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
};

export default SolutionScreen;
