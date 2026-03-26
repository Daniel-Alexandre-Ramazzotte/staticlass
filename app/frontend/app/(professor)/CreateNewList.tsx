import { YStack, XStack, Button, Text } from 'tamagui';
import { useRouter } from 'expo-router';
import { palette } from 'app/constants/style';
import { ChevronLeft } from 'lucide-react-native';

const CreateNewListScreen = () => {
  const router = useRouter();
  return (
    <YStack f={1} ai="center" jc="center" px="$4">
      {/*Header*/}
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$8" // Testar melhor
        pb="$4"
        px="$4"
        ai="center" // Alinhamento vertical
        jc="space-between" // Espaço entre os itens
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
          Criar Nova Lista (WIP)
        </Text>
      </XStack>
      <YStack f={1} ai="center" jc="center" gap="$4">
        <Button onPress={() => router.back()} size="$4">
          Voltar
        </Button>
      </YStack>
    </YStack>
  );
};

export default CreateNewListScreen;
