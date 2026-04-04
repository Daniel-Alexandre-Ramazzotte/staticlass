import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from 'app/context/AuthContext';
import { XStack, YStack, ZStack, Image, Text, Button } from 'tamagui';
import { Menu } from '@tamagui/lucide-icons';
import { palette as paletaEstatica, primaryFontA, primaryFontC } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';
import { useTema } from '../../src/context/ThemeContext';

function Header({ name, subtitle }: { name: string; subtitle: string }) {
  const { paleta } = useTema();
  const palette = paleta;
  return (
    <XStack
      backgroundColor={palette.primaryBlue}
      pt="$10"
      pb="$4"
      px="$4"
      ai="center"
      jc="space-between"
      width="100%"
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
          <Text color="rgba(255,255,255,0.8)" fontSize={12}>
            {subtitle}
          </Text>
        </YStack>
      </XStack>
      <Menu color={palette.white} size={28} />
    </XStack>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { role, name } = useAuth();
  const { paleta } = useTema();
  const palette = paleta;

  if (role === 'admin') {
    return (
      <YStack f={1} backgroundColor={palette.offWhite}>
        <Header name={name || ''} subtitle="Administrador" />
        <YStack f={1} jc="center" ai="center" gap="$4" px="$8">
          <AppButton
            backgroundColor={palette.primaryGreen}
            onPress={() => router.push('/(professor)/QuestionsManager')}
          >
            Gerenciar e Visualizar Questões
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
      </YStack>
    );
  }

  const subtitle =
    role === 'professor'
      ? 'Professor'
      : 'Nível 1 ⭐';

  return (
    <YStack f={1} backgroundColor={palette.offWhite}>
      <Header name={role === 'professor' ? `Prof. ${name || ''}` : name || ''} subtitle={subtitle} />

      <ZStack f={1} width="100%">
        <YStack position="absolute" bottom={0} left={0} right={0} ai="center" opacity={0.15}>
          <Image
            source={require('../../assets/images/logo.png')}
            width="100%"
            height={380}
            objectFit="contain"
          />
        </YStack>

        <YStack f={1} px="$6" pt="$8" gap="$1">
          <Text color={palette.darkBlue} fontSize={26} fontWeight="900" fontFamily={primaryFontA}>
            Olá, {name || 'Usuário'}!
          </Text>
          <Text color={palette.darkBlue} fontSize={20} fontWeight="600" fontFamily={primaryFontC}>
            Bem-vindo!
          </Text>
        </YStack>
      </ZStack>
    </YStack>
  );
}
