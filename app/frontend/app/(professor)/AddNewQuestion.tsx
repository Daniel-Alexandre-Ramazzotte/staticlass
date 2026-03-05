import { useRouter } from 'expo-router';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useState } from 'react';

import styles from 'app/constants/style';
import api from '../services/api';
import {
  CheckButton,
  StyledCheckbox,
  StyledIndicator,
  ButtonText,
} from 'app/constants/style';
import { useAuth } from '../context/AuthContext';

export default function AddNewQuestion() {
  const [isSelected, setIsSelected] = useState(false);
  const router = useRouter();
  const [issue, setIssue] = useState('');
  const [altA, setAltA] = useState('');
  const [altB, setAltB] = useState('');
  const [altC, setAltC] = useState('');
  const [altD, setAltD] = useState('');
  const [altE, setAltE] = useState('');
  const [correctAlt, setCorrectAlt] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [solution, setSolution] = useState('');
  const handleQuestionSubmit = async () => {
    if (
      !issue ||
      !altA ||
      !altB ||
      !altC ||
      !altD ||
      !altE ||
      !correctAlt ||
      !subject ||
      !solution
    ) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('issue', issue);
      formData.append('answer_a', altA);
      formData.append('answer_b', altB);
      formData.append('answer_c', altC);
      formData.append('answer_d', altD);
      formData.append('answer_e', altE);
      formData.append('correct_answer', correctAlt);
      formData.append('subject', subject);
      //formData.append('difficulty', difficulty);
      formData.append('solution', solution);

      const response = await api.post('/questions/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Enviando dados:', formData);
      if (response.status === 201) {
        alert('Questão adicionada com sucesso!');
        router.back();
      } else {
        alert('Erro ao adicionar questão. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao adicionar questão:', error);
      alert('Erro ao adicionar questão. Tente novamente.');
    }
  };

  const handlePress = () => {
    setIsSelected((prev) => !prev);
  };

  return (
    <View>
      <Text style={styles.title}>Adicionar Nova Questão - Em breve</Text>

      <TextInput
        style={styles.input}
        onChangeText={setSubject}
        placeholder="Tema da questão"
      />
      {/*
      <TextInput
        style={styles.input}
        onChangeText={setDifficulty}
        placeholder="Dificuldade da questão"
      /> */}

      <TextInput
        style={styles.input}
        onChangeText={setIssue}
        placeholder="Enunciado da questão"
      />

      <TextInput
        style={styles.input}
        onChangeText={setAltA}
        placeholder="Alternativa A"
      />
      <TextInput
        style={styles.input}
        onChangeText={setAltB}
        placeholder="Alternativa B"
      />
      <TextInput
        style={styles.input}
        onChangeText={setAltC}
        placeholder="Alternativa C  "
      />
      <TextInput
        style={styles.input}
        onChangeText={setAltD}
        placeholder="Alternativa D"
      />

      <TextInput
        style={styles.input}
        onChangeText={setAltE}
        placeholder="Alternativa E"
      />

      <TextInput
        style={styles.input}
        onChangeText={setSolution}
        placeholder="Solução da questão"
      />

      <TextInput
        style={styles.input}
        onChangeText={setCorrectAlt}
        placeholder="Alternativa Correta (A, B, C, D ou E)"
      />

      <Pressable onPress={() => router.back()}>
        <Text style={styles.startButton}>Cancelar</Text>
      </Pressable>

      <Pressable onPress={handleQuestionSubmit}>
        <Text style={styles.startButton}>Salvar Questão</Text>
      </Pressable>
    </View>
  );
}
