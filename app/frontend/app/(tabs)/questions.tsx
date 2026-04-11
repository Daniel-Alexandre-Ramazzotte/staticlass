import React, { useState, useEffect } from 'react';
import { ScrollView, View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { XStack, Text } from 'tamagui';
import { palette, primaryFontA } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';
import { useLayout } from '../../src/constants/layout';

type Chapter = { id: number; name: string; number: number };
type Topic = { id: number; name: string; chapter_id: number };

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
  { label: 'ENEM',       value: 'ENEM' },
  { label: 'Concurso',   value: 'concurso' },
  { label: 'Olimpíada',  value: 'olimpíada' },
  { label: 'Lista',      value: 'lista' },
  { label: 'Apostila',   value: 'apostila' },
  { label: 'Outro',      value: 'outro' },
];

function toggleN(arr: number[], val: number): number[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}
function toggleS(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export default function QuestionsScreen() {
  const router = useRouter();
  const { name } = useAuth();
  const { fs, maxW } = useLayout();
  const [qtdQuestoes, setQtdQuestoes] = useState('5');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [chapterIds, setChapterIds] = useState<number[]>([]);
  const [topicIds, setTopicIds] = useState<number[]>([]);
  const [difficulties, setDifficulties] = useState<number[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    api.get('/questions/chapters').then((res) => setChapters(res.data)).catch(() => {});
    api.get('/questions/topics').then((res) => setAllTopics(res.data)).catch(() => {});
  }, []);

  const topicsVisible = chapterIds.length > 0
    ? allTopics.filter((t) => chapterIds.includes(t.chapter_id))
    : allTopics;

  const handleStartQuiz = () => {
    const params: Record<string, any> = { qtd: qtdQuestoes };
    if (chapterIds.length) params.chapter_id = chapterIds;
    if (topicIds.length) params.topic_id = topicIds;
    if (difficulties.length) params.difficulty = difficulties;
    if (sources.length) params.source = sources;
    router.push({ pathname: '/(app)/QuizInProgressScreen', params });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <XStack backgroundColor={palette.primaryBlue} pt="$2" pb="$3" px="$4" ai="center">
        <Text color="#fff" fontSize={fs(18)} fontWeight="bold" fontFamily={primaryFontA}>
          {`Olá, ${name || 'Usuário'}!`}
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: maxW ?? 600 }}>

          <View style={s.filtrosBox}>

            {/* Quantidade */}
            <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>
              Quantidade de questões
            </Text>
            <TextInput
              value={qtdQuestoes}
              onChangeText={setQtdQuestoes}
              keyboardType="numeric"
              style={s.qtdInput}
              placeholder="5"
              placeholderTextColor="#aaa"
            />

            {/* Capítulo */}
            <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6} mt={16}>
              Capítulo
              {chapterIds.length > 0 && (
                <Text fontSize={fs(11)} color={palette.primaryBlue}> ({chapterIds.length} selecionado(s))</Text>
              )}
            </Text>
            <XStack gap={8} mb={12} flexWrap="wrap">
              {chapters.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => { setChapterIds((ids) => toggleN(ids, c.id)); setTopicIds([]); }}
                  style={[s.chip, chapterIds.includes(c.id) && s.chipAtivo]}
                >
                  <Text fontSize={fs(13)} color={chapterIds.includes(c.id) ? '#fff' : palette.darkBlue}>
                    {CAP_NOMES[c.number] ?? `Cap. ${c.number}`}
                  </Text>
                </TouchableOpacity>
              ))}
              {chapterIds.length > 0 && (
                <TouchableOpacity onPress={() => { setChapterIds([]); setTopicIds([]); }} style={s.chipLimpar}>
                  <Text fontSize={fs(12)} color={palette.red}>✕ Limpar</Text>
                </TouchableOpacity>
              )}
            </XStack>

            {/* Tópico */}
            {topicsVisible.length > 0 && (
              <>
                <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>
                  Tópico
                  {topicIds.length > 0 && (
                    <Text fontSize={fs(11)} color={palette.primaryBlue}> ({topicIds.length} selecionado(s))</Text>
                  )}
                </Text>
                <XStack gap={8} mb={12} flexWrap="wrap">
                  {topicsVisible.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setTopicIds((ids) => toggleN(ids, t.id))}
                      style={[s.chip, topicIds.includes(t.id) && s.chipAtivo]}
                    >
                      <Text fontSize={fs(12)} color={topicIds.includes(t.id) ? '#fff' : palette.darkBlue}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {topicIds.length > 0 && (
                    <TouchableOpacity onPress={() => setTopicIds([])} style={s.chipLimpar}>
                      <Text fontSize={fs(12)} color={palette.red}>✕ Limpar</Text>
                    </TouchableOpacity>
                  )}
                </XStack>
              </>
            )}

            {/* Dificuldade */}
            <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>
              Dificuldade
              {difficulties.length > 0 && (
                <Text fontSize={fs(11)} color={palette.primaryBlue}> ({difficulties.length} selecionada(s))</Text>
              )}
            </Text>
            <XStack gap={8} mb={12} flexWrap="wrap">
              {DIFICULDADES.map((d) => (
                <TouchableOpacity
                  key={String(d.value)}
                  onPress={() => setDifficulties((ds) => toggleN(ds, d.value))}
                  style={[s.chip, difficulties.includes(d.value) && s.chipAtivo]}
                >
                  <Text fontSize={fs(13)} color={difficulties.includes(d.value) ? '#fff' : palette.darkBlue}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
              {difficulties.length > 0 && (
                <TouchableOpacity onPress={() => setDifficulties([])} style={s.chipLimpar}>
                  <Text fontSize={fs(12)} color={palette.red}>✕ Limpar</Text>
                </TouchableOpacity>
              )}
            </XStack>

            {/* Fonte */}
            <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>
              Fonte
              {sources.length > 0 && (
                <Text fontSize={fs(11)} color={palette.primaryBlue}> ({sources.length} selecionada(s))</Text>
              )}
            </Text>
            <XStack gap={8} flexWrap="wrap">
              {FONTES.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setSources((ss) => toggleS(ss, f.value))}
                  style={[s.chip, sources.includes(f.value) && s.chipAtivo]}
                >
                  <Text fontSize={fs(13)} color={sources.includes(f.value) ? '#fff' : palette.darkBlue}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
              {sources.length > 0 && (
                <TouchableOpacity onPress={() => setSources([])} style={s.chipLimpar}>
                  <Text fontSize={fs(12)} color={palette.red}>✕ Limpar</Text>
                </TouchableOpacity>
              )}
            </XStack>

          </View>

          <AppButton
            type="primary"
            backgroundColor={palette.primaryGreen}
            onPress={handleStartQuiz}
            fontFamily={primaryFontA}
          >
            Iniciar Quiz
          </AppButton>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  filtrosBox: {
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
  chipAtivo: {
    backgroundColor: palette.primaryBlue,
    borderColor: palette.primaryBlue,
  },
  chipLimpar: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.red,
    backgroundColor: '#fdecea',
  },
  qtdInput: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.darkBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: palette.offBlack,
    width: 80,
  },
});
