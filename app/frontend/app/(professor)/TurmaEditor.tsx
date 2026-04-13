import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Check, ChevronLeft } from '@tamagui/lucide-icons';
import { Button, Text, XStack, YStack } from 'tamagui';

import { AppButton } from 'app/components/AppButton';
import { palette, primaryFontA, primaryFontC } from 'app/constants/style';
import api from 'app/services/api';

type Aluno = { id: number; name: string; email: string };

export default function TurmaEditor() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const turmaId = Number(id);

  const [turmaName, setTurmaName] = useState('');
  const [allAlunos, setAllAlunos] = useState<Aluno[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [turmaRes, alunosRes] = await Promise.all([
        api.get(`/turmas/${turmaId}`),
        api.get<Aluno[]>('/users/alunos'),
      ]);
      setTurmaName(turmaRes.data.name ?? '');
      setEnrolledIds(new Set<number>((turmaRes.data.students ?? []).map((s: Aluno) => s.id)));
      setAllAlunos(alunosRes.data ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a turma.');
    } finally {
      setLoading(false);
    }
  }, [turmaId]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
      return () => undefined;
    }, [load]),
  );

  const toggleAluno = (alunoId: number) => {
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      if (next.has(alunoId)) {
        next.delete(alunoId);
      } else {
        next.add(alunoId);
      }
      return next;
    });
  };

  const saveName = async () => {
    if (!turmaName.trim()) return;
    setSavingName(true);
    try {
      await api.put(`/turmas/${turmaId}`, { name: turmaName.trim() });
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o nome.');
    } finally {
      setSavingName(false);
    }
  };

  const saveEnrollment = async () => {
    setSaving(true);
    try {
      await api.post(`/turmas/${turmaId}/students`, { student_ids: Array.from(enrolledIds) });
      Alert.alert('Matrículas salvas', `${enrolledIds.size} aluno(s) matriculado(s).`);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as matrículas.');
    } finally {
      setSaving(false);
    }
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
          Editar turma
        </Text>
      </XStack>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={palette.primaryBlue} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Name card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nome da turma</Text>
            <TextInput
              style={styles.nameInput}
              value={turmaName}
              onChangeText={setTurmaName}
              placeholder="Ex.: Turma A — Estatística 2026"
            />
            <AppButton
              backgroundColor={savingName ? palette.grey : palette.darkBlue}
              onPress={saveName}
              disabled={savingName}
            >
              Salvar nome
            </AppButton>
          </View>

          {/* Alunos card */}
          <View style={[styles.card, styles.cardMarginTop]}>
            <Text style={styles.cardTitle}>
              Alunos matriculados ({enrolledIds.size} / {allAlunos.length})
            </Text>
            <YStack gap="$1" mt="$2">
              {allAlunos.map((a) => {
                const enrolled = enrolledIds.has(a.id);
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.alunoRow, enrolled ? styles.alunoRowEnrolled : null]}
                    onPress={() => toggleAluno(a.id)}
                    activeOpacity={0.7}
                  >
                    <YStack f={1}>
                      <Text
                        color={palette.darkBlue}
                        fontSize={14}
                        fontWeight={enrolled ? '700' : '400'}
                      >
                        {a.name}
                      </Text>
                      <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                        {a.email}
                      </Text>
                    </YStack>
                    {enrolled ? <Check color={palette.primaryGreen} size={20} /> : null}
                  </TouchableOpacity>
                );
              })}
              {allAlunos.length === 0 ? (
                <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC}>
                  Nenhum aluno cadastrado no sistema.
                </Text>
              ) : null}
            </YStack>
          </View>

          <View style={styles.saveSection}>
            <AppButton
              backgroundColor={saving ? palette.grey : palette.primaryGreen}
              onPress={saveEnrollment}
              disabled={saving}
            >
              Salvar matrículas
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
  card: {
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  cardMarginTop: { marginTop: 16 },
  cardTitle: {
    color: palette.darkBlue,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: primaryFontA,
    marginBottom: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#dbe4ee',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  alunoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  alunoRowEnrolled: { backgroundColor: 'rgba(85,191,68,0.12)' },
  saveSection: { marginTop: 24 },
});
