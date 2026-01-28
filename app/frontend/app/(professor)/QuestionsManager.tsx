import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import styles from 'app/constants/style';

export default function QuestionsManager() {
  const router = useRouter();
  return (
    <View>
      <Text style={styles.title}>Gerenciador de Questões - Em breve</Text>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.startButton}>Voltar ao Menu</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/(professor)/AddNewQuestion')}>
        <Text style={styles.startButton}>Adicionar Nova questão</Text>
      </Pressable>
    </View>
  );
}
