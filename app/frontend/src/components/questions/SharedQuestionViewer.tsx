import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Pencil, Search, Trash2 } from '@tamagui/lucide-icons';
import { Text, XStack } from 'tamagui';

import { AppButton, useLayout } from 'app/components/AppButton';
import { palette, primaryFontA } from 'app/constants/style';
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';

type ViewerMode = 'manage' | 'pick';

type Alternativa = {
  letter: string;
  text: string;
  is_correct: boolean;
};

type Capitulo = {
  id: number;
  name: string;
  number: number;
};

type Topico = {
  id: number;
  name: string;
  chapter_id: number;
};

type Questao = {
  id: number;
  enunciado: string;
  resposta_correta: string;
  solucao: string | null;
  dificuldade: number | null;
  capitulo: string | null;
  capitulo_numero: number | null;
  topico: string | null;
  source?: string | null;
  can_manage?: boolean;
  alternativas: Alternativa[];
};

type SharedQuestionViewerProps = {
  mode: ViewerMode;
  selectedQuestionIds?: number[];
  onToggleQuestion?: (questionId: number) => void;
  onConfirmSelection?: () => void;
  returnTo?: string;
};

type QuestoesResponse = {
  questoes: Questao[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
};

const CAP_NOMES: Record<number, string> = {
  1: 'Estatística Básica',
  2: 'Probabilidade',
  3: 'Introdução à Inferência',
  4: 'Introdução à Regressão',
};

const DIFICULDADES = [
  { label: 'Fácil', value: 1 },
  { label: 'Médio', value: 2 },
  { label: 'Difícil', value: 3 },
];

const FONTES = [
  { label: 'Vestibular', value: 'vestibular' },
  { label: 'ENEM', value: 'ENEM' },
  { label: 'Concurso', value: 'concurso' },
  { label: 'Olimpíada', value: 'olimpíada' },
  { label: 'Lista', value: 'lista' },
  { label: 'Apostila', value: 'apostila' },
  { label: 'Outro', value: 'outro' },
];

function toggleNumber(values: number[], value: number) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function toggleString(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function fonteLabel(source: string | null | undefined) {
  if (!source || source === 'avulsa') return 'Apostila';
  if (source === 'apostila') return 'Apostila';
  if (source === 'concurso') return 'Concurso';
  if (source.toLowerCase() === 'enem') return 'ENEM';
  if (source === 'vestibular') return 'Vestibular';
  return source;
}

function BadgeDificuldade({ dificuldade }: { dificuldade: number | null }) {
  const cores: Record<number, string> = { 1: '#4caf50', 2: '#ff9800', 3: '#f44336' };
  const rotulos: Record<number, string> = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' };
  if (!dificuldade) return null;
  return (
    <View style={[styles.badge, { backgroundColor: cores[dificuldade] }]}>
      <Text color="#fff" fontSize={11} fontWeight="700">
        {rotulos[dificuldade]}
      </Text>
    </View>
  );
}

function QuestionCard({
  question,
  orderNumber,
  mode,
  selected,
  onEdit,
  onDelete,
  onToggleSelection,
  canManage,
}: {
  question: Questao;
  orderNumber: number;
  mode: ViewerMode;
  selected: boolean;
  onEdit: (questionId: number) => void;
  onDelete: (question: Questao) => void;
  onToggleSelection: (questionId: number) => void;
  canManage: boolean;
}) {
  const chapterName = question.capitulo_numero
    ? CAP_NOMES[question.capitulo_numero] ?? question.capitulo
    : question.capitulo;

  return (
    <View style={[styles.card, styles.cardVest]}>
      <XStack ai="center" jc="space-between" mb={4}>
        <Text fontSize={13} color={palette.darkBlue} fontWeight="700">
          Questão {orderNumber}{' '}
          <Text fontSize={12} color="#888">
            #{question.id}
          </Text>
        </Text>
        <BadgeDificuldade dificuldade={question.dificuldade} />
      </XStack>

      <XStack gap={8} mb={10} flexWrap="wrap">
        {chapterName ? (
          <Text fontSize={11} color={palette.primaryBlue} fontWeight="700">
            {chapterName}
          </Text>
        ) : null}
        {question.topico ? (
          <Text fontSize={11} color="#555">
            {question.topico}
          </Text>
        ) : null}
        <Text fontSize={11} color="#999">
          {fonteLabel(question.source)}
        </Text>
      </XStack>

      <Text fontSize={15} color={palette.offBlack} mb={14} lineHeight={22}>
        {question.enunciado}
      </Text>

      {question.alternativas.map((alternativa) => (
        <View
          key={`${question.id}-${alternativa.letter}`}
          style={[
            styles.altVest,
            alternativa.is_correct ? styles.altVestCorreta : null,
          ]}
        >
          <Text
            fontSize={14}
            color={alternativa.is_correct ? palette.primaryGreen : palette.offBlack}
          >
            ({alternativa.letter}) {alternativa.text}
          </Text>
        </View>
      ))}

      {question.solucao ? (
        <View style={styles.solutionBox}>
          <Text fontSize={12} color="#555" fontWeight="700">
            Resolução:
          </Text>
          <Text fontSize={12} color="#555" mt={4}>
            {question.solucao}
          </Text>
        </View>
      ) : null}

      <XStack gap={8} mb={8} mt={12} jc="flex-end" px={4}>
        {mode === 'manage' ? (
          canManage ? (
            <>
              <TouchableOpacity style={styles.actionEdit} onPress={() => onEdit(question.id)}>
                <Pencil color="#fff" size={14} />
                <Text color="#fff" fontSize={12} fontWeight="700" ml={4}>
                  Editar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionDelete} onPress={() => onDelete(question)}>
                <Trash2 color="#fff" size={14} />
                <Text color="#fff" fontSize={12} fontWeight="700" ml={4}>
                  Excluir
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.readOnlyBadge}>
              <Text color={palette.darkBlue} fontSize={12} fontWeight="700">
                Somente leitura
              </Text>
            </View>
          )
        ) : (
          <TouchableOpacity
            style={selected ? styles.actionRemove : styles.actionAdd}
            onPress={() => onToggleSelection(question.id)}
          >
            <Text color="#fff" fontSize={12} fontWeight="700">
              {selected ? 'Remover' : 'Adicionar'}
            </Text>
          </TouchableOpacity>
        )}
      </XStack>
    </View>
  );
}

export function SharedQuestionViewer({
  mode,
  selectedQuestionIds = [],
  onToggleQuestion,
  onConfirmSelection,
  returnTo,
}: SharedQuestionViewerProps) {
  const router = useRouter();
  const { role } = useAuth();
  const { maxW, fs } = useLayout();
  const [chapterIds, setChapterIds] = useState<number[]>([]);
  const [topicIds, setTopicIds] = useState<number[]>([]);
  const [difficulties, setDifficulties] = useState<number[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Capitulo[]>([]);
  const [allTopics, setAllTopics] = useState<Topico[]>([]);
  const [questions, setQuestions] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchById, setSearchById] = useState('');

  const visibleTopics = useMemo(
    () =>
      chapterIds.length > 0
        ? allTopics.filter((topic) => chapterIds.includes(topic.chapter_id))
        : allTopics,
    [allTopics, chapterIds],
  );

  const loadMeta = useCallback(async () => {
    try {
      const [chaptersResponse, topicsResponse] = await Promise.all([
        api.get<Capitulo[]>('/questions/chapters'),
        api.get<Topico[]>('/questions/topics'),
      ]);
      setChapters(chaptersResponse.data);
      setAllTopics(topicsResponse.data);
    } catch {
      setChapters([]);
      setAllTopics([]);
    }
  }, []);

  const fetchQuestions = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const params: Record<string, string | number | number[] | string[]> = {
          page: targetPage,
          per_page: 20,
        };
        if (difficulties.length > 0) params.difficulty = difficulties;
        if (chapterIds.length > 0) params.chapter_id = chapterIds;
        if (topicIds.length > 0) params.topic_id = topicIds;
        if (sources.length > 0) params.source = sources;

        const response = await api.get<QuestoesResponse>('/questions/browse', { params });
        setQuestions(response.data.questoes);
        setTotalPages(response.data.pages);
        setPage(targetPage);
        setSearched(true);
        setLoadError(null);
      } catch (error) {
        console.error('Erro ao carregar questões:', error);
        setQuestions([]);
        setTotalPages(1);
        setPage(targetPage);
        setSearched(true);
        setLoadError('Não foi possível carregar as questões.');
      } finally {
        setLoading(false);
      }
    },
    [chapterIds, difficulties, sources, topicIds],
  );

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (!searched) {
      fetchQuestions(1).catch(() => undefined);
    }
  }, [fetchQuestions, searched]);

  useFocusEffect(
    useCallback(() => {
      if (searched) {
        fetchQuestions(page).catch(() => undefined);
      }
      return () => undefined;
    }, [fetchQuestions, page, searched]),
  );

  const filteredQuestions = useMemo(() => {
    if (!searchById.trim()) return questions;
    return questions.filter((question) => String(question.id).includes(searchById.trim()));
  }, [questions, searchById]);

  const handleDelete = useCallback(
    (question: Questao) => {
      Alert.alert('Excluir questão', `Excluir questão #${question.id}?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/questions/${question.id}`);
              fetchQuestions(page).catch(() => undefined);
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a questão.');
            }
          },
        },
      ]);
    },
    [fetchQuestions, page],
  );

  const handleEdit = useCallback(
    (questionId: number) => {
      router.push({
        pathname: '/(professor)/AddNewQuestion',
        params: { id: String(questionId), returnTo: returnTo ?? '/(admin)/QuestaoViewer' },
      });
    },
    [returnTo, router],
  );

  const fallbackReturnRoute =
    role === 'admin' ? '/(admin)/QuestaoViewer' : '/(app)/QuestionPicker';

  return (
    <View style={styles.viewerRoot}>
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', paddingBottom: mode === 'pick' ? 120 : 32 }}>
        <View style={{ width: '100%', maxWidth: maxW ?? 860 }}>
          {mode === 'manage' ? (
            <AppButton
              backgroundColor={palette.primaryBlue}
              onPress={() =>
                router.push({
                  pathname: '/(professor)/AddNewQuestion',
                  params: { returnTo: returnTo ?? fallbackReturnRoute },
                })
              }
            >
              {role === 'admin' ? 'Adicionar Nova Questão' : 'Nova Questão'}
            </AppButton>
          ) : null}

          <View style={styles.filtersBox}>
            <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="700" mb={6}>
              Capítulo
            </Text>
            <XStack gap={8} mb={12} flexWrap="wrap">
              {chapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter.id}
                  onPress={() => setChapterIds((values) => toggleNumber(values, chapter.id))}
                  style={[
                    styles.chip,
                    chapterIds.includes(chapter.id) ? styles.chipActive : null,
                  ]}
                >
                  <Text
                    fontSize={fs(13)}
                    color={chapterIds.includes(chapter.id) ? '#fff' : palette.darkBlue}
                  >
                    {CAP_NOMES[chapter.number] ?? `Cap. ${chapter.number}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </XStack>

            {visibleTopics.length > 0 ? (
              <>
                <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="700" mb={6}>
                  Tópico
                </Text>
                <XStack gap={8} mb={12} flexWrap="wrap">
                  {visibleTopics.map((topic) => (
                    <TouchableOpacity
                      key={topic.id}
                      onPress={() => setTopicIds((values) => toggleNumber(values, topic.id))}
                      style={[
                        styles.chip,
                        topicIds.includes(topic.id) ? styles.chipActive : null,
                      ]}
                    >
                      <Text
                        fontSize={fs(12)}
                        color={topicIds.includes(topic.id) ? '#fff' : palette.darkBlue}
                      >
                        {topic.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </>
            ) : null}

            <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="700" mb={6}>
              Dificuldade
            </Text>
            <XStack gap={8} mb={12} flexWrap="wrap">
              {DIFICULDADES.map((difficulty) => (
                <TouchableOpacity
                  key={String(difficulty.value)}
                  onPress={() =>
                    setDifficulties((values) => toggleNumber(values, difficulty.value))
                  }
                  style={[
                    styles.chip,
                    difficulties.includes(difficulty.value) ? styles.chipActive : null,
                  ]}
                >
                  <Text
                    fontSize={fs(13)}
                    color={difficulties.includes(difficulty.value) ? '#fff' : palette.darkBlue}
                  >
                    {difficulty.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </XStack>

            <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="700" mb={6}>
              Fonte
            </Text>
            <XStack gap={8} mb={12} flexWrap="wrap">
              {FONTES.map((source) => (
                <TouchableOpacity
                  key={source.value}
                  onPress={() => setSources((values) => toggleString(values, source.value))}
                  style={[
                    styles.chip,
                    sources.includes(source.value) ? styles.chipActive : null,
                  ]}
                >
                  <Text
                    fontSize={fs(13)}
                    color={sources.includes(source.value) ? '#fff' : palette.darkBlue}
                  >
                    {source.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </XStack>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => fetchQuestions(1).catch(() => undefined)}
            >
              <Text color="#fff" fontWeight="700" fontSize={fs(15)}>
                Buscar Questões
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchByIdBox}>
            <Search color={palette.darkBlue} size={16} style={{ marginRight: 6 }} />
            <TextInput
              value={searchById}
              onChangeText={setSearchById}
              placeholder="Filtrar por nº da questão..."
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              style={styles.searchByIdInput}
            />
          </View>

          {loading ? (
            <ActivityIndicator color={palette.primaryBlue} size="large" style={{ marginTop: 24 }} />
          ) : null}

          {!loading && loadError ? (
            <View style={styles.errorBox}>
              <Text color={palette.red} fontSize={14}>
                {loadError}
              </Text>
            </View>
          ) : null}

          {!loading && !loadError && filteredQuestions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text color={palette.darkBlue} fontSize={14}>
                Nenhuma questão encontrada com os filtros atuais.
              </Text>
            </View>
          ) : null}

          {filteredQuestions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              orderNumber={index + 1 + (page - 1) * 20}
              mode={mode}
              selected={selectedQuestionIds.includes(question.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleSelection={(questionId) => onToggleQuestion?.(questionId)}
              canManage={Boolean(question.can_manage)}
            />
          ))}

          {questions.length > 0 ? (
            <XStack jc="center" gap={12} mt={16} mb={32}>
              <TouchableOpacity
                disabled={page <= 1}
                onPress={() => fetchQuestions(page - 1).catch(() => undefined)}
                style={[styles.pageButton, page <= 1 ? styles.pageButtonDisabled : null]}
              >
                <Text color="#fff" fontWeight="700">
                  ← Anterior
                </Text>
              </TouchableOpacity>
              <Text fontSize={14} color={palette.darkBlue} mt={8}>
                Pág {page}/{totalPages}
              </Text>
              <TouchableOpacity
                disabled={page >= totalPages}
                onPress={() => fetchQuestions(page + 1).catch(() => undefined)}
                style={[
                  styles.pageButton,
                  page >= totalPages ? styles.pageButtonDisabled : null,
                ]}
              >
                <Text color="#fff" fontWeight="700">
                  Próxima →
                </Text>
              </TouchableOpacity>
            </XStack>
          ) : null}
        </View>
      </ScrollView>

      {mode === 'pick' ? (
        <View style={styles.selectionFooter}>
          <Text color={palette.darkBlue} fontSize={16} fontWeight="700" fontFamily={primaryFontA}>
            Selecionadas: {selectedQuestionIds.length}
          </Text>
          <AppButton
            backgroundColor={palette.primaryGreen}
            onPress={onConfirmSelection}
          >
            Concluir seleção
          </AppButton>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  viewerRoot: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  filtersBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.darkBlue,
    backgroundColor: '#f0f4f8',
  },
  chipActive: {
    backgroundColor: palette.primaryBlue,
    borderColor: palette.primaryBlue,
  },
  searchButton: {
    backgroundColor: palette.primaryBlue,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  searchByIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    elevation: 1,
  },
  searchByIdInput: {
    flex: 1,
    fontSize: 14,
    color: palette.offBlack,
  },
  pageButton: {
    backgroundColor: palette.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardVest: {
    borderLeftWidth: 5,
    borderLeftColor: palette.primaryGreen,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  altVest: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  altVestCorreta: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  solutionBox: {
    marginTop: 12,
    backgroundColor: '#f9fbe7',
    borderRadius: 8,
    padding: 10,
  },
  readOnlyBadge: {
    backgroundColor: '#e3eef7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  actionEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.red,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  actionRemove: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.red,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  selectionFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  errorBox: {
    backgroundColor: '#fff3f2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  emptyBox: {
    backgroundColor: '#eef4f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
});
