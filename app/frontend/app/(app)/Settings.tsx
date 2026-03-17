import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  View,
  Text,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { YStack, XStack, Input, Button, Label, Card } from 'tamagui';
import { LogOut, Trash2, ChevronLeft, User, Lock } from '@tamagui/lucide-icons';

import api from '../services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, email: authEmail } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Carregamento Inicial usando o email do Contexto
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authEmail) return;

      try {
        const response = await api.get(`/users/profile/${authEmail.trim()}`);

        if (response.data) {
          setName(response.data.name || '');
          setEmail(response.data.email || '');
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        Alert.alert('Erro', 'Não foi possível carregar seus dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authEmail]);

  //Salvar Perfil
  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    // Verifica se o e-mail foi alterado
    const emailAlterado =
      email.trim().toLowerCase() !== authEmail?.trim().toLowerCase();

    setIsSaving(true);
    try {
      const payload = {
        name,
        email: email.trim(),
        password: password || undefined,
        confirm_password: confirmPassword || undefined,
      };

      await api.put('/users/update-me', payload);

      if (emailAlterado) {
        // Se mudou o e-mail, precisamos de um novo Token (Sair e Entrar)
        Alert.alert(
          'E-mail Alterado',
          'Como você alterou seu e-mail, você precisará fazer login novamente.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await signOut();
                router.replace('/(public)/Login');
              },
            },
          ]
        );
      } else {
        // Se mudou apenas nome ou senha, segue o fluxo normal
        Alert.alert('Sucesso', 'Perfil atualizado!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Falha', err.response?.data?.error || 'Erro ao atualizar.');
    } finally {
      setIsSaving(false);
    }
  };

  //Logout
  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        onPress: async () => {
          await signOut();
          router.replace('/(public)/Login');
        },
      },
    ]);
  };

  //Exclusão
  const handleDeleteClick = () => setShowDeleteModal(true);

  const confirmDeletionStep2 = () => {
    if (!deletePassword) {
      Alert.alert('Erro', 'Digite sua senha para continuar.');
      return;
    }
    Alert.alert('Tem certeza absoluta?', 'Esta ação não pode ser desfeita.', [
      { text: 'Desistir', style: 'cancel' },
      {
        text: 'EXCLUIR TUDO',
        style: 'destructive',
        onPress: finalDeleteAction,
      },
    ]);
  };

  const finalDeleteAction = async () => {
    try {
      const response = await api.delete('/users/delete-me', {
        data: { password: deletePassword },
      });

      console.log('Resposta do servidor:', response.data);

      setShowDeleteModal(false);
      await signOut();

      Alert.alert('Conta Excluída', 'Seus dados foram removidos.');
      router.replace('/(public)/Login');
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Senha incorreta.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Configurações</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      {/* Header */}
      <XStack
        alignItems="center"
        padding="$4"
        gap="$2"
        backgroundColor="#fff"
        borderBottomWidth={1}
        borderBottomColor="#eee"
      >
        <Button
          icon={<ChevronLeft color="#000" />}
          circular
          onPress={() => router.back()}
          backgroundColor="transparent"
          chromeless
        />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
          Configurações
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <YStack gap="$4">
          {/* Dados Pessoais */}
          <Card bordered padding="$4" backgroundColor="#fff">
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <User size={18} color="#007AFF" />
                <Text style={{ fontWeight: '600', color: '#000' }}>
                  Dados Pessoais
                </Text>
              </XStack>

              <Label color="#000">Nome</Label>
              <Input
                backgroundColor="#fff"
                color="#000"
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor="#999"
              />

              <Label color="#000">E-mail</Label>
              <Input
                backgroundColor="#fff"
                color="#000"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="seu@email.com"
                placeholderTextColor="#999"
              />
            </YStack>
          </Card>

          {/* Senha */}
          <Card bordered padding="$4" backgroundColor="#fff">
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Lock size={18} color="#007AFF" />
                <Text style={{ fontWeight: '600', color: '#000' }}>
                  Segurança (Opcional)
                </Text>
              </XStack>

              <Input
                backgroundColor="#fff"
                color="#000"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Nova senha"
                placeholderTextColor="#999"
              />

              <Input
                backgroundColor="#fff"
                color="#000"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar nova senha"
                placeholderTextColor="#999"
              />
            </YStack>
          </Card>

          <Button
            onPress={handleSave}
            backgroundColor="#007AFF"
            color="white"
            fontWeight="bold"
            height={50}
            disabled={isSaving}
            opacity={isSaving ? 0.5 : 1}
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>

          <Button
            icon={LogOut}
            onPress={handleLogout}
            backgroundColor="white"
            borderColor="#007AFF"
            borderWidth={1}
            color="#007AFF"
            height={50}
          >
            Sair da Conta
          </Button>

          <Button
            icon={Trash2}
            backgroundColor="white"
            borderColor="#FF3B30"
            color="#FF3B30"
            borderWidth={1}
            onPress={handleDeleteClick}
          >
            Excluir Minha Conta
          </Button>
        </YStack>
      </ScrollView>

      {/* Modal de Exclusão */}
      {showDeleteModal && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'center', padding: 20 }}
          >
            <Card bordered padding="$5" backgroundColor="white" elevate>
              <YStack space="$4">
                <Text
                  style={{ fontSize: 18, fontWeight: 'bold', color: '#FF3B30' }}
                >
                  Confirmar Exclusão
                </Text>
                <Text style={{ color: '#666' }}>
                  Digite sua senha atual para autorizar a exclusão da conta.
                </Text>

                <Input
                  secureTextEntry
                  placeholder="Senha atual"
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  backgroundColor="#f9f9f9"
                  color="#000"
                  placeholderTextColor="#000"
                  autoFocus
                />

                <XStack space="$2" justifyContent="flex-end">
                  <Button
                    onPress={() => {
                      setShowDeleteModal(false);
                      setDeletePassword('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    backgroundColor="#FF3B30"
                    color="white"
                    onPress={confirmDeletionStep2}
                  >
                    Confirmar
                  </Button>
                </XStack>
              </YStack>
            </Card>
          </KeyboardAvoidingView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
