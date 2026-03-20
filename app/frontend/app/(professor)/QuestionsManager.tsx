import { useRouter } from 'expo-router';
import { XStack, YStack, Button, Text, ScrollView } from 'tamagui';
import { palette } from 'app/constants/style';
import { ChevronLeft, Eye, Pencil, Trash2 } from 'lucide-react-native';

// esse gerenciador ainda nao esta funcionando, apenas tem o visual aplicado
// O que falta:
// - Listar as questoes disponiveis (fazer a requisicao para o backend)
// - Implementar a funcionalidade dos botoes de editar, visualizar e excluir (fazer as requisicoes para o backend)

export default function QuestionsManager() {
  const router = useRouter();
  const questions = Array.from(
    { length: 11 },
    (_, idx) => `Questao ${idx + 1}`
  );

  return (
    <YStack f={1} backgroundColor="#d6d6db">
      {/*Header*/}
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$8" // Testar melhor
        pb="$4"
        px="$4"
        ai="center"
        jc="flex-start"
        width={'100%'}
        gap="$2"
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
          Gerenciar Questões
        </Text>
      </XStack>

      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <YStack px="$4" pt="$6" pb="$4" ai="center" gap="$6">
          <YStack
            width={'100%'}
            maxWidth={360}
            backgroundColor="#9ec1db"
            borderRadius={10}
            overflow="hidden"
            p="$4"
            gap="$3"
          >
            <Text
              backgroundColor="#74add1"
              color={palette.offWhite}
              fontWeight="700"
              fontSize="$7"
              textAlign="center"
              py="$2"
              borderRadius={8}
              mt={-8}
              mx={-8}
              mb="$2"
            >
              Questoes
            </Text>

            {questions.map((question) => (
              <XStack key={question} ai="center" jc="space-between">
                <Text
                  backgroundColor="#4f7ea0"
                  color={palette.offWhite}
                  fontWeight="700"
                  px="$3"
                  py="$2"
                  width={88}
                  borderRadius={2}
                >
                  {question}
                </Text>

                <XStack ai="center" gap="$2" mr="$2">
                  <Button
                    size="$2"
                    circular
                    backgroundColor="transparent"
                    pressStyle={{ opacity: 0.7 }}
                    icon={<Pencil color="#24506e" size={16} />}
                  />
                  <Button
                    size="$2"
                    circular
                    backgroundColor="transparent"
                    pressStyle={{ opacity: 0.7 }}
                    icon={<Eye color="#24506e" size={16} />}
                  />
                </XStack>

                <Button
                  size="$2"
                  circular
                  backgroundColor="transparent"
                  pressStyle={{ opacity: 0.7 }}
                  icon={<Trash2 color="#24506e" size={18} />}
                />
              </XStack>
            ))}
          </YStack>

          <Button
            backgroundColor="#3f6f91"
            color={palette.offWhite}
            fontSize="$9"
            fontWeight="800"
            borderRadius={999}
            width={'100%'}
            maxWidth={360}
            py="$5"
            onPress={() => router.push('/(professor)/AddNewQuestion')}
          >
            Adicionar Nova Questao
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
