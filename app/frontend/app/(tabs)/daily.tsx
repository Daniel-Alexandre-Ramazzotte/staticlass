import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Image } from 'tamagui';
import { Lightbulb, Menu } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';
import { useAuth } from 'app/context/AuthContext';
import { AppButton } from 'app/components/AppButton';

export default function DailyScreen() {
  const router = useRouter();
  const { name } = useAuth();
  // TODO: buscar do backend se a questão diária já foi feita hoje
  const [done] = useState(false);

  return (
    <YStack f={1} backgroundColor={palette.offWhite}>
      {/* Header */}
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

      {/* Body */}
      <YStack f={1} jc="center" ai="center" px="$6">
        {done ? (
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
          </YStack>
        ) : (
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
              onPress={() =>
                router.push({
                  pathname: '/(app)/QuizInProgressScreen',
                  params: { qtd: '1', daily: 'true' },
                })
              }
            >
              Realizar
            </AppButton>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
