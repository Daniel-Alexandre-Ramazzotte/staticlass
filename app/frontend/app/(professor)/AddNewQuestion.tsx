import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Input,
  YStack,
  XStack,
  ZStack,
  Text,
  ScrollView,
  Button,
} from 'tamagui';
import { palette } from 'app/constants/style';
import api from '../services/api';
import { AppButton } from 'app/components/AppButton';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from 'app/context/AuthContext';

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
  const { userId } = useAuth();

  const handleQuestionSubmit = async () => {
    if (!userId) {
      alert('Usuario nao autenticado. Faca login novamente.');
      return;
    }

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
      formData.append('id_professor', userId);

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
    <ZStack f={1}>
      <YStack
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
        backgroundColor={palette.backgroundLight}
        opacity={0.2}
        pointerEvents="none"
      />
      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <YStack>
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
              Gerenciar Questões
            </Text>
          </XStack>
          <YStack ai="center" gap="$4" width={'70%'} alignSelf="center" py="$4">
            <YStack width={'100%'} gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Tema:
              </Text>
              <Input
                width={'94%'}
                alignSelf="flex-end"
                marginTop="$1"
                onChangeText={setSubject}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <YStack width={'100%'} gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Enunciado:
              </Text>
              <Input
                width={'94%'}
                alignSelf="flex-end"
                marginTop="$1"
                onChangeText={setIssue}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <YStack width={'100%'} gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Alternativa A:
              </Text>
              <Input
                width={'94%'}
                alignSelf="flex-end"
                marginTop="$1"
                onChangeText={setAltA}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <YStack width={'100%'} gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Alternativa B:
              </Text>
              <Input
                width={'94%'}
                alignSelf="flex-end"
                marginTop="$1"
                onChangeText={setAltB}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <YStack width={'100%'} gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Alternativa C:
              </Text>
              <Input
                width={'94%'}
                alignSelf="flex-end"
                marginTop="$1"
                onChangeText={setAltC}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <YStack width={'100%'} gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Alternativa D:
              </Text>
              <Input
                width={'94%'}
                alignSelf="flex-end"
                marginTop="$1"
                onChangeText={setAltD}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <YStack width={'100%'} gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Alternativa E:
              </Text>
              <Input
                width={'94%'}
                alignSelf="flex-end"
                marginTop="$1"
                onChangeText={setAltE}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <YStack width={'100%'} gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Solucao:
              </Text>
              <Input
                width={'94%'}
                alignSelf="flex-end"
                marginTop="$1"
                onChangeText={setSolution}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <YStack width={'100%'} gap={0}>
              <Text
                backgroundColor={palette.darkBlue}
                color={palette.offWhite}
                padding="$1"
                width="40%"
                borderRadius={4}
                alignSelf="flex-start"
                marginLeft="$1"
                textAlign="left"
                fontWeight="bold"
              >
                Alternativa Correta:
              </Text>
              <Input
                width={'94%'}
                alignSelf="flex-end"
                marginTop="$1"
                onChangeText={setCorrectAlt}
                backgroundColor={palette.backgroundLight}
                opacity={0.3}
                color={palette.offWhite}
              />
            </YStack>

            <AppButton
              onPress={handleQuestionSubmit}
              backgroundColor={palette.primaryGreen}
            >
              Salvar Questão
            </AppButton>
          </YStack>
        </YStack>
      </ScrollView>
    </ZStack>
  );
}
