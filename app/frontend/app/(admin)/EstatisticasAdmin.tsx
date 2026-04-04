import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView, View, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';
import { useLayout } from '../../src/constants/layout';

type AlunoStat = {
  id: number;
  name: string;
  email: string;
  score: number;
  total_quizzes: number;
  total_acertos: number;
  total_questoes: number;
  media_pct: number;
};

type HistoricoItem = {
  id: number;
  acertos: number;
  total: number;
  dificuldade: number | null;
  criado_em: string;
  capitulo_nome: string | null;
};

const DIF_LABEL: Record<number, string> = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' };
const DIF_COLOR: Record<number, string> = { 1: '#4caf50', 2: '#ff9800', 3: '#f44336' };

function MedalhaRanking({ pos }: { pos: number }) {
  if (pos === 1) return <Text fontSize={20}>🥇</Text>;
  if (pos === 2) return <Text fontSize={20}>🥈</Text>;
  if (pos === 3) return <Text fontSize={20}>🥉</Text>;
  return <Text fontSize={14} color="#888" style={{ minWidth: 28, textAlign: 'center' }}>#{pos}</Text>;
}

function CartaoAluno({ aluno, pos }: { aluno: AlunoStat; pos: number }) {
  const [expandido, setExpandido] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [carregando, setCarreg] = useState(false);

  const carregarHistorico = useCallback(async () => {
    if (historico.length > 0) { setExpandido((v) => !v); return; }
    setCarreg(true);
    try {
      const r = await api.get(`/admin/stats/aluno/${aluno.id}`);
      setHistorico(r.data as HistoricoItem[]);
      setExpandido(true);
    } finally {
      setCarreg(false);
    }
  }, [aluno.id, historico.length]);

  const pct = aluno.total_questoes > 0
    ? Math.round((aluno.total_acertos / aluno.total_questoes) * 100)
    : 0;

  return (
    <View style={s.cartao}>
      <TouchableOpacity onPress={carregando ? undefined : carregarHistorico} activeOpacity={0.8}>
        <XStack ai="center" gap={10}>
          <MedalhaRanking pos={pos} />
          <View style={{ flex: 1 }}>
            <Text fontSize={15} fontWeight="bold" color={palette.darkBlue}>{aluno.name}</Text>
            <Text fontSize={12} color="#888">{aluno.email}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text fontSize={16} fontWeight="bold" color={palette.primaryGreen}>{aluno.score} pts</Text>
            <Text fontSize={11} color="#999">{aluno.total_quizzes} quiz{aluno.total_quizzes !== 1 ? 'zes' : ''}</Text>
          </View>
          {carregando
            ? <ActivityIndicator size="small" color={palette.primaryBlue} />
            : expandido
              ? <ChevronUp size={16} color={palette.darkBlue} />
              : <ChevronDown size={16} color={palette.darkBlue} />
          }
        </XStack>

        <XStack gap={16} mt={10}>
          <View style={s.statBox}>
            <Text fontSize={18} fontWeight="bold" color={palette.primaryBlue}>{aluno.total_acertos}</Text>
            <Text fontSize={11} color="#888">acertos</Text>
          </View>
          <View style={s.statBox}>
            <Text fontSize={18} fontWeight="bold" color={palette.primaryBlue}>{aluno.total_questoes}</Text>
            <Text fontSize={11} color="#888">questões</Text>
          </View>
          <View style={s.statBox}>
            <Text fontSize={18} fontWeight="bold" color={pct >= 70 ? '#4caf50' : pct >= 50 ? '#ff9800' : '#f44336'}>
              {pct}%
            </Text>
            <Text fontSize={11} color="#888">aproveitamento</Text>
          </View>
        </XStack>
      </TouchableOpacity>

      {expandido && historico.length > 0 && (
        <View style={s.historico}>
          <Text fontSize={12} fontWeight="bold" color={palette.darkBlue} style={{ marginBottom: 6 }}>
            Histórico recente
          </Text>
          {historico.map((h) => {
            const hPct = h.total > 0 ? Math.round((h.acertos / h.total) * 100) : 0;
            const data = new Date(h.criado_em).toLocaleDateString('pt-BR');
            return (
              <XStack key={h.id} style={s.linhaHistorico} ai="center" gap={8}>
                <Text fontSize={12} color={palette.offBlack} style={{ flex: 1 }}>
                  {h.capitulo_nome ?? 'Geral'}
                </Text>
                {h.dificuldade && (
                  <View style={[s.badge, { backgroundColor: DIF_COLOR[h.dificuldade] }]}>
                    <Text fontSize={10} color="#fff">{DIF_LABEL[h.dificuldade]}</Text>
                  </View>
                )}
                <Text fontSize={12} color={hPct >= 70 ? '#4caf50' : '#f44336'} fontWeight="bold">
                  {h.acertos}/{h.total} ({hPct}%)
                </Text>
                <Text fontSize={11} color="#aaa">{data}</Text>
              </XStack>
            );
          })}
        </View>
      )}

      {expandido && historico.length === 0 && (
        <Text fontSize={12} color="#aaa" style={{ marginTop: 8 }}>Nenhum quiz realizado ainda.</Text>
      )}
    </View>
  );
}

function AbaRanking({ alunos }: { alunos: AlunoStat[] }) {
  const top = [...alunos].sort((a, b) => b.score - a.score);
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {top.map((a, i) => (
        <CartaoAluno key={a.id} aluno={a} pos={i + 1} />
      ))}
      {top.length === 0 && (
        <Text color="#aaa" style={{ textAlign: 'center', marginTop: 32 }}>Nenhum aluno cadastrado.</Text>
      )}
    </ScrollView>
  );
}

function AbaAlunos({ alunos }: { alunos: AlunoStat[] }) {
  const [busca, setBusca] = useState('');
  const filtrados = busca.trim()
    ? alunos.filter(
        (a) =>
          a.name.toLowerCase().includes(busca.toLowerCase()) ||
          a.email.toLowerCase().includes(busca.toLowerCase())
      )
    : alunos;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.buscaBox}>
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar aluno por nome ou e-mail..."
          placeholderTextColor="#aaa"
          style={s.buscaInput}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {filtrados.map((a, i) => (
          <CartaoAluno key={a.id} aluno={a} pos={i + 1} />
        ))}
        {filtrados.length === 0 && (
          <Text color="#aaa" style={{ textAlign: 'center', marginTop: 32 }}>Nenhum aluno encontrado.</Text>
        )}
      </ScrollView>
    </View>
  );
}

export default function EstatisticasAdmin() {
  const router = useRouter();
  const { fs } = useLayout();
  const [abaAtiva, setAbaAtiva] = useState<0 | 1>(0);
  const [alunos, setAlunos] = useState<AlunoStat[]>([]);
  const [carregando, setCarreg] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/stats/alunos')
      .then((r) => setAlunos(r.data as AlunoStat[]))
      .catch(() => setErro('Não foi possível carregar as estatísticas.'))
      .finally(() => setCarreg(false));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <XStack backgroundColor={palette.primaryBlue} pt="$2" pb="$3" px="$4" ai="center" gap="$3">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={palette.white} size={24} />
        </TouchableOpacity>
        <Text color={palette.white} fontSize={fs(18)} fontWeight="bold" fontFamily={primaryFontA}>
          Estatísticas & Ranking
        </Text>
      </XStack>

      <XStack backgroundColor={palette.darkBlue}>
        {['Ranking', 'Todos os Alunos'].map((label, i) => (
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

      {carregando && (
        <ActivityIndicator color={palette.primaryBlue} size="large" style={{ marginTop: 40 }} />
      )}
      {erro && (
        <Text color={palette.red} style={{ textAlign: 'center', marginTop: 32 }}>{erro}</Text>
      )}
      {!carregando && !erro && (
        abaAtiva === 0
          ? <AbaRanking alunos={alunos} />
          : <AbaAlunos alunos={alunos} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  aba: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  abaAtiva: { borderBottomWidth: 3, borderBottomColor: palette.primaryGreen },
  cartao: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: '#f5f7fa', borderRadius: 8, paddingVertical: 8 },
  historico: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  linhaHistorico: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  badge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  buscaBox: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
  },
  buscaInput: { fontSize: 14, color: palette.offBlack },
});
