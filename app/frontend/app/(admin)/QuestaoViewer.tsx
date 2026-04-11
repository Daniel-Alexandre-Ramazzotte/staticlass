/**
 * Tela compartilhada de gestão de questões.
 * Admin e professor usam o mesmo visualizador moderno; apenas o admin vê a aba SQL.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView, View, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform, Alert,
} from 'react-native';
import { XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Pencil, Trash2, Search } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';
import { AppButton } from 'app/components/AppButton';
import { useAuth } from 'app/context/AuthContext';
import { useLayout } from '../../src/constants/layout';

type Alternativa = { letter: string; text: string; is_correct: boolean };
type Capitulo = { id: number; name: string; number: number };
type Topico = { id: number; name: string; chapter_id: number };
type Questao = {
  id: number;
  enunciado: string;
  resposta_correta: string;
  solucao: string | null;
  dificuldade: number | null;
  capitulo: string | null;
  capitulo_numero: number | null;
  topico: string | null;
  secao?: string | null;
  source?: string | null;
  alternativas: Alternativa[];
  layout: string;
};
type ResultadoSQL = {
  colunas: string[];
  linhas: Record<string, any>[];
  total_linhas: number;
  limitado: boolean;
};

const CAP_NOMES: Record<number, string> = {
  1: 'Estatística Básica',
  2: 'Probabilidade',
  3: 'Introdução à Inferência',
  4: 'Introdução à Regressão',
};

const DIFICULDADES = [
  { label: 'Todas', value: null },
  { label: 'Fácil', value: 1 },
  { label: 'Médio', value: 2 },
  { label: 'Difícil', value: 3 },
];

function BadgeDificuldade({ dif }: { dif: number | null }) {
  const cores: Record<number, string> = { 1: '#4caf50', 2: '#ff9800', 3: '#f44336' };
  const rotulos: Record<number, string> = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' };
  if (!dif) return null;
  return (
    <View style={[s.badge, { backgroundColor: cores[dif] }]}>
      <Text color="#fff" fontSize={11} fontWeight="bold">{rotulos[dif]}</Text>
    </View>
  );
}

function fonteLabel(source: string | null): string {
  if (!source || source === 'avulsa') return 'Apostila';
  if (source === 'apostila') return 'Apostila';
  if (source === 'concurso') return 'Concurso';
  if (source === 'enem') return 'ENEM';
  if (source === 'vestibular') return 'Vestibular';
  return source;
}

function QuestaoVestibular({ q, num }: { q: Questao; num: number }) {
  const capNome = q.capitulo_numero ? CAP_NOMES[q.capitulo_numero] ?? q.capitulo : q.capitulo;
  return (
    <View style={[s.cartao, s.cartaoVest]}>
      <XStack ai="center" jc="space-between" mb={4}>
        <Text fontSize={13} color={palette.darkBlue} fontWeight="bold">
          Questão {num} — <Text fontSize={12} color="#888">#{q.id}</Text>
        </Text>
        <XStack gap={6} ai="center">
          <BadgeDificuldade dif={q.dificuldade} />
        </XStack>
      </XStack>

      <XStack gap={8} mb={10} flexWrap="wrap">
        {capNome && (
          <Text fontSize={11} color={palette.primaryBlue} fontWeight="bold">📚 {capNome}</Text>
        )}
        {q.topico && (
          <Text fontSize={11} color="#555">› {q.topico}</Text>
        )}
        <Text fontSize={11} color="#999">· {fonteLabel(q.source)}</Text>
      </XStack>

      <Text fontSize={15} color={palette.offBlack} mb={14} style={{ lineHeight: 24 }}>{q.enunciado}</Text>

      {q.alternativas.map((a) => (
        <View key={a.letter} style={[s.altVest, a.is_correct && s.altVestCorreta]}>
          <Text fontSize={14} color={a.is_correct ? palette.primaryGreen : palette.offBlack}>
            ({a.letter}) {a.text}
          </Text>
        </View>
      ))}

      {q.solucao && (
        <View style={s.solucao}>
          <Text fontSize={12} color="#555" fontWeight="bold">Resolução:</Text>
          <Text fontSize={12} color="#555" style={{ marginTop: 4 }}>{q.solucao}</Text>
        </View>
      )}
    </View>
  );
}

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

function AbaVisualizador() {
  const { maxW, fs } = useLayout();
  const router = useRouter();
  const { role } = useAuth();
  const [capituloIds, setCapIds] = useState<number[]>([]);
  const [topicoIds, setTopIds] = useState<number[]>([]);
  const [dificuldades, setDifs] = useState<number[]>([]);
  const [fontes, setFontes] = useState<string[]>([]);
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [todosTopicos, setTodosTopicos] = useState<Topico[]>([]);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [carregando, setCarreg] = useState(false);
  const [jaBuscou, setJaBuscou] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPages, setTotalPag] = useState(1);
  const [buscaId, setBuscaId] = useState('');

  useEffect(() => {
    api.get('/questions/chapters').then((r) => setCapitulos(r.data as Capitulo[])).catch(() => {});
    api.get('/questions/topics').then((r) => setTodosTopicos(r.data as Topico[])).catch(() => {});
  }, []);

  const topicosVisiveis = capituloIds.length > 0
    ? todosTopicos.filter((t) => capituloIds.includes(t.chapter_id))
    : todosTopicos;

  const buscar = useCallback((pag = 1) => {
    setCarreg(true);
    const params: any = { page: pag, per_page: 20 };
    if (dificuldades.length) params.difficulty = dificuldades;
    if (capituloIds.length) params.chapter_id = capituloIds;
    if (topicoIds.length) params.topic_id = topicoIds;
    if (fontes.length) params.source = fontes;
    api.get('/admin/questoes', { params })
      .then((r) => {
        setQuestoes(r.data.questoes);
        setTotalPag(r.data.pages);
        setPagina(pag);
        setJaBuscou(true);
      })
      .finally(() => setCarreg(false));
  }, [dificuldades, capituloIds, topicoIds, fontes]);

  useFocusEffect(
    useCallback(() => {
      if (jaBuscou) {
        buscar(pagina);
      }
    }, [buscar, jaBuscou, pagina]),
  );

  const handleDelete = (q: Questao) => {
    Alert.alert('Excluir questão', `Excluir questão #${q.id}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: () => {
          api.delete(`/questions/${q.id}`)
            .then(() => buscar(pagina))
            .catch(() => Alert.alert('Erro', 'Não foi possível excluir.'));
        },
      },
    ]);
  };

  const questoesFiltradas = buscaId.trim()
    ? questoes.filter((q) => String(q.id).includes(buscaId.trim()))
    : questoes;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: maxW ?? 860 }}>
        <AppButton
          backgroundColor={palette.primaryBlue}
          onPress={() => router.push({
            pathname: '/(professor)/AddNewQuestion',
            params: { returnTo: '/(admin)/QuestaoViewer' },
          })}
        >
          {role === 'admin' ? 'Adicionar Nova Questão' : 'Nova Questão'}
        </AppButton>

        <View style={s.filtrosBox}>
          <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>
            Capítulo {capituloIds.length > 0 && <Text fontSize={fs(11)} color={palette.primaryBlue}> ({capituloIds.length} selecionado(s))</Text>}
          </Text>
          <XStack gap={8} mb={12} flexWrap="wrap">
            {capitulos.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setCapIds((ids) => toggleN(ids, c.id))} style={[s.chip, capituloIds.includes(c.id) && s.chipAtivo]}>
                <Text fontSize={fs(13)} color={capituloIds.includes(c.id) ? '#fff' : palette.darkBlue}>{CAP_NOMES[c.number] ?? `Cap. ${c.number}`}</Text>
              </TouchableOpacity>
            ))}
            {capituloIds.length > 0 && (
              <TouchableOpacity onPress={() => { setCapIds([]); setTopIds([]); }} style={s.chipLimpar}>
                <Text fontSize={fs(12)} color={palette.red}>✕ Limpar</Text>
              </TouchableOpacity>
            )}
          </XStack>

          {topicosVisiveis.length > 0 && (
            <>
              <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>
                Tópico {topicoIds.length > 0 && <Text fontSize={fs(11)} color={palette.primaryBlue}> ({topicoIds.length} selecionado(s))</Text>}
              </Text>
              <XStack gap={8} mb={12} flexWrap="wrap">
                {topicosVisiveis.map((t) => (
                  <TouchableOpacity key={t.id} onPress={() => setTopIds((ids) => toggleN(ids, t.id))} style={[s.chip, topicoIds.includes(t.id) && s.chipAtivo]}>
                    <Text fontSize={fs(12)} color={topicoIds.includes(t.id) ? '#fff' : palette.darkBlue}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
                {topicoIds.length > 0 && (
                  <TouchableOpacity onPress={() => setTopIds([])} style={s.chipLimpar}>
                    <Text fontSize={fs(12)} color={palette.red}>✕ Limpar</Text>
                  </TouchableOpacity>
                )}
              </XStack>
            </>
          )}

          <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>
            Dificuldade {dificuldades.length > 0 && <Text fontSize={fs(11)} color={palette.primaryBlue}> ({dificuldades.length} selecionada(s))</Text>}
          </Text>
          <XStack gap={8} mb={12} flexWrap="wrap">
            {DIFICULDADES.filter((d) => d.value !== null).map((d) => (
              <TouchableOpacity key={String(d.value)} onPress={() => setDifs((ds) => toggleN(ds, d.value as number))} style={[s.chip, dificuldades.includes(d.value as number) && s.chipAtivo]}>
                <Text fontSize={fs(13)} color={dificuldades.includes(d.value as number) ? '#fff' : palette.darkBlue}>{d.label}</Text>
              </TouchableOpacity>
            ))}
            {dificuldades.length > 0 && (
              <TouchableOpacity onPress={() => setDifs([])} style={s.chipLimpar}>
                <Text fontSize={fs(12)} color={palette.red}>✕ Limpar</Text>
              </TouchableOpacity>
            )}
          </XStack>

          <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>
            Fonte {fontes.length > 0 && <Text fontSize={fs(11)} color={palette.primaryBlue}> ({fontes.length} selecionada(s))</Text>}
          </Text>
          <XStack gap={8} mb={12} flexWrap="wrap">
            {FONTES.map((f) => (
              <TouchableOpacity key={f.value} onPress={() => setFontes((fs_) => toggleS(fs_, f.value))} style={[s.chip, fontes.includes(f.value) && s.chipAtivo]}>
                <Text fontSize={fs(13)} color={fontes.includes(f.value) ? '#fff' : palette.darkBlue}>{f.label}</Text>
              </TouchableOpacity>
            ))}
            {fontes.length > 0 && (
              <TouchableOpacity onPress={() => setFontes([])} style={s.chipLimpar}>
                <Text fontSize={fs(12)} color={palette.red}>✕ Limpar</Text>
              </TouchableOpacity>
            )}
          </XStack>

          <TouchableOpacity style={s.btnBuscar} onPress={() => buscar(1)}>
            <Text color="#fff" fontWeight="bold" fontSize={fs(15)}>Buscar Questões</Text>
          </TouchableOpacity>
        </View>

        {/* Busca por número */}
        <View style={s.buscaIdBox}>
          <Search color={palette.darkBlue} size={16} style={{ marginRight: 6 }} />
          <TextInput
            value={buscaId}
            onChangeText={setBuscaId}
            placeholder="Filtrar por nº da questão..."
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            style={s.buscaIdInput}
          />
        </View>

        {carregando && <ActivityIndicator color={palette.primaryBlue} size="large" style={{ marginTop: 24 }} />}

        {questoesFiltradas.map((q, i) => (
          <View key={q.id}>
            <QuestaoVestibular q={q} num={i + (pagina - 1) * 20 + 1} />
            <XStack gap={8} mb={8} mt={-8} jc="flex-end" px={4}>
              <TouchableOpacity
                style={s.acaoBtnEditar}
                onPress={() => router.push({
                  pathname: '/(professor)/AddNewQuestion',
                  params: { id: String(q.id), returnTo: '/(admin)/QuestaoViewer' },
                })}
              >
                <Pencil color="#fff" size={14} />
                <Text color="#fff" fontSize={12} fontWeight="bold" ml={4}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.acaoBtnExcluir} onPress={() => handleDelete(q)}>
                <Trash2 color="#fff" size={14} />
                <Text color="#fff" fontSize={12} fontWeight="bold" ml={4}>Excluir</Text>
              </TouchableOpacity>
            </XStack>
          </View>
        ))}

        {questoes.length > 0 && (
          <XStack jc="center" gap={12} mt={16} mb={32}>
            <TouchableOpacity disabled={pagina <= 1} onPress={() => buscar(pagina - 1)} style={[s.pagBtn, pagina <= 1 && s.pagBtnDis]}>
              <Text color="#fff" fontWeight="bold">← Anterior</Text>
            </TouchableOpacity>
            <Text fontSize={14} color={palette.darkBlue} mt={8}>Pág {pagina}/{totalPages}</Text>
            <TouchableOpacity disabled={pagina >= totalPages} onPress={() => buscar(pagina + 1)} style={[s.pagBtn, pagina >= totalPages && s.pagBtnDis]}>
              <Text color="#fff" fontWeight="bold">Próxima →</Text>
            </TouchableOpacity>
          </XStack>
        )}
      </View>
    </ScrollView>
  );
}

const EXEMPLOS_SQL = [
  'SELECT * FROM questions LIMIT 10',
  'SELECT * FROM chapters ORDER BY number',
  'SELECT * FROM users WHERE role = \'aluno\' LIMIT 20',
  'SELECT COUNT(*) AS total FROM questions',
  'SELECT id, name, email FROM users WHERE role = \'professor\' LIMIT 20',
];

function AbaSQLViewer() {
  const { fs, maxW } = useLayout();
  const [query, setQuery] = useState('SELECT * FROM questions LIMIT 10');
  const [resultado, setResultado] = useState<ResultadoSQL | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarreg] = useState(false);

  const executar = () => {
    if (!query.trim()) return;
    setCarreg(true);
    setErro(null);
    setResultado(null);
    api.post('/admin/sql', { sql: query })
      .then((r) => setResultado(r.data))
      .catch((e) => setErro(e.response?.data?.error ?? 'Erro desconhecido'))
      .finally(() => setCarreg(false));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: maxW ?? 860 }}>
        <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>Exemplos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <XStack gap={8}>
            {EXEMPLOS_SQL.map((ex) => (
              <TouchableOpacity key={ex} onPress={() => setQuery(ex)} style={s.chip}>
                <Text fontSize={11} color={palette.darkBlue}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </XStack>
        </ScrollView>

        <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={4}>Query SQL (somente leitura)</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          multiline
          style={s.sqlInput}
          placeholder="SELECT ..."
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
        <TouchableOpacity style={s.btnBuscar} onPress={executar} disabled={carregando}>
          <Text color="#fff" fontWeight="bold" fontSize={fs(15)}>▶ Executar</Text>
        </TouchableOpacity>

        {carregando && <ActivityIndicator color={palette.primaryBlue} style={{ marginTop: 16 }} />}

        {erro && (
          <View style={s.erroBox}>
            <Text color={palette.red} fontSize={14}>{erro}</Text>
          </View>
        )}

        {resultado && (
          <View style={{ marginTop: 16 }}>
            <Text fontSize={fs(13)} color="#555" mb={8}>
              {resultado.total_linhas} linha(s){resultado.limitado ? ' (limitado a 500)' : ''}
            </Text>
            <ScrollView horizontal>
              <View>
                <View style={s.tabelaHeader}>
                  {resultado.colunas.map((col) => (
                    <View key={col} style={s.celHeader}>
                      <Text color="#fff" fontSize={12} fontWeight="bold">{col}</Text>
                    </View>
                  ))}
                </View>
                {resultado.linhas.map((linha, i) => (
                  <View key={i} style={[s.tabelaLinha, i % 2 === 1 && s.tabelaLinhaAlternada]}>
                    {resultado.colunas.map((col) => (
                      <View key={col} style={s.celLinha}>
                        <Text fontSize={12} color={palette.offBlack} numberOfLines={2}>
                          {linha[col] == null ? '—' : String(linha[col])}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function QuestaoViewerScreen() {
  const router = useRouter();
  const { fs } = useLayout();
  const { role } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<0 | 1>(0);
  const isAdmin = role === 'admin';
  const abas = isAdmin ? ['Visualização', 'Banco de Dados (SQL)'] : ['Visualização'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <XStack backgroundColor={palette.primaryBlue} pt="$2" pb="$3" px="$4" ai="center" gap="$3">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={palette.white} size={24} />
        </TouchableOpacity>
        <Text color={palette.white} fontSize={fs(18)} fontWeight="bold" fontFamily={primaryFontA}>
          Gerenciar Questões
        </Text>
      </XStack>

      <XStack backgroundColor={palette.darkBlue}>
        {abas.map((label, i) => (
          <TouchableOpacity
            key={label}
            onPress={() => setAbaAtiva(i as 0 | 1)}
            style={[s.aba, abaAtiva === i && s.abaAtiva]}
          >
            <Text
              color={abaAtiva === i ? palette.white : 'rgba(255,255,255,0.6)'}
              fontWeight={abaAtiva === i ? 'bold' : 'normal'}
              fontSize={fs(14)}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </XStack>

      {abaAtiva === 0 || !isAdmin ? <AbaVisualizador /> : <AbaSQLViewer />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  aba: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  abaAtiva: { borderBottomWidth: 3, borderBottomColor: palette.primaryGreen },
  filtrosBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: palette.darkBlue, backgroundColor: '#f0f4f8' },
  chipAtivo: { backgroundColor: palette.primaryBlue, borderColor: palette.primaryBlue },
  chipLimpar: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: palette.red, backgroundColor: '#fdecea' },
  buscaIdBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, elevation: 1 },
  buscaIdInput: { flex: 1, fontSize: 14, color: palette.offBlack },
  acaoBtnEditar: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.primaryBlue, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  acaoBtnExcluir: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.red, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnBuscar: { backgroundColor: palette.primaryBlue, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
  pagBtn: { backgroundColor: palette.primaryBlue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  pagBtnDis: { backgroundColor: '#b0bec5' },
  cartao: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  cartaoEnem: { borderTopWidth: 4, borderTopColor: '#1565c0' },
  cartaoVest: { borderLeftWidth: 5, borderLeftColor: palette.primaryGreen },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  alt: { paddingVertical: 6, paddingHorizontal: 8, marginBottom: 4, borderRadius: 6, backgroundColor: '#f5f5f5' },
  altCorreta: { backgroundColor: '#e8f5e9' },
  altEnem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, marginBottom: 4 },
  altEnemCorreta: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 6 },
  letraCirculo: { width: 28, height: 28, borderRadius: 14, backgroundColor: palette.darkBlue, alignItems: 'center', justifyContent: 'center' },
  altVest: { paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee' },
  altVestCorreta: { backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 6 },
  cabecalhoEnem: { backgroundColor: '#1565c0', borderRadius: 8, padding: 8, marginBottom: 8 },
  numEnem: { backgroundColor: palette.primaryBlue, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  solucao: { marginTop: 12, backgroundColor: '#f9fbe7', borderRadius: 8, padding: 10 },
  sqlInput: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Carlito',
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    minHeight: 120,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  erroBox: { backgroundColor: '#fdecea', borderRadius: 8, padding: 12, marginTop: 8 },
  tabelaHeader: { flexDirection: 'row', backgroundColor: palette.darkBlue },
  tabelaLinha: { flexDirection: 'row', backgroundColor: '#fff' },
  tabelaLinhaAlternada: { backgroundColor: '#f5f7fa' },
  celHeader: { minWidth: 120, padding: 8, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  celLinha: { minWidth: 120, padding: 8, borderRightWidth: 1, borderRightColor: '#eee', borderBottomWidth: 1, borderBottomColor: '#eee' },
});
