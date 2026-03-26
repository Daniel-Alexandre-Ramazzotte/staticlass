import React from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { YStack, XStack, Text, View } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from 'app/constants/style';

const ResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const result = params.result ? JSON.parse(params.result as string) : [];

  const score = result.filter((a: any) => a.message === 'correct').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.primaryBlue }}>
      <Stack.Screen options={{ headerShown: false }} />

      <YStack f={1} ai="center" jc="center" px="$5">
        {/* Clipboard badge */}
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

        {/* Card */}
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
            {score}/{result.length}
          </Text>
          <Text fontSize={14} color="rgba(255,255,255,0.7)" mb="$4">
            Pontuação: {score}
          </Text>

          <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
            {result.map((answer: any, index: number) => {
              const isCorrect = answer.message === 'correct';
              return (
                <XStack
                  key={index}
                  jc="space-between"
                  ai="center"
                  py="$2"
                  width="100%"
                >
                  <Text
                    fontSize={15}
                    fontWeight="bold"
                    color={isCorrect ? palette.primaryGreen : palette.red}
                  >
                    Questão {String(index + 1).padStart(2, '0')}:
                  </Text>
                  <Text
                    color={palette.white}
                    textDecorationLine="underline"
                    fontWeight="bold"
                    fontSize={14}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/SolutionScreen',
                        params: { questionData: JSON.stringify(answer) },
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

      {/* Bottom button */}
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
