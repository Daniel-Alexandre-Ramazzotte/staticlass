import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { YStack, XStack, Text, Card, Image, Paragraph, Separator, Theme } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';

const SolutionScreen = () => {
  const { questionData } = useLocalSearchParams();
  const q = JSON.parse(questionData as string);
  console.log("Dados da questão recebidos:", q);

  return (
    <Theme name="dark">
      <ScrollView
        style={{ backgroundColor: '#002d4e' }} // Azul marinho do fundo
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        indicatorStyle="white"
      >

        <Stack.Screen options={{ headerShown: false }} />


        {/* 1. HEADER ÚNICO: Seta e Balão na mesma linha */}
        <XStack
          px="$4"
          pt="$12"
          pb="$5"
          ai="center"
          jc="center"
          backgroundColor="#002d4e"
          position="relative" // Necessário para o alinhamento absoluto da seta
        >
          {/* SETA DE VOLTAR (Posicionada à esquerda) */}
          <YStack position="absolute" left="$4" pt="$11">
            <Pressable onPress={() => router.back()} hitSlop={20}>
              <YStack padding="$2">
                <ChevronLeft size={35} color="white" />
              </YStack>
            </Pressable>
          </YStack>

          {/* BALÃO DA QUESTÃO (Centralizado) */}
          <YStack
            backgroundColor="#0066cc"
            paddingHorizontal="$8"
            paddingVertical="$2"
            borderRadius="$10"
          >
            <Text color="white" fontWeight="900" fontSize="$5" textTransform="uppercase">
              Questão {q.id || ""}
            </Text>
          </YStack>
        </XStack>

        {/* 2. BLOCO PRETO DO ENUNCIADO (Logo abaixo do header) */}
        <YStack backgroundColor="black" padding="$6" gap="$4">
          <Paragraph color="white" fontSize="$5" lineHeight={24} textAlign="left">
            {q.issue || "Texto do enunciado não encontrado"}
          </Paragraph>

          {q.image_q && (
            <Image
              source={{ uri: q.image_q }}
              width="100%"
              height={200}
              resizeMode="contain"
            />
          )}
        </YStack>



        {/* Bloco de Resposta e Solução (Fundo Azul) */}
        <YStack p="$6" gap="$6">

          {/* Gabarito */}
          <XStack gap="$2" ai="flex-start">
            <Text color="white" fontSize="$6" fontWeight="bold">
              GABARITO:
            </Text>
            <Text color="white" fontSize="$6" f={1}>
              {q.correct_answer}
            </Text>
          </XStack>

          {/* Solução */}
          <YStack gap="$2">
            <Text color="white" fontSize="$6" fontWeight="bold">
              Solução:
            </Text>
            <Paragraph color="white" fontSize="$5" lineHeight={22}>
              {q.solution || "Sem explicação disponível."}
            </Paragraph>
          </YStack>

        </YStack>
      </ScrollView>
    </Theme>
  );

};

export default SolutionScreen;