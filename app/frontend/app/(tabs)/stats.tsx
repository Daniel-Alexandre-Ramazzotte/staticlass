import React, { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text, XStack, YStack } from 'tamagui';

import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';
import { useLayout } from '../../src/constants/layout';

type DashboardPayload = {
  kpis: {
    active_users_7d: number;
    total_answers: number;
    aluno_activity_7d: number;
    professor_activity_7d: number;
  };
  accuracy_by_topic: {
    topic_id: number;
    topic_name: string;
    chapter_name: string | null;
    answered_count: number;
    accuracy_pct: number;
  }[];
  role_activity: {
    role: 'aluno' | 'professor';
    count_7d: number;
  }[];
};

function MetricCard({
  label,
  value,
  tone = palette.darkBlue,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text color={palette.darkBlue} fontSize={12} fontWeight="700">
        {label}
      </Text>
      <Text color={tone} fontSize={24} fontWeight="900">
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text color={palette.darkBlue} fontSize={17} fontWeight="700" fontFamily={primaryFontA}>
      {children}
    </Text>
  );
}

export default function StatsTab() {
  const { fs } = useLayout();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      api
        .get<DashboardPayload>('/admin/stats/dashboard')
        .then((response) => {
          if (active) setData(response.data);
        })
        .catch(() => {
          if (active) setError('Não foi possível carregar as estatísticas.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <XStack backgroundColor={palette.primaryBlue} pt="$2" pb="$3" px="$4" ai="center">
        <Text color={palette.white} fontSize={fs(18)} fontWeight="bold" fontFamily={primaryFontA}>
          Painel Operacional
        </Text>
      </XStack>

      {loading && (
        <ActivityIndicator color={palette.primaryBlue} size="large" style={{ marginTop: 40 }} />
      )}
      {error && (
        <Text color={palette.red} style={{ textAlign: 'center', marginTop: 32 }}>
          {error}
        </Text>
      )}
      {!loading && !error && data && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <XStack flexWrap="wrap" gap="$3">
            <MetricCard
              label="Usuários ativos 7d"
              value={String(data.kpis.active_users_7d)}
              tone={palette.primaryGreen}
            />
            <MetricCard
              label="Total de respostas"
              value={String(data.kpis.total_answers)}
              tone={palette.primaryGreen}
            />
            <MetricCard
              label="Atividade de alunos"
              value={String(data.kpis.aluno_activity_7d)}
              tone={palette.darkBlue}
            />
            <MetricCard
              label="Atividade de professores"
              value={String(data.kpis.professor_activity_7d)}
              tone="#f57c00"
            />
          </XStack>

          <View style={styles.section}>
            <SectionTitle>Precisão por tópico</SectionTitle>
            <YStack gap="$2" mt="$3">
              {data.accuracy_by_topic.length > 0 ? (
                data.accuracy_by_topic.map((topic) => (
                  <View key={topic.topic_id} style={styles.rowCard}>
                    <XStack ai="center" jc="space-between" gap="$3">
                      <YStack f={1}>
                        <Text color={palette.darkBlue} fontSize={14} fontWeight="700">
                          {topic.topic_name}
                        </Text>
                        <Text color="#6c7b8a" fontSize={12}>
                          {topic.chapter_name ?? 'Sem capítulo'} • {topic.answered_count} respostas
                        </Text>
                      </YStack>
                      <Text color={topic.accuracy_pct >= 70 ? palette.primaryGreen : '#f57c00'} fontSize={15} fontWeight="800">
                        {topic.accuracy_pct.toFixed(1)}%
                      </Text>
                    </XStack>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text color="#6c7b8a" fontSize={13}>
                    Ainda não há respostas suficientes para calcular a precisão por tópico.
                  </Text>
                </View>
              )}
            </YStack>
          </View>

          <View style={styles.section}>
            <SectionTitle>Atividade por papel</SectionTitle>
            <YStack gap="$2" mt="$3">
              {data.role_activity.map((role) => (
                <View key={role.role} style={styles.rowCard}>
                  <XStack ai="center" jc="space-between" gap="$3">
                    <Text color={palette.darkBlue} fontSize={14} fontWeight="700">
                      {role.role === 'aluno' ? 'Alunos' : 'Professores'}
                    </Text>
                    <Text color={palette.primaryBlue} fontSize={15} fontWeight="800">
                      {role.count_7d}
                    </Text>
                  </XStack>
                </View>
              ))}
            </YStack>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    gap: 8,
  },
  metricCard: {
    minWidth: 148,
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  rowCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
});
