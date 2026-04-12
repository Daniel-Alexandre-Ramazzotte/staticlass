import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { Button, Text, XStack, YStack } from 'tamagui';

import { AppButton } from 'app/components/AppButton';
import { palette, primaryFontA, primaryFontC } from 'app/constants/style';
import api from 'app/services/api';

type Turma = { id: number; name: string; student_count: number; created_at: string };

export default function TurmaManager() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<Turma[]>('/turmas');
      setTurmas(r.data ?? []);
    } catch {
      setError('Não foi possível carregar as turmas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
      return () => undefined;
    }, [load]),
  );

  const handleCreate = () => {
    Alert.prompt('Nova turma', 'Nome da turma:', async (name) => {
      if (!name?.trim()) return;
      try {
        await api.post('/turmas', { name: name.trim() });
        load().catch(() => undefined);
      } catch {
        Alert.alert('Erro', 'Não foi possível criar a turma.');
      }
    });
  };

  const handleDelete = (turma: Turma) => {
    Alert.alert(
      'Excluir turma',
      `Excluir "${turma.name}"? Os alunos serão removidos da turma.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/turmas/${turma.id}`);
              load().catch(() => undefined);
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a turma.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <XStack backgroundColor={palette.primaryBlue} pt="$8" pb="$4" px="$4" ai="center" gap="$3">
        <Button
          size="$3"
          circular
          backgroundColor="transparent"
          pressStyle={{ opacity: 0.7 }}
          onPress={() => router.back()}
          icon={<ChevronLeft color={palette.white} size={28} />}
        />
        <Text color={palette.white} fontSize={20} fontWeight="700" fontFamily={primaryFontA}>
          Turmas
        </Text>
      </XStack>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={palette.primaryBlue} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {error ? (
            <View style={styles.errorBanner}>
              <Text color={palette.red} fontSize={14}>
                {error}
              </Text>
            </View>
          ) : null}

          <YStack gap="$3">
            {turmas.map((t) => (
              <View key={t.id} style={styles.card}>
                <Text color={palette.darkBlue} fontSize={17} fontWeight="700">
                  {t.name}
                </Text>
                <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC} style={{ marginTop: 4 }}>
                  {t.student_count} aluno(s)
                </Text>
                <XStack mt="$3" gap="$3">
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSecondary]}
                    onPress={() =>
                      router.push({
                        pathname: '/(professor)/TurmaEditor',
                        params: { id: String(t.id) },
                      })
                    }
                  >
                    <Text color="#fff" fontSize={12} fontWeight="700">
                      Gerenciar alunos
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnDanger]}
                    onPress={() => handleDelete(t)}
                  >
                    <Text color="#fff" fontSize={12} fontWeight="700">
                      Excluir
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </View>
            ))}

            {turmas.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text color={palette.darkBlue} fontSize={16} fontWeight="700">
                  Nenhuma turma criada
                </Text>
                <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC} style={{ marginTop: 8 }}>
                  Crie uma turma para associar alunos e publicar listas direcionadas.
                </Text>
              </View>
            ) : null}
          </YStack>

          <View style={styles.createSection}>
            <AppButton backgroundColor={palette.primaryGreen} onPress={handleCreate}>
              Nova turma
            </AppButton>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.offWhite },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 48 },
  errorBanner: {
    backgroundColor: '#fff3f2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f2b8b5',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  emptyCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  btn: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  btnSecondary: { backgroundColor: palette.darkBlue },
  btnDanger: { backgroundColor: palette.red },
  createSection: { marginTop: 24 },
});
