import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { Text, XStack } from 'tamagui';

import { SharedQuestionViewer } from 'app/components/questions/SharedQuestionViewer';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';

type ListDetailResponse = {
  id: number;
  title: string;
  deadline: string;
  status: 'rascunho' | 'publicada' | 'encerrada';
  question_ids: number[];
  question_count: number;
  change_log: {
    id: number;
    action: string;
    summary: string;
    created_at: string;
  }[];
};

export default function QuestionPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    listId?: string;
    returnTo?: string;
    mode?: string;
  }>();
  const listId = useMemo(
    () => (typeof params.listId === 'string' ? Number(params.listId) : NaN),
    [params.listId],
  );
  const manageMode = params.mode === 'manage' || Number.isNaN(listId);
  const returnTo =
    typeof params.returnTo === 'string' ? params.returnTo : '/(professor)/CreateNewList';

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [metadata, setMetadata] = useState<ListDetailResponse | null>(null);
  const [loading, setLoading] = useState(!manageMode);

  const loadList = useCallback(async () => {
    if (manageMode || Number.isNaN(listId)) return;
    setLoading(true);
    try {
      const response = await api.get<ListDetailResponse>(`/lists/${listId}`);
      setMetadata(response.data);
      setSelectedQuestionIds(response.data.question_ids ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a lista atual.');
    } finally {
      setLoading(false);
    }
  }, [listId, manageMode]);

  useFocusEffect(
    useCallback(() => {
      loadList().catch(() => undefined);
      return () => undefined;
    }, [loadList]),
  );

  const handleConfirmSelection = useCallback(async () => {
    if (!metadata) return;
    try {
      await api.put(`/lists/${metadata.id}`, {
        title: metadata.title,
        deadline: metadata.deadline,
        question_ids: selectedQuestionIds,
      });
      router.replace({
        pathname: returnTo,
        params: { id: String(metadata.id) },
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a seleção de questões.');
    }
  }, [metadata, returnTo, router, selectedQuestionIds]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <XStack backgroundColor={palette.primaryBlue} pt="$8" pb="$4" px="$4" ai="center" gap="$3">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={palette.white} size={24} />
        </TouchableOpacity>
        <Text color={palette.white} fontSize={20} fontWeight="700" fontFamily={primaryFontA}>
          {manageMode ? 'Gerenciar Questões' : 'Selecionar questões'}
        </Text>
      </XStack>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={palette.primaryBlue} />
        </View>
      ) : (
        <SharedQuestionViewer
          mode={manageMode ? 'manage' : 'pick'}
          selectedQuestionIds={selectedQuestionIds}
          onToggleQuestion={(questionId) =>
            setSelectedQuestionIds((current) =>
              current.includes(questionId)
                ? current.filter((value) => value !== questionId)
                : [...current, questionId],
            )
          }
          onConfirmSelection={manageMode ? undefined : handleConfirmSelection}
          returnTo={returnTo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
