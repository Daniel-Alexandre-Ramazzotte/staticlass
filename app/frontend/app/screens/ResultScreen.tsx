import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { YStack, XStack, Text, View, Button, styled,  ScrollView  } from 'tamagui';
import styles from '../constants/style';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResultScreen = () => {
  const router = useRouter();

  const params = useLocalSearchParams();
  let result = null;
  let message = '';
  if (params.result && typeof params.result === 'string') {
    result = JSON.parse(params.result);
  }

  for (const [index, answer] of result.entries()) {
    if (answer.message === 'incorrect') {
      message = `Resposta incorreta para a pergunta ${index + 1}.`;
    }
  }

  const score = result.filter(
    (answer: any) => answer.message === 'correct'
  ).length;

  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#0f6ea9' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* containerResult */}
      <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal={20}>
        
        {/* topBadge */}
        <YStack
          backgroundColor="#f65151"
          paddingVertical={12}
          paddingHorizontal={60}
          borderRadius={15}
          position="absolute" // Permite flutuar sobre outros elementos
          alignItems="center"
          justifyContent="center"
          zIndex={10}
          top={80} // Garante que fique na frente de tudo
          elevation={5} //Sombra android
        >
          {/* clipboardClip */}
          <YStack
            position="absolute"
            top={-35}
            width={70}
            height={70}
            borderRadius={35}
            backgroundColor="#f65151"
            alignItems="center"
            zIndex={-1} // Fica atrás do retângulo "RESUMO"
          >
            {/* white circle */}
            <View width={12} height={12} borderRadius={6} backgroundColor="#fff" marginTop={15} />
          </YStack>
          
          <Text fontSize={22} fontWeight="800" color="#fff">
            RESUMO
          </Text>
        </YStack>

        {/* resultCard */}
        <YStack
          backgroundColor="#f2f2f2"
          width="90%"
          height="70%"
          borderRadius={30}
          paddingTop={50} // Espaço para não bater no badge vermelho
          paddingHorizontal={25}
          paddingBottom={30}
          alignItems="center"
        >
          <Text fontSize={60} fontWeight="900" color="#000" marginBottom={20}>
            {score}/{result.length}
          </Text>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            style={{ width: '100%' }}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {result.map((answer: any, index: number) => {
              // Lógica para definir a cor (Verde se acertou, Vermelho se errou)
              const statusColor = answer.message === 'correct' ? '#55bf44' : '#f65151';

              return (
                <XStack key={index} justifyContent="center" alignItems="center" paddingVertical={12} width="100%">
                  <Text 
                    fontSize={16} 
                    fontWeight="bold" 
                    marginRight={8} 
                    color={statusColor}
                  >
                    Questão {index + 1}:
                  </Text>

                  <Text
                    color="#093d60"
                    textDecorationLine="underline"
                    fontWeight="bold"
                    fontSize={14}
                    onPress={() => {
                      router.push({
                        pathname: '../screens/SolutionScreen',
                        params: { questionData: JSON.stringify(answer) },
                      });
                    }}
                  >
                    Resolução
                  </Text>
                </XStack>
              );
            })}
          </ScrollView>
        </YStack>
      </YStack>

      {/* restartQuizButton */}
      <YStack
        backgroundColor="#f65151"
        width="100%"
        paddingVertical={25}
        alignItems="center"
        justifyContent="center"
        position="absolute" // Fixa o botão no final da tela
        bottom={0}
        pressStyle={{ opacity: 0.8 }} // Efeito visual de clique
        onPress={() => router.push('../(tabs)/home')}
      >
        <Text color="#fff" fontWeight="bold" fontSize={22}>
          VOLTAR
        </Text>
      </YStack>
    </SafeAreaView>
  );
};

export default ResultScreen;
