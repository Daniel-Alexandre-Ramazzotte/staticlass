import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { YStack, XStack, Text, Input, Button } from 'tamagui';
import { ChevronLeft } from 'lucide-react-native';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';

export default function AddProfessor() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !department.trim()) {
      setErrorMessage('Todos os campos devem ser preenchidos');
      return;
    }

    try {
      const response = await api.post('/users/admin/create-professor', {
        name: name.trim(),
        email: email.trim(),
      });

      setErrorMessage('');

      const temporaryPassword = response?.data?.temporary_password;
      const successMessage = temporaryPassword
        ? `Professor criado com sucesso. Senha temporaria: ${temporaryPassword}`
        : 'Professor criado com sucesso.';

      if (Platform.OS === 'android') {
        ToastAndroid.show(successMessage, ToastAndroid.LONG);
        router.back();
        return;
      }

      Alert.alert('Sucesso', successMessage, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Nao foi possivel criar o professor');
    }
  };

  return (
    <YStack f={1} backgroundColor="#9ebfd8">
      {/*Header*/}
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$8" // Testar melhor
        pb="$4"
        px="$4"
        ai="center"
        jc="flex-start"
        width={'100%'}
        gap="$2"
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
          Adicionar Professor
        </Text>
      </XStack>

      <YStack flex={1} px="$5" pt={180}>
        <YStack gap="$6" width="100%">
          <YStack gap="$1">
            <Text
              backgroundColor="#507ea0"
              color={palette.offWhite}
              px="$2"
              py="$1"
              width="46%"
              fontFamily={primaryFontA}
              fontSize={24}
              lineHeight={38}
            >
              Nome:
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              backgroundColor="#70aad1"
              borderWidth={0}
              borderRadius={0}
              color={palette.offWhite}
              px="$2"
              width="92%"
              alignSelf="flex-end"
              fontSize={24}
            />
          </YStack>

          <YStack gap="$1">
            <Text
              backgroundColor="#507ea0"
              color={palette.offWhite}
              px="$2"
              py="$1"
              width="46%"
              fontFamily={primaryFontA}
              fontSize={24}
              lineHeight={38}
            >
              E-mail:
            </Text>
            <Input
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              backgroundColor="#70aad1"
              borderWidth={0}
              borderRadius={0}
              color={palette.offWhite}
              px="$2"
              width="92%"
              alignSelf="flex-end"
              fontSize={24}
            />
          </YStack>

          <YStack gap="$1">
            <Text
              backgroundColor="#507ea0"
              color={palette.offWhite}
              px="$2"
              py="$1"
              width="46%"
              fontFamily={primaryFontA}
              fontSize={24}
              lineHeight={38}
            >
              Departamento:
            </Text>
            <Input
              value={department}
              onChangeText={setDepartment}
              backgroundColor="#70aad1"
              borderWidth={0}
              borderRadius={0}
              color={palette.offWhite}
              px="$2"
              width="92%"
              alignSelf="flex-end"
              fontSize={24}
            />
          </YStack>

          <YStack ai="center" pt="$3" gap="$2">
            <Button
              onPress={handleSubmit}
              width="74%"
              height={56}
              borderRadius={28}
              backgroundColor="#4fb000"
              pressStyle={{ opacity: 0.9, scale: 0.99 }}
            >
              <Text
                color={palette.offWhite}
                fontFamily={primaryFontA}
                fontSize={30}
                lineHeight={44}
                mt={1}
              >
                Concluir
              </Text>
            </Button>

            {!!errorMessage && (
              <Text color="#ff4c4c" fontSize={14} fontWeight="600">
                {errorMessage}
              </Text>
            )}
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
