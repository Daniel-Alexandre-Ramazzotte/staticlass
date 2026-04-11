import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { Text, XStack, YStack, Button } from 'tamagui';

import { ListResultsPanel } from 'app/components/lists/ListResultsPanel';
import { palette, primaryFontA, primaryFontC } from 'app/constants/style';
import api from 'app/services/api';

type ProfessorList = {
  id: number;
  title: string;
  deadline: string;
  status: 'rascunho' | 'publicada' | 'encerrada';
  question_count: number;
  assigned_students: number;
  submitted_students: number;
  average_score_pct: number;
  highest_error_rate_pct: number;
};

export default function ListManagerScreen() {
  const router = useRouter();
  const [lists, setLists] = useState<ProfessorList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ProfessorList[]>('/lists');
      setLists(response.data);
      if (response.data.length === 0) {
        setSelectedListId(null);
      }
    } catch {
      setError('Não foi possível carregar as listas agora.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLists().catch(() => undefined);
      return () => undefined;
    }, [loadLists]),
  );

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
          Gerenciar Listas
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
              <TouchableOpacity style={styles.retryButton} onPress={() => loadLists().catch(() => undefined)}>
                <Text color="#fff" fontSize={12} fontWeight="700">
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <YStack gap="$3">
            {lists.map((list) => (
              <View key={list.id} style={styles.card}>
                <XStack ai="center" jc="space-between" gap="$3">
                  <YStack f={1} gap="$2">
                    <Text color={palette.darkBlue} fontSize={17} fontWeight="700">
                      {list.title}
                    </Text>
                    <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                      Prazo: {new Date(list.deadline).toLocaleDateString('pt-BR')}
                    </Text>
                  </YStack>
                  <View style={[styles.statusChip, list.status === 'encerrada' ? styles.warningChip : null]}>
                    <Text color="#fff" fontSize={11} fontWeight="700">
                      {list.status === 'rascunho'
                        ? 'Rascunho'
                        : list.status === 'encerrada'
                          ? 'Encerrada'
                          : 'Publicada'}
                    </Text>
                  </View>
                </XStack>

                <XStack mt="$3" flexWrap="wrap" gap="$3">
                  <Text color={palette.darkBlue} fontSize={13} fontFamily={primaryFontC}>
                    {list.question_count} questões
                  </Text>
                  <Text color={palette.darkBlue} fontSize={13} fontFamily={primaryFontC}>
                    {list.assigned_students} alunos
                  </Text>
                  <Text color={palette.darkBlue} fontSize={13} fontFamily={primaryFontC}>
                    {list.submitted_students} envios
                  </Text>
                  <Text color={palette.primaryGreen} fontSize={13} fontWeight="700">
                    Média: {list.average_score_pct.toFixed(0)}%
                  </Text>
                </XStack>

                <XStack mt="$4" gap="$3">
                  <TouchableOpacity
                    style={[styles.ctaButton, styles.secondaryButton]}
                    onPress={() =>
                      router.push({
                        pathname: '/(professor)/CreateNewList',
                        params: { id: String(list.id) },
                      })
                    }
                  >
                    <Text color="#fff" fontSize={12} fontWeight="700">
                      Editar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ctaButton, styles.primaryButton]}
                    onPress={() => setSelectedListId(list.id)}
                  >
                    <Text color="#fff" fontSize={12} fontWeight="700">
                      Ver resultados
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </View>
            ))}
          </YStack>

          {lists.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text color={palette.darkBlue} fontSize={16} fontWeight="700" fontFamily={primaryFontA}>
                Ainda não há envios
              </Text>
              <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC} mt="$2">
                Crie e publique sua primeira lista para acompanhar os resultados por aqui.
              </Text>
            </View>
          ) : null}

          {selectedListId ? <ListResultsPanel listId={selectedListId} /> : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.offWhite,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  errorBanner: {
    backgroundColor: '#fff3f2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f2b8b5',
    marginBottom: 16,
    gap: 12,
  },
  retryButton: {
    backgroundColor: palette.primaryBlue,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  statusChip: {
    backgroundColor: palette.primaryGreen,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  warningChip: {
    backgroundColor: '#f57c00',
  },
  ctaButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: palette.primaryGreen,
  },
  secondaryButton: {
    backgroundColor: palette.darkBlue,
  },
  emptyCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
    marginTop: 16,
  },
});
