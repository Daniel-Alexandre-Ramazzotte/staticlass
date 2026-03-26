import React from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { YStack, XStack, Text, Button } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';

const SolutionScreen = () => {
  const router = useRouter();
  const { questionData } = useLocalSearchParams();
  const q = JSON.parse(questionData as string);

  const isCorrect = q.message === 'correct';

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
        <Text color={palette.white} fontSize={15} lineHeight={22}>
          {q.issue}
        </Text>
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
          <Text color="rgba(255,255,255,0.85)" fontSize={14} lineHeight={22}>
            {q.solution || 'Sem explicação disponível.'}
          </Text>
        </YStack>

        {q.section && (
          <YStack
            backgroundColor={palette.primaryGreen}
            borderRadius={12}
            px="$4"
            py="$3"
          >
            <Text color={palette.white} fontSize={13} textAlign="center">
              Conteúdo pode ser encontrado na seção {q.section}
            </Text>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
};

export default SolutionScreen;
