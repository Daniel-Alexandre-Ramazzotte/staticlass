import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { Button, Input, Text, XStack, YStack } from 'tamagui';

import { AppButton } from 'app/components/AppButton';
import { palette, primaryFontA, primaryFontC } from 'app/constants/style';
import api from 'app/services/api';

type ChangeLogEntry = {
  id: number;
  action: string;
  summary: string;
  created_at: string;
};

type ListDetailResponse = {
  id: number;
  title: string;
  deadline: string;
  status: 'rascunho' | 'publicada' | 'encerrada';
  question_ids: number[];
  question_count: number;
  change_log: ChangeLogEntry[];
};

const STATUS_LABELS: Record<ListDetailResponse['status'], string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  encerrada: 'Encerrada',
};

function formatDateForInput(value: string) {
  return value ? value.slice(0, 10) : '';
}

export default function CreateNewListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const listId = useMemo(
    () => (typeof params.id === 'string' ? Number(params.id) : NaN),
    [params.id],
  );
  const hasListId = !Number.isNaN(listId);

  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [status, setStatus] = useState<ListDetailResponse['status']>('rascunho');
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(hasListId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrateFromServer = useCallback(async () => {
    if (!hasListId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ListDetailResponse>(`/lists/${listId}`);
      setTitle(response.data.title);
      setDeadline(formatDateForInput(response.data.deadline));
      setQuestionIds(response.data.question_ids ?? []);
      setStatus(response.data.status);
      setChangeLog(response.data.change_log ?? []);
    } catch {
      setError('Não foi possível carregar essa lista.');
    } finally {
      setLoading(false);
    }
  }, [hasListId, listId]);

  useFocusEffect(
    useCallback(() => {
      hydrateFromServer().catch(() => undefined);
      return () => undefined;
    }, [hydrateFromServer]),
  );

  const ensureMetadata = useCallback(() => {
    if (!title.trim() || !deadline.trim()) {
      Alert.alert('Dados incompletos', 'Preencha título e prazo antes de continuar.');
      return false;
    }
    return true;
  }, [deadline, title]);

  const persistDraft = useCallback(async () => {
    if (!ensureMetadata()) return null;

    const payload = {
      title: title.trim(),
      deadline,
      question_ids: questionIds,
    };

    if (hasListId) {
      await api.put(`/lists/${listId}`, payload);
      return listId;
    }

    const response = await api.post<{ id: number }>('/lists', payload);
    return response.data.id;
  }, [deadline, ensureMetadata, hasListId, listId, questionIds, title]);

  const handleSelectQuestions = useCallback(async () => {
    try {
      setSaving(true);
      const draftId = await persistDraft();
      if (!draftId) return;
      router.push({
        pathname: '/(app)/QuestionPicker',
        params: {
          listId: String(draftId),
          returnTo: '/(professor)/CreateNewList',
        },
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o seletor de questões.');
    } finally {
      setSaving(false);
    }
  }, [persistDraft, router]);

  const handleSaveDraft = useCallback(async () => {
    try {
      setSaving(true);
      const draftId = await persistDraft();
      if (draftId && !hasListId) {
        router.replace({
          pathname: '/(professor)/CreateNewList',
          params: { id: String(draftId) },
        });
      } else {
        hydrateFromServer().catch(() => undefined);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o rascunho.');
    } finally {
      setSaving(false);
    }
  }, [hasListId, hydrateFromServer, persistDraft, router]);

  const handlePublish = useCallback(async () => {
    if (!title.trim() || !deadline.trim() || questionIds.length < 1) return;
    try {
      setSaving(true);
      const draftId = await persistDraft();
      if (!draftId) return;
      await api.post(`/lists/${draftId}/publish`);
      router.replace({
        pathname: '/(professor)/CreateNewList',
        params: { id: String(draftId) },
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar a lista.');
    } finally {
      setSaving(false);
    }
  }, [deadline, persistDraft, questionIds.length, router, title]);

  const handleSavePublishedChanges = useCallback(async () => {
    try {
      setSaving(true);
      await api.put(`/lists/${listId}`, {
        title: title.trim(),
        deadline,
        question_ids: questionIds,
      });
      hydrateFromServer().catch(() => undefined);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }, [deadline, hydrateFromServer, listId, questionIds, title]);

  const publishDisabled = !title.trim() || !deadline.trim() || questionIds.length < 1 || saving;

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
          Criar lista
        </Text>
      </XStack>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={palette.primaryBlue} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <YStack gap="$4">
            {error ? (
              <View style={styles.errorBanner}>
                <Text color={palette.red} fontSize={14}>
                  {error}
                </Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Metadados</Text>
              <Text style={styles.label}>Título da lista</Text>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Ex.: Lista de Probabilidade"
                backgroundColor="#fff"
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Prazo</Text>
              <Input
                value={deadline}
                onChangeText={setDeadline}
                placeholder="AAAA-MM-DD"
                backgroundColor="#fff"
              />

              <XStack ai="center" jc="space-between" mt="$4">
                <Text color={palette.darkBlue} fontSize={14} fontFamily={primaryFontC}>
                  Status atual
                </Text>
                <View style={[styles.statusBadge, status !== 'rascunho' ? styles.statusBadgeLive : null]}>
                  <Text color="#fff" fontSize={12} fontWeight="700">
                    {STATUS_LABELS[status]}
                  </Text>
                </View>
              </XStack>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Questões selecionadas</Text>
              <Text color={palette.darkBlue} fontSize={15} fontWeight="700">
                {questionIds.length} questão(ões)
              </Text>
              <Text color="#54657a" fontSize={13} fontFamily={primaryFontC} mt="$2" mb="$3">
                Escolha as questões da lista pelo navegador compartilhado.
              </Text>
              <AppButton
                backgroundColor={palette.darkBlue}
                onPress={handleSelectQuestions}
              >
                Selecionar questões
              </AppButton>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ações</Text>
              <YStack gap="$3">
                {status === 'rascunho' ? (
                  <>
                    <AppButton
                      backgroundColor={palette.darkBlue}
                      onPress={handleSaveDraft}
                    >
                      Salvar rascunho
                    </AppButton>
                    <AppButton
                      backgroundColor={publishDisabled ? palette.grey : palette.primaryGreen}
                      onPress={handlePublish}
                      disabled={publishDisabled}
                    >
                      Publicar lista
                    </AppButton>
                  </>
                ) : (
                  <AppButton
                    backgroundColor={palette.primaryGreen}
                    onPress={handleSavePublishedChanges}
                    disabled={saving}
                  >
                    Salvar alterações
                  </AppButton>
                )}
              </YStack>
            </View>

            {status !== 'rascunho' ? (
              <View style={styles.warningBanner}>
                <Text color="#8a4b00" fontSize={13} fontWeight="700">
                  As alterações ficam visíveis imediatamente para todos os alunos.
                </Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Histórico de alterações</Text>
              {changeLog.length === 0 ? (
                <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC}>
                  Ainda não há alterações registradas.
                </Text>
              ) : (
                <YStack gap="$3">
                  {changeLog.map((entry) => (
                    <View key={entry.id} style={styles.changeLogRow}>
                      <Text color={palette.darkBlue} fontSize={13} fontWeight="700">
                        {entry.summary}
                      </Text>
                      <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                        {new Date(entry.created_at).toLocaleString('pt-BR')}
                      </Text>
                    </View>
                  ))}
                </YStack>
              )}
            </View>
          </YStack>
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
  card: {
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  cardTitle: {
    color: palette.darkBlue,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: primaryFontA,
    marginBottom: 12,
  },
  label: {
    color: palette.darkBlue,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusBadge: {
    backgroundColor: palette.darkBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeLive: {
    backgroundColor: palette.primaryGreen,
  },
  warningBanner: {
    backgroundColor: '#fff4e8',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ffcf99',
  },
  changeLogRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ef',
    paddingBottom: 10,
  },
  errorBanner: {
    backgroundColor: '#fff3f2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f2b8b5',
  },
});
