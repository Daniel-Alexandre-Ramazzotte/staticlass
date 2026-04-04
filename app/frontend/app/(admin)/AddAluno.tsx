import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { YStack, XStack, Text, Input, Button } from 'tamagui';
import { ChevronLeft } from 'lucide-react-native';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';

function notifySuccess(message: string, onClose: () => void) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
    onClose();
    return;
  }
  Alert.alert('Sucesso', message, [{ text: 'OK', onPress: onClose }]);
}

export default function AddAluno() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    email?: string;
  }>();

  const alunoId = params.id ? Number(params.id) : null;
  const isEditing = useMemo(() => alunoId !== null && !Number.isNaN(alunoId), [alunoId]);

  const [name, setName] = useState(params.name ?? '');
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Nome e e-mail são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && alunoId !== null) {
        await api.put(`/users/admin/alunos/${alunoId}`, {
          name: name.trim(),
          email: email.trim(),
          password: password.trim() || undefined,
        });
        setErrorMessage('');
        notifySuccess('Aluno atualizado com sucesso.', () => router.back());
        return;
      }

      const response = await api.post('/users/admin/alunos', {
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
      });

      setErrorMessage('');
      const temporaryPassword = response?.data?.temporary_password;
      const successMessage = temporaryPassword
        ? `Aluno criado com sucesso. Senha temporária: ${temporaryPassword}`
        : 'Aluno criado com sucesso.';

      notifySuccess(successMessage, () => router.back());
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error;
      setErrorMessage(apiMessage || 'Não foi possível salvar o aluno');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <YStack f={1} backgroundColor="#9ebfd8">
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$8"
        pb="$4"
        px="$4"
        ai="center"
        jc="flex-start"
        width="100%"
        gap="$2"
      >
        <Button
          size="$3"
          circular
          backgroundColor="transparent"
          pressStyle={{ opacity: 0.7 }}
          onPress={() => router.back()}
          icon={<ChevronLeft color={palette.white} size={28} />}
        />
        <Text
          f={1}
          color="#fff"
          fontSize="$8"
          fontWeight="bold"
          textAlign="center"
          mr="$6"
        >
          {isEditing ? 'Editar Aluno' : 'Adicionar Aluno'}
        </Text>
      </XStack>

      <YStack flex={1} px="$5" pt={140}>
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
              {isEditing ? 'Nova senha:' : 'Senha:'}
            </Text>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              backgroundColor="#70aad1"
              borderWidth={0}
              borderRadius={0}
              color={palette.offWhite}
              px="$2"
              width="92%"
              alignSelf="flex-end"
              fontSize={24}
              placeholder="Opcional"
              placeholderTextColor="rgba(255,255,255,0.7)"
            />
          </YStack>

          <YStack ai="center" pt="$3" gap="$2">
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
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
                {isEditing ? 'Salvar' : 'Concluir'}
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
