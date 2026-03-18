import React, { useState } from 'react';
import { Pressable } from 'react-native';

import { useRouter } from 'expo-router';

import { useAuth } from 'app/context/AuthContext';
import { XStack, YStack, ZStack, Button, Image, Text } from 'tamagui';
import { palette } from 'app/constants/style';

export default function HomeScreen() {
  const router = useRouter();
  const [qtdQuestoes, setQtdQuestoes] = useState('5');
  const { signOut, role, email, name } = useAuth();

  console.log('Dados do usuário no HomeScreen:', { email, role, name });
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
          {`Olá, ${name || 'Usuário'}!`}
        </Text>

        <Text fontSize="$8">☰</Text>
      </XStack>

      {/* CORPO DA TELA (ZStack para colocar a imagem no fundo) */}
      <ZStack f={1} width={'100%'}>
        {/* Imagem de Fundo (Marca d'água posicionada na base) */}
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          ai="center"
          opacity={0.4}
        >
          <Image
            source={require('../../assets/images/logo.png')}
            width={'100%'}
            height={300} // Ajuste a altura conforme a proporção da sua logo real
            objectFit="contain"
          />
        </YStack>

        {/* Conteúdo em Primeiro Plano */}
        <YStack f={1} px="$5" pt="$8" gap="$1">
          <Text color={palette.darkBlue} fontSize={28} fontWeight="900">
            Olá, {name || 'Usuário'}!
          </Text>
          <Text color={palette.darkBlue} fontSize={22} fontWeight="600">
            Bem-vindo!
          </Text>

          {/* MENUS DE ADMIN/PROFESSOR (Mantidos apenas para debug) */}
          <YStack mt="$8" gap="$4">
            {role === 'admin' && (
              <>
                <Pressable onPress={() => router.push('/(admin)/AdminScreen')}>
                  <Text color={palette.darkBlue} fontWeight="bold">
                    → Ir para Admin
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(professor)/QuestionsManager')}
                >
                  <Text color={palette.darkBlue} fontWeight="bold">
                    → Gerenciar Questões
                  </Text>
                </Pressable>
              </>
            )}

            {role === 'professor' && (
              <Pressable
                onPress={() => router.push('/(professor)/ProfessorMenu')}
              >
                <Text color={palette.darkBlue} fontWeight="bold">
                  → Gerenciar Questões
                </Text>
              </Pressable>
            )}
          </YStack>
        </YStack>
      </ZStack>
    </YStack>
  );
}
