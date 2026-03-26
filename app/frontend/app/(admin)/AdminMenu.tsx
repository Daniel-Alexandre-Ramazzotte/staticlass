import React from 'react';
import { useRouter } from 'expo-router';
import { YStack } from 'tamagui';
import { palette } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';

// Mantido por compatibilidade — a navegação principal usa (tabs)/home.tsx para admin
export default function AdminMenu() {
  const router = useRouter();
  return (
    <YStack f={1} jc="center" ai="center" gap="$4" px="$8" backgroundColor={palette.offWhite}>
      <AppButton
        backgroundColor={palette.primaryGreen}
        onPress={() => router.push('/(professor)/QuestionsManager')}
      >
        Gerenciar Questões
      </AppButton>
      <AppButton
        backgroundColor={palette.darkBlue}
        onPress={() => router.push('/(admin)/ProfessorManager')}
      >
        Gerenciar professores
      </AppButton>
      <AppButton
        backgroundColor={palette.red}
        onPress={() => router.push('/(admin)/AlunoManager')}
      >
        Gerenciar alunos
      </AppButton>
    </YStack>
  );
}
