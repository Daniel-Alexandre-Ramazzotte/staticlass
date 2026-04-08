import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';
import { useLayout } from '../../src/constants/layout';
import { AlunoStat, AbaRanking, AbaAlunos } from '../../src/components/admin/EstatisticasCompartilhadas';

export default function StatsTab() {
  const { fs } = useLayout();
  const [abaAtiva, setAbaAtiva] = useState<0 | 1>(0);
  const [alunos, setAlunos] = useState<AlunoStat[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/stats/alunos')
      .then((r) => setAlunos(r.data as AlunoStat[]))
      .catch(() => setErro('Não foi possível carregar as estatísticas.'))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <XStack backgroundColor={palette.primaryBlue} pt="$2" pb="$3" px="$4" ai="center">
        <Text color={palette.white} fontSize={fs(18)} fontWeight="bold" fontFamily={primaryFontA}>
          Estatísticas & Ranking
        </Text>
      </XStack>

      <XStack backgroundColor={palette.darkBlue}>
        {(['Ranking', 'Todos os Alunos'] as const).map((label, i) => (
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
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {abaAtiva === 0 ? <AbaRanking alunos={alunos} /> : <AbaAlunos alunos={alunos} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  aba: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  abaAtiva: { borderBottomWidth: 3, borderBottomColor: palette.primaryGreen },
});
