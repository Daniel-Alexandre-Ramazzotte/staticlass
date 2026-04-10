import React from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { Menu } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';
import { useAuth } from 'app/context/AuthContext';
import { AppButton } from 'app/components/AppButton';

export default function ListasScreen() {
  const router = useRouter();
  const { name } = useAuth();

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
          <Text color={palette.white} fontSize={16} fontWeight="bold" fontFamily={primaryFontA}>
            Prof. {name || ''}
          </Text>
        </XStack>
        <Menu color={palette.white} size={28} />
      </XStack>

      {/* Body */}
      <YStack f={1} jc="center" ai="center" gap="$4" px="$8">
        <AppButton
          backgroundColor={palette.primaryGreen}
          onPress={() => router.push('/(professor)/CreateNewList')}
        >
          Criar lista
        </AppButton>
        <AppButton
          backgroundColor={palette.darkBlue}
          onPress={() => router.push('/(professor)/ListManager')}
        >
          Gerenciar Listas
        </AppButton>
        <AppButton
          backgroundColor={palette.red}
          onPress={() => router.push('/(admin)/QuestaoViewer')}
        >
          Gerenciar Questões
        </AppButton>
      </YStack>
    </YStack>
  );
}
