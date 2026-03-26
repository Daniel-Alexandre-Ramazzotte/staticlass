import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from 'app/context/AuthContext';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Input, Button } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, email: authEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authEmail) return;
    api.get(`/users/profile/${authEmail.trim()}`)
      .then(r => { setEmail(r.data?.email || ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authEmail]);

  const handleSaveEmail = async () => {
    if (!email.trim()) { Alert.alert('Erro', 'Email inválido.'); return; }
    setSaving(true);
    try {
      await api.put('/users/update-me', { email: email.trim() });
      Alert.alert('E-mail Alterado', 'Faça login novamente.', [{
        text: 'OK', onPress: async () => { await signOut(); router.replace('/(public)/login'); },
      }]);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao atualizar.');
    } finally { setSaving(false); }
  };

  const handleSavePassword = async () => {
    if (!password || password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.'); return;
    }
    setSaving(true);
    try {
      await api.put('/users/update-me', { password, confirm_password: confirmPassword });
      Alert.alert('Sucesso', 'Senha atualizada!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao atualizar.');
    } finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert('Deletar conta', 'Esta ação não pode ser desfeita. Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/users/delete-me');
            await signOut();
            router.replace('/(public)/login');
          } catch (e: any) {
            Alert.alert('Erro', e.response?.data?.error || 'Erro ao deletar.');
          }
        },
      },
    ]);
  };

  if (loading) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: palette.primaryBlue }}
    >
      {/* Header */}
      <XStack
        backgroundColor={palette.primaryBlue}
        pt="$10"
        pb="$4"
        px="$4"
        ai="center"
        gap="$3"
      >
        <Button
          circular
          size="$3"
          backgroundColor="transparent"
          pressStyle={{ opacity: 0.7 }}
          onPress={() => router.back()}
          icon={<ChevronLeft color={palette.white} size={24} />}
        />
        <Text color={palette.white} fontSize={20} fontWeight="bold" fontFamily={primaryFontA}>
          Configurações
        </Text>
      </XStack>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#5b9ecc' }}
        contentContainerStyle={{ padding: 24, gap: 8 }}
      >
        <Text color={palette.white} fontSize={16} fontWeight="bold" textDecorationLine="underline" mb="$2">
          Conta
        </Text>

        {/* Alterar Email */}
        <Text color={palette.white} fontSize={14} mb="$1">Alterar E-mail</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Novo e-mail"
          placeholderTextColor="rgba(255,255,255,0.6)"
          backgroundColor="rgba(255,255,255,0.2)"
          color={palette.white}
          borderWidth={0}
          mb="$3"
        />
        <Button
          backgroundColor="rgba(255,255,255,0.25)"
          color={palette.white}
          onPress={handleSaveEmail}
          disabled={saving}
          mb="$4"
        >
          Salvar E-mail
        </Button>

        {/* Alterar Senha */}
        <Text color={palette.white} fontSize={14} mb="$1">Alterar Senha</Text>
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Nova senha"
          placeholderTextColor="rgba(255,255,255,0.6)"
          backgroundColor="rgba(255,255,255,0.2)"
          color={palette.white}
          borderWidth={0}
          secureTextEntry
          mb="$2"
        />
        <Input
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirmar senha"
          placeholderTextColor="rgba(255,255,255,0.6)"
          backgroundColor="rgba(255,255,255,0.2)"
          color={palette.white}
          borderWidth={0}
          secureTextEntry
          mb="$3"
        />
        <Button
          backgroundColor="rgba(255,255,255,0.25)"
          color={palette.white}
          onPress={handleSavePassword}
          disabled={saving}
          mb="$8"
        >
          Salvar Senha
        </Button>

        {/* Delete */}
        <Button
          backgroundColor={palette.red}
          color={palette.white}
          borderRadius={30}
          height={50}
          onPress={handleDelete}
        >
          Deletar conta
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
