import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useAuth } from 'app/context/AuthContext';
import { XStack, YStack, ZStack, Button, Image, Text } from 'tamagui';
import styles, { palette } from 'app/constants/style';

export default function HomeScreen() {
  const router = useRouter();
  const [qtdQuestoes, setQtdQuestoes] = useState('5');
  const { signOut, role, email } = useAuth();

  return (
    <YStack f={1} jc="center">
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
        <Text color="#fff" fontSize="$6" fontWeight="bold">
          {`Olá Nome do Usuário!`}
        </Text>

        <Text fontSize="$8">☰</Text>
      </XStack>

      <YStack f={1} jc="center" ai="center" gap="$4">
        <Text style={styles.title} py="$10">
          Bem-vindo ao app!
        </Text>

        {/* DEVE SAIR DAQUI, IR PARA UM MENU SANDUICHE, APENAS AQUI PARA DEBUG */}
        {role === 'admin' && (
            <Pressable onPress={() => router.push('/screens/AdminScreen')}>
              <Text>Ir para Admin</Text>
            </Pressable>
          ) && (
            <Pressable
              onPress={() => router.push('/(professor)/QuestionsManager')}
            >
              <Text>Gerenciar Questões</Text>
            </Pressable>
          )}

        {role === 'professor' && (
          <Pressable onPress={() => router.push('/(professor)/ProfessorMenu')}>
            <Text>Gerenciar Questões</Text>
          </Pressable>
        )}
        <ZStack>
          <Image
            height={300}
            width={300}
            mt={'auto'}
            source={require('../../assets/images/logo.png')}
          />
        </ZStack>
      </YStack>
    </YStack>
  );
}
