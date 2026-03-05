import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import styles from 'app/constants/style';

export default function ProfessorMenu() {
  const router = useRouter();
  return (
    <View>
      <Text style={styles.title}>Menu do Professor </Text>

      {/* Botao para o Criador de Listas*/}
      <Pressable onPress={() => router.push('/(professor)/CreateNewList')}>
        <Text>Criar Nova Lista</Text>
      </Pressable>
      {/* Botao para o gerenciador de Listas*/}
      <Pressable onPress={() => router.push('/(professor)/ListManager')}>
        <Text>Gerenciar Listas</Text>
      </Pressable>

      {/* Botao para o gerenciador de questoes*/}
      <Pressable onPress={() => router.push('/(professor)/QuestionsManager')}>
        <Text>Gerenciar Questões</Text>
      </Pressable>
    </View>
  );
}
