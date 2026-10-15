import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { Button, Text, XStack } from 'tamagui';

import { AppButton } from 'app/components/AppButton';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';
import { StudentPickerList, type Aluno } from 'app/components/turmas/StudentPickerList';

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ enrolled: number; invited: number; skipped: number } | null>(null);

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

  const handleImport = async () => {
    if (!importText.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await api.post(`/turmas/${turmaId}/invite`, { raw_list: importText });
      setImportResult(res.data);
      await load();
    } catch {
      Alert.alert('Erro', 'Não foi possível importar a lista.');
    } finally {
      setImportLoading(false);
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
            <StudentPickerList alunos={allAlunos} enrolledIds={enrolledIds} onToggle={toggleAluno} />
          </View>

          <View style={styles.saveSection}>
            <AppButton
              backgroundColor={saving ? palette.grey : palette.primaryGreen}
              onPress={saveEnrollment}
              disabled={saving}
            >
              Salvar matrículas
            </AppButton>
            <View style={{ marginTop: 12 }}>
              <AppButton
                backgroundColor={palette.darkBlue}
                onPress={() => { setImportResult(null); setShowImportModal(true); }}
              >
                Importar lista
              </AppButton>
            </View>
          </View>
        </ScrollView>
      )}

      <Modal visible={showImportModal} animationType="slide" transparent>
        <View style={importStyles.overlay}>
          <View style={importStyles.sheet}>
            <Text style={importStyles.title}>Importar alunos por lista</Text>
            <Text style={importStyles.hint}>
              Cole um email por linha, ou no formato:{'\n'}
              <Text style={{ fontWeight: '700' }}>Nome Completo {'<email@exemplo.com>'}</Text>
            </Text>
            <TextInput
              style={importStyles.textarea}
              multiline
              numberOfLines={8}
              value={importText}
              onChangeText={setImportText}
              placeholder={'João Silva <joao@uem.br>\nMaria <maria@exemplo.com>'}
              textAlignVertical="top"
            />
            {importResult && (
              <View style={importStyles.result}>
                <Text style={importStyles.resultText}>
                  ✓ {importResult.enrolled} matriculados · {importResult.invited} convites enviados · {importResult.skipped} ignorados
                </Text>
              </View>
            )}
            <View style={importStyles.actions}>
              <TouchableOpacity
                style={[importStyles.btn, importStyles.btnSecondary]}
                onPress={() => { setShowImportModal(false); setImportText(''); setImportResult(null); }}
              >
                <Text style={importStyles.btnSecondaryText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[importStyles.btn, importStyles.btnPrimary, (!importText.trim() || importLoading) && { opacity: 0.5 }]}
                onPress={handleImport}
                disabled={!importText.trim() || importLoading}
              >
                {importLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={importStyles.btnPrimaryText}>Importar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  saveSection: { marginTop: 24 },
});

const importStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.darkBlue,
  },
  hint: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#dbe4ee',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    minHeight: 140,
    backgroundColor: '#f9fafb',
  },
  result: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 10,
  },
  resultText: {
    color: '#2e7d32',
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: palette.primaryGreen },
  btnSecondary: { backgroundColor: '#eef0f3' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondaryText: { color: palette.darkBlue, fontWeight: '600', fontSize: 15 },
});
