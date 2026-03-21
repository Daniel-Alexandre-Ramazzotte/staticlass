import { useRouter } from 'expo-router';

import { AppButton } from 'app/components/AppButton';
import { YStack, XStack, Text, Button } from 'tamagui';
import styles, { palette } from 'app/constants/style';
import { useAuth } from 'app/context/AuthContext';
import { ChevronLeft } from 'lucide-react-native';

export default function AdminMenu() {
  const router = useRouter();
  const { name } = useAuth();
  return (
    <YStack f={1} jc="center">
      {/*Header*/}
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$8" // Testar melhor
        pb="$4"
        px="$4"
        ai="center"
        jc="space-between"
        width={'100%'}
      >
        {/*Botão de Voltar*/}
        <Button
          size="$3" // Testar tamanhos
          circular
          backgroundColor="transparent"
          pressStyle={{ opacity: 0.7 }}
          onPress={() => router.back()}
          icon={<ChevronLeft color={palette.white} size={28} />} // Ícone de seta para esquerda, Testar tamanhos
        />
        <Text
          f={1}
          color="#fff"
          fontSize="$8"
          fontWeight="bold"
          textAlign="center"
          mr="$6"
        >
          Menu do Administrador
        </Text>
      </XStack>
      <YStack f={1} jc="center" ai="center" gap="$4">
        {/* Botao para o Gerenciador de Questões*/}

        <AppButton
          backgroundColor={palette.primaryGreen}
          onPress={() => router.push('/(professor)/QuestionsManager')}
        >
          Gerenciar Questões
        </AppButton>
        {/* Botao para o gerenciador de professores*/}
        <AppButton
          backgroundColor={palette.primaryBlue}
          onPress={() => router.push('/(admin)/ProfessorManager')}
        >
          Gerenciar Professor
        </AppButton>
        {/* Botao para o gerenciador de alunos*/}
        <AppButton
          backgroundColor={palette.grey}
          onPress={() => router.push('/(admin)/AlunoManager')}
        >
          Gerenciar de Alunos
        </AppButton>
      </YStack>
    </YStack>
  );
}
