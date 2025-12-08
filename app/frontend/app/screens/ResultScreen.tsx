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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.resultsWrap}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Resultados da Sessão</Text>
          <Text style={styles.resultScore}>
            {score}/{result.length}
          </Text>
          <Text style={styles.resultMessage}>Excelente!</Text>

          {result &&
            result.map((answer: any, index: number) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultQuestion}>Pergunta {index + 1}:</Text>
                {answer.message === 'correct' ? (
                  <Text style={{ color: 'green' }}> Correta</Text>
                ) : (
                  <Text style={{ color: 'red' }}> Incorreta</Text>
                )}
              </View>
            ))}
        </View>

        <Pressable
          style={styles.restartButton}
          onPress={() => router.push('../(tabs)/home')}
        >
          <Text style={styles.restartText}>Voltar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ResultScreen;
