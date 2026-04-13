import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { XStack, Text } from 'tamagui';
import { ChevronDown, ChevronUp } from '@tamagui/lucide-icons';
import { palette } from 'app/constants/style';
import api from 'app/services/api';

export type AlunoStat = {
  id: number;
  name: string;
  email: string;
  xp: number;
  total_quizzes: number;
  total_acertos: number;
  total_questoes: number;
  media_pct: number;
};

type ChapterStat = {
  capitulo_nome: string;
  total_respostas: number;
  acertos: number;
  precisao_pct: number;
};

function Medalha({ posicao }: { posicao: number }) {
  if (posicao === 1) return <Text fontSize={20}>🥇</Text>;
  if (posicao === 2) return <Text fontSize={20}>🥈</Text>;
  if (posicao === 3) return <Text fontSize={20}>🥉</Text>;
  return <Text fontSize={14} color="#888" style={{ minWidth: 28, textAlign: 'center' }}>#{posicao}</Text>;
}

export function CartaoAluno({ aluno, posicao }: { aluno: AlunoStat; posicao: number }) {
  const [expandido, setExpandido] = useState(false);
  const [capitulos, setCapitulos] = useState<ChapterStat[]>([]);
  const [carregando, setCarregando] = useState(false);

  const aproveitamento = aluno.total_questoes > 0
    ? Math.round((aluno.total_acertos / aluno.total_questoes) * 100)
    : 0;

  const corAproveitamento = aproveitamento >= 70 ? '#4caf50' : aproveitamento >= 50 ? '#ff9800' : '#f44336';

  const alternarExpansao = useCallback(async () => {
    if (expandido) { setExpandido(false); return; }
    if (capitulos.length > 0) { setExpandido(true); return; }
    setCarregando(true);
    try {
      const { data } = await api.get(`/admin/stats/aluno/${aluno.id}`);
      setCapitulos(data as ChapterStat[]);
      setExpandido(true);
    } finally {
      setCarregando(false);
    }
  }, [aluno.id, expandido, capitulos.length]);

  return (
    <View style={estilos.cartao}>
      <TouchableOpacity onPress={carregando ? undefined : alternarExpansao} activeOpacity={0.8}>
        <XStack ai="center" gap={10}>
          <Medalha posicao={posicao} />
          <View style={{ flex: 1 }}>
            <Text fontSize={15} fontWeight="bold" color={palette.darkBlue}>{aluno.name}</Text>
            <Text fontSize={12} color="#888">{aluno.email}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text fontSize={16} fontWeight="bold" color={palette.primaryGreen}>{aluno.xp} XP</Text>
            <Text fontSize={11} color="#999">
              {aluno.total_quizzes} quiz{aluno.total_quizzes !== 1 ? 'zes' : ''}
            </Text>
          </View>
          {carregando
            ? <ActivityIndicator size="small" color={palette.primaryBlue} />
            : expandido
              ? <ChevronUp size={16} color={palette.darkBlue} />
              : <ChevronDown size={16} color={palette.darkBlue} />
          }
        </XStack>

        <XStack gap={16} mt={10}>
          {[
            { valor: aluno.total_acertos,  rotulo: 'acertos' },
            { valor: aluno.total_questoes, rotulo: 'questões' },
            { valor: `${aproveitamento}%`, rotulo: 'aproveitamento', cor: corAproveitamento },
          ].map(({ valor, rotulo, cor }) => (
            <View key={rotulo} style={estilos.caixaStat}>
              <Text fontSize={18} fontWeight="bold" color={cor ?? palette.primaryBlue}>{valor}</Text>
              <Text fontSize={11} color="#888">{rotulo}</Text>
            </View>
          ))}
        </XStack>
      </TouchableOpacity>

      {expandido && capitulos.length > 0 && (
        <View style={estilos.historico}>
          <Text fontSize={12} fontWeight="bold" color={palette.darkBlue} style={{ marginBottom: 6 }}>
            Precisão por capítulo
          </Text>
          {capitulos.map((cap) => (
            <XStack key={cap.capitulo_nome} style={estilos.linhaHistorico} ai="center" gap={8}>
              <Text fontSize={12} color={palette.offBlack} style={{ flex: 1 }}>
                {cap.capitulo_nome}
              </Text>
              <Text fontSize={11} color="#999">
                {cap.acertos}/{cap.total_respostas}
              </Text>
              <Text
                fontSize={13}
                color={cap.precisao_pct >= 70 ? '#4caf50' : cap.precisao_pct >= 50 ? '#ff9800' : '#f44336'}
                fontWeight="bold"
              >
                {cap.precisao_pct.toFixed(1)}%
              </Text>
            </XStack>
          ))}
        </View>
      )}

      {expandido && capitulos.length === 0 && (
        <Text fontSize={12} color="#aaa" style={{ marginTop: 8 }}>Nenhuma resposta registrada.</Text>
      )}
    </View>
  );
}

export function AbaRanking({ alunos }: { alunos: AlunoStat[] }) {
  return (
    <>
      {alunos.map((aluno, i) => (
        <CartaoAluno key={aluno.id} aluno={aluno} posicao={i + 1} />
      ))}
      {alunos.length === 0 && (
        <Text color="#aaa" style={{ textAlign: 'center', marginTop: 32 }}>
          Nenhum aluno cadastrado.
        </Text>
      )}
    </>
  );
}

export function AbaAlunos({ alunos }: { alunos: AlunoStat[] }) {
  const [busca, setBusca] = useState('');

  const filtrados = busca.trim()
    ? alunos.filter(
        (a) =>
          a.name.toLowerCase().includes(busca.toLowerCase()) ||
          a.email.toLowerCase().includes(busca.toLowerCase()),
      )
    : alunos;

  return (
    <>
      <View style={estilos.caixaBusca}>
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por nome ou e-mail..."
          placeholderTextColor="#aaa"
          style={estilos.inputBusca}
        />
      </View>
      {filtrados.map((aluno, i) => (
        <CartaoAluno key={aluno.id} aluno={aluno} posicao={i + 1} />
      ))}
      {filtrados.length === 0 && (
        <Text color="#aaa" style={{ textAlign: 'center', marginTop: 32 }}>
          Nenhum aluno encontrado.
        </Text>
      )}
    </>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  caixaStat: {
    flex: 1, alignItems: 'center', backgroundColor: '#f5f7fa',
    borderRadius: 8, paddingVertical: 8,
  },
  historico: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  linhaHistorico: { paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  badge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  caixaBusca: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, elevation: 1,
  },
  inputBusca: { fontSize: 14, color: palette.offBlack },
});
