import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useEffect, useState } from 'react';
import { YStack, XStack, Text, Input, Button } from 'tamagui';
import { ChevronLeft } from 'lucide-react-native';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';

export default function AddProfessor() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    email?: string;
  }>();

  const professorId = params.id ? Number(params.id) : null;
  const isEditing = useMemo(() => professorId !== null && !Number.isNaN(professorId), [professorId]);

  const [name, setName] = useState(params.name ?? '');
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => router.back(), 1500);
    return () => clearTimeout(timer);
  }, [successMessage, router]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Nome e e-mail são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (isEditing && professorId !== null) {
        await api.put(`/users/admin/professors/${professorId}`, {
          name: name.trim(),
          email: email.trim(),
          password: password.trim() || undefined,
        });
        console.log(`[AddProfessor] Professor ${professorId} atualizado com sucesso.`);
        setSuccessMessage('Professor atualizado com sucesso!');
        return;
      }

      const response = await api.post('/users/admin/professors', {
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
      });

      const temporaryPassword = response?.data?.temporary_password;
      const msg = temporaryPassword
        ? `Professor criado! Senha temporária: ${temporaryPassword}`
        : 'Professor criado com sucesso!';

      console.log(`[AddProfessor] Professor criado. ${msg}`);
      setSuccessMessage(msg);
    } catch (error: any) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.error || error?.response?.data?.message;
      console.error('[AddProfessor] erro ao salvar:', status, error?.response?.data ?? error?.message);
      setErrorMessage(apiMessage || `Erro ${status ?? 'de rede'}: não foi possível salvar o professor`);
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
          {isEditing ? 'Editar Professor' : 'Adicionar Professor'}
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
              disabled={isSubmitting || !!successMessage}
              width="74%"
              height={56}
              borderRadius={28}
              backgroundColor={successMessage ? palette.primaryGreen : '#4fb000'}
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

            {!!successMessage && (
              <Text color={palette.primaryGreen} fontSize={15} fontWeight="700" textAlign="center">
                {successMessage}
              </Text>
            )}

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
