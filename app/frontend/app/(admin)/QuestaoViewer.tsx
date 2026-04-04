/**
 * Visualizador de questões para o Admin — versão web.
 * Duas abas:
 *   1. Visualização — questões com filtros e layouts (ENEM, Vestibular, Avulsa)
 *   2. Banco de dados — SQL viewer read-only
 */
import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';
import { useLayout } from '../../src/constants/layout';

type Alternativa = { letter: string; text: string; is_correct: boolean };
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
  alternativas: Alternativa[];
  layout: string;
};
type ResultadoSQL = {
  colunas: string[];
  linhas: Record<string, any>[];
  total_linhas: number;
  limitado: boolean;
};

const LAYOUTS = ['avulsa', 'enem', 'vestibular'] as const;
type TipoLayout = typeof LAYOUTS[number];

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

function QuestaoAvulsa({ q, num }: { q: Questao; num: number }) {
  return (
    <View style={s.cartao}>
      <XStack jc="space-between" ai="center" mb={8}>
        <Text fontSize={13} color="#888">Questão {num} — #{q.id}</Text>
        <BadgeDificuldade dif={q.dificuldade} />
      </XStack>
      {q.capitulo && <Text fontSize={12} color={palette.primaryBlue} mb={4}>📚 {q.capitulo}{q.topico ? ` › ${q.topico}` : ''}</Text>}
      <Text fontSize={15} color={palette.offBlack} mb={12} style={{ lineHeight: 22 }}>{q.enunciado}</Text>
      {q.alternativas.map((a) => (
        <View key={a.letter} style={[s.alt, a.is_correct && s.altCorreta]}>
          <Text fontSize={14} fontWeight={a.is_correct ? 'bold' : 'normal'} color={a.is_correct ? '#2e7d32' : palette.offBlack}>
            {a.letter}) {a.text}
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

function QuestaoENEM({ q, num }: { q: Questao; num: number }) {
  return (
    <View style={[s.cartao, s.cartaoEnem]}>
      <View style={s.cabecalhoEnem}>
        <Text color="#fff" fontSize={13} fontWeight="bold">ENEM — Estatística Básica</Text>
        <Text color="rgba(255,255,255,0.8)" fontSize={12}>{q.capitulo ?? 'Geral'}</Text>
      </View>
      <XStack ai="center" gap={8} my={8}>
        <View style={s.numEnem}><Text color="#fff" fontSize={15} fontWeight="900">{String(num).padStart(2, '0')}</Text></View>
        <BadgeDificuldade dif={q.dificuldade} />
      </XStack>
      <Text fontSize={15} color={palette.offBlack} mb={12} style={{ lineHeight: 22 }}>{q.enunciado}</Text>
      {q.alternativas.map((a) => (
        <View key={a.letter} style={[s.altEnem, a.is_correct && s.altEnemCorreta]}>
          <View style={s.letraCirculo}><Text fontSize={13} fontWeight="bold" color={a.is_correct ? '#fff' : palette.darkBlue}>{a.letter}</Text></View>
          <Text fontSize={14} color={a.is_correct ? '#2e7d32' : palette.offBlack} f={1}>{a.text}</Text>
        </View>
      ))}
    </View>
  );
}

function QuestaoVestibular({ q, num }: { q: Questao; num: number }) {
  return (
    <View style={[s.cartao, s.cartaoVest]}>
      <XStack ai="center" jc="space-between" mb={8}>
        <Text fontSize={13} color={palette.darkBlue} fontWeight="bold">
          Questão {num}
        </Text>
        <XStack gap={6}>
          {q.topico && <Text fontSize={11} color="#888">{q.topico}</Text>}
          <BadgeDificuldade dif={q.dificuldade} />
        </XStack>
      </XStack>
      <Text fontSize={15} color={palette.offBlack} mb={14} style={{ lineHeight: 24, fontStyle: 'italic' }}>{q.enunciado}</Text>
      {q.alternativas.map((a) => (
        <View key={a.letter} style={[s.altVest, a.is_correct && s.altVestCorreta]}>
          <Text fontSize={14} color={a.is_correct ? palette.primaryGreen : palette.offBlack}>
            ({a.letter}) {a.text}
          </Text>
        </View>
      ))}
      {q.secao && <Text fontSize={11} color="#aaa" mt={8}>Seção: {q.secao}</Text>}
    </View>
  );
}

function renderQuestao(q: Questao, idx: number, layout: TipoLayout) {
  const num = idx + 1;
  if (layout === 'enem') return <QuestaoENEM key={q.id} q={q} num={num} />;
  if (layout === 'vestibular') return <QuestaoVestibular key={q.id} q={q} num={num} />;
  return <QuestaoAvulsa key={q.id} q={q} num={num} />;
}

function AbaVisualizador() {
  const { maxW, fs } = useLayout();
  const [layout, setLayout] = useState<TipoLayout>('avulsa');
  const [dificuldade, setDif] = useState<number | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [carregando, setCarreg] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPages, setTotalPag] = useState(1);

  const buscar = useCallback((pag = 1) => {
    setCarreg(true);
    const params: any = { layout, page: pag, per_page: 20 };
    if (dificuldade) params.difficulty = dificuldade;
    api.get('/admin/questoes', { params })
      .then((r) => {
        setQuestoes(r.data.questoes);
        setTotalPag(r.data.pages);
        setPagina(pag);
      })
      .finally(() => setCarreg(false));
  }, [layout, dificuldade]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: maxW ?? 860 }}>
        <View style={s.filtrosBox}>
          <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>Layout de exibição</Text>
          <XStack gap={8} mb={12} flexWrap="wrap">
            {LAYOUTS.map((l) => (
              <TouchableOpacity key={l} onPress={() => setLayout(l)} style={[s.chip, layout === l && s.chipAtivo]}>
                <Text fontSize={fs(13)} color={layout === l ? '#fff' : palette.darkBlue} fontWeight="bold">
                  {l.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </XStack>

          <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="bold" mb={6}>Dificuldade</Text>
          <XStack gap={8} mb={12} flexWrap="wrap">
            {DIFICULDADES.map((d) => (
              <TouchableOpacity key={String(d.value)} onPress={() => setDif(d.value)} style={[s.chip, dificuldade === d.value && s.chipAtivo]}>
                <Text fontSize={fs(13)} color={dificuldade === d.value ? '#fff' : palette.darkBlue}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </XStack>

          <TouchableOpacity style={s.btnBuscar} onPress={() => buscar(1)}>
            <Text color="#fff" fontWeight="bold" fontSize={fs(15)}>Buscar Questões</Text>
          </TouchableOpacity>
        </View>

        {carregando && <ActivityIndicator color={palette.primaryBlue} size="large" style={{ marginTop: 24 }} />}

        {questoes.map((q, i) => renderQuestao(q, i + (pagina - 1) * 20, layout))}

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
  const [abaAtiva, setAbaAtiva] = useState<0 | 1>(0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <XStack backgroundColor={palette.primaryBlue} pt="$2" pb="$3" px="$4" ai="center" gap="$3">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={palette.white} size={24} />
        </TouchableOpacity>
        <Text color={palette.white} fontSize={fs(18)} fontWeight="bold" fontFamily={primaryFontA}>
          Visualizador de Questões
        </Text>
      </XStack>

      <XStack backgroundColor={palette.darkBlue}>
        {['Visualização', 'Banco de Dados (SQL)'].map((label, i) => (
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

      {abaAtiva === 0 ? <AbaVisualizador /> : <AbaSQLViewer />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  aba: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  abaAtiva: { borderBottomWidth: 3, borderBottomColor: palette.primaryGreen },
  filtrosBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: palette.darkBlue, backgroundColor: '#f0f4f8' },
  chipAtivo: { backgroundColor: palette.primaryBlue, borderColor: palette.primaryBlue },
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
