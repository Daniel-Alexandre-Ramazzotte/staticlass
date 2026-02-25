import { View, Pressable, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
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
    <SafeAreaView style={styles.resultArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.containerResult}>
        
        <View style={styles.topBadge}>
          <View style={styles.clipboardClip}>
            <View style={styles.clipboardHole} />
          </View>
          <Text style={styles.resultTitle}>RESUMO</Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultScore}>
            {score}/{result.length}
          </Text>

        

          <ScrollView showsVerticalScrollIndicator={false}
                      style= {{ width:'100%'}}
                      contentContainerStyle = {{ paddingBottom: 20}}
                      >
            {result && result.map((answer: any, index: number) => {
              const statusColor = answer.message === 'correct' ? '#55bf44' : '#f65151';

              return (
                <View key={index} style={styles.resultItem}>
                  <Text style={[styles.resultQuestion, { color: statusColor }]}>
                    Questão {index + 1}: 
                  </Text>

                  <Pressable
                    onPress={() => {
                      router.push({
                        pathname: '../screens/SolutionScreen',
                        params: { questionIndex: index },
                      });
                    }}
                  >
                    <Text style={styles.resolutionText}>Resolução</Text>
                  </Pressable>
                </View>
              );
            })} 
          </ScrollView>
        </View>
       </View>
      

        <Pressable
          style={styles.restartQuizButton}
          onPress={() => router.push('../(tabs)/home')}
        >
          <Text style={styles.restartQuizText}>VOLTAR</Text>
        </Pressable>
    </SafeAreaView>
  
  );

};

export default ResultScreen;