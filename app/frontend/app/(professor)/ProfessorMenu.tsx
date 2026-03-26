import React from 'react';
import { useRouter } from 'expo-router';
import { YStack } from 'tamagui';
import { palette } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';

// Mantido por compatibilidade — a navegação principal usa (tabs)/listas.tsx
export default function ProfessorMenu() {
  const router = useRouter();
  return (
    <YStack f={1} jc="center" ai="center" gap="$4" px="$8" backgroundColor={palette.offWhite}>
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
        onPress={() => router.push('/(professor)/QuestionsManager')}
      >
        Gerenciar Questões
      </AppButton>
    </YStack>
  );
}
