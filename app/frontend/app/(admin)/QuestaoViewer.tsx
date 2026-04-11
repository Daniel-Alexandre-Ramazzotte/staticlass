import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from 'app/context/AuthContext';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';
import { SharedQuestionViewer } from 'app/components/questions/SharedQuestionViewer';
import { useLayout } from 'app/components/AppButton';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { Text, XStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';

type ResultadoSQL = {
  colunas: string[];
  linhas: Record<string, unknown>[];
  total_linhas: number;
  limitado: boolean;
};

const EXEMPLOS_SQL = [
  'SELECT * FROM questions LIMIT 10',
  'SELECT * FROM chapters ORDER BY number',
  "SELECT * FROM users WHERE role = 'aluno' LIMIT 20",
  'SELECT COUNT(*) AS total FROM questions',
  "SELECT id, name, email FROM users WHERE role = 'professor' LIMIT 20",
];

function AbaSQLViewer() {
  const { fs, maxW } = useLayout();
  const [query, setQuery] = useState('SELECT * FROM questions LIMIT 10');
  const [resultado, setResultado] = useState<ResultadoSQL | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const executar = async () => {
    if (!query.trim()) return;
    setCarregando(true);
    setErro(null);
    setResultado(null);
    try {
      const response = await api.post<ResultadoSQL>('/admin/sql', { sql: query });
      setResultado(response.data);
    } catch (error: any) {
      setErro(error?.response?.data?.error ?? 'Erro desconhecido');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: maxW ?? 860 }}>
        <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="700" mb={6}>
          Exemplos
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <XStack gap={8}>
            {EXEMPLOS_SQL.map((example) => (
              <TouchableOpacity
                key={example}
                onPress={() => setQuery(example)}
                style={styles.chip}
              >
                <Text fontSize={11} color={palette.darkBlue}>
                  {example}
                </Text>
              </TouchableOpacity>
            ))}
          </XStack>
        </ScrollView>

        <Text fontSize={fs(13)} color={palette.darkBlue} fontWeight="700" mb={4}>
          Query SQL (somente leitura)
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          multiline
          style={styles.sqlInput}
          placeholder="SELECT ..."
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
        <TouchableOpacity style={styles.searchButton} onPress={executar} disabled={carregando}>
          <Text color="#fff" fontWeight="700" fontSize={fs(15)}>
            ▶ Executar
          </Text>
        </TouchableOpacity>

        {carregando ? <ActivityIndicator color={palette.primaryBlue} style={{ marginTop: 16 }} /> : null}

        {erro ? (
          <View style={styles.errorBox}>
            <Text color={palette.red} fontSize={14}>
              {erro}
            </Text>
          </View>
        ) : null}

        {resultado ? (
          <View style={{ marginTop: 16 }}>
            <Text fontSize={fs(13)} color="#555" mb={8}>
              {resultado.total_linhas} linha(s)
              {resultado.limitado ? ' (limitado a 500)' : ''}
            </Text>
            <ScrollView horizontal>
              <View>
                <View style={styles.tableHeader}>
                  {resultado.colunas.map((coluna) => (
                    <View key={coluna} style={styles.headerCell}>
                      <Text color="#fff" fontSize={12} fontWeight="700">
                        {coluna}
                      </Text>
                    </View>
                  ))}
                </View>
                {resultado.linhas.map((linha, index) => (
                  <View
                    key={`${index}-${resultado.colunas.join('-')}`}
                    style={[
                      styles.tableRow,
                      index % 2 === 1 ? styles.altTableRow : null,
                    ]}
                  >
                    {resultado.colunas.map((coluna) => (
                      <View key={coluna} style={styles.rowCell}>
                        <Text fontSize={12} color={palette.offBlack} numberOfLines={2}>
                          {linha[coluna] == null ? '—' : String(linha[coluna])}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

export default function QuestaoViewerScreen() {
  const router = useRouter();
  const { fs } = useLayout();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const isAdmin = role === 'admin';
  const tabs = isAdmin ? ['Visualização', 'Banco de Dados (SQL)'] : ['Visualização'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <XStack backgroundColor={palette.primaryBlue} pt="$2" pb="$3" px="$4" ai="center" gap="$3">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={palette.white} size={24} />
        </TouchableOpacity>
        <Text color={palette.white} fontSize={fs(18)} fontWeight="700" fontFamily={primaryFontA}>
          Gerenciar Questões
        </Text>
      </XStack>

      <XStack backgroundColor={palette.darkBlue}>
        {tabs.map((label, index) => (
          <TouchableOpacity
            key={label}
            onPress={() => setActiveTab(index as 0 | 1)}
            style={[styles.tab, activeTab === index ? styles.activeTab : null]}
          >
            <Text
              color={activeTab === index ? palette.white : 'rgba(255,255,255,0.6)'}
              fontWeight={activeTab === index ? '700' : '400'}
              fontSize={fs(14)}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </XStack>

      {activeTab === 0 || !isAdmin ? (
        <SharedQuestionViewer mode="manage" returnTo="/(admin)/QuestaoViewer" />
      ) : (
        <AbaSQLViewer />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: palette.primaryGreen,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.darkBlue,
    backgroundColor: '#f0f4f8',
  },
  sqlInput: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    borderRadius: 12,
    padding: 12,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  searchButton: {
    backgroundColor: palette.primaryBlue,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: '#fff3f2',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: palette.primaryBlue,
  },
  headerCell: {
    minWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  altTableRow: {
    backgroundColor: '#f5f7fa',
  },
  rowCell: {
    minWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e6ecf2',
  },
});
