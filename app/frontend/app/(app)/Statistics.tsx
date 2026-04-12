import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from 'app/services/api';
import { palette as paletaEstatica, primaryFontA } from 'app/constants/style';
import { useTema } from '../../src/context/ThemeContext';

declare global {
  // Minimal runtime typing for the shared Axios client in this frontend app.
  var process: {
    env: {
      EXPO_PUBLIC_API_URL?: string;
    };
  };
}

type Overview = {
  total_answers: number;
  correct_answers: number;
  overall_accuracy_pct: number;
};

type ChapterRow = {
  chapter_id: number | null;
  chapter_name: string;
  answered_count: number;
  correct_count: number;
  accuracy_pct: number;
};

type TopicRow = {
  topic_id: number | null;
  topic_name: string;
  chapter_id: number | null;
  chapter_name: string;
  answered_count: number;
  correct_count: number;
  accuracy_pct: number;
};

type TrendRow = {
  week_start: string;
  label: string;
  answered_count: number;
  correct_count: number;
  accuracy_pct: number;
};

type StudentDashboard = {
  overview: Overview;
  chapters: ChapterRow[];
  topics: TopicRow[];
  trend_4w: TrendRow[];
};

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(/\.0$/, '')}%`;
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ProgressRow({
  title,
  subtitle,
  percent,
  answered,
  correct,
}: {
  title: string;
  subtitle?: string;
  percent: number;
  answered: number;
  correct: number;
}) {
  const fillWidth = `${Math.max(4, Math.min(percent, 100))}%` as any;

  return (
    <View style={styles.progressRow}>
      <View style={styles.progressRowHeader}>
        <View style={styles.progressRowText}>
          <Text style={styles.progressTitle}>{title}</Text>
          {subtitle ? <Text style={styles.progressSubtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.progressScoreWrap}>
          <Text style={styles.progressScore}>{formatPercent(percent)}</Text>
          <Text style={styles.progressDetail}>
            {correct}/{answered}
          </Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: fillWidth,
              backgroundColor: percent >= 70 ? paletaEstatica.primaryGreen : paletaEstatica.primaryBlue,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function StatisticsScreen() {
  const router = useRouter();
  const { paleta: palette } = useTema();
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    setError(null);

    api
      .get('/users/analytics/dashboard')
      .then((response) => {
        setDashboard(response.data as StudentDashboard);
      })
      .catch(() => {
        setError('Não foi possível carregar seu painel de desempenho.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const overview = dashboard?.overview ?? {
    total_answers: 0,
    correct_answers: 0,
    overall_accuracy_pct: 0,
  };
  const chapters = dashboard?.chapters ?? [];
  const topics = dashboard?.topics ?? [];
  const trend = dashboard?.trend_4w ?? [
    { week_start: '', label: '', answered_count: 0, correct_count: 0, accuracy_pct: 0 },
    { week_start: '', label: '', answered_count: 0, correct_count: 0, accuracy_pct: 0 },
    { week_start: '', label: '', answered_count: 0, correct_count: 0, accuracy_pct: 0 },
    { week_start: '', label: '', answered_count: 0, correct_count: 0, accuracy_pct: 0 },
  ];

  const maxAnswered = Math.max(...trend.map((item) => item.answered_count), 1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.offWhite }]}>
      <View style={[styles.header, { backgroundColor: palette.primaryBlue }]}>
        <Text style={styles.headerTitle}>Estatísticas</Text>
        <Text style={styles.headerSubtitle}>Seu desempenho agora vem do histórico de respostas.</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={palette.primaryBlue} />
        </View>
      ) : error && !dashboard ? (
        <View style={styles.centerState}>
          <Text style={[styles.errorText, { color: palette.red }]}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <SectionCard title="Visão geral" subtitle="Resumo rápido do seu volume e precisão">
            <View style={styles.metricsRow}>
              <MetricCard
                label="Total de respostas"
                value={String(overview.total_answers)}
                accent={palette.primaryBlue}
              />
              <MetricCard
                label="Acertos"
                value={String(overview.correct_answers)}
                accent={palette.primaryGreen}
              />
              <MetricCard
                label="Precisão geral"
                value={formatPercent(overview.overall_accuracy_pct)}
                accent={overview.overall_accuracy_pct >= 70 ? palette.primaryGreen : palette.red}
              />
            </View>
          </SectionCard>

          <SectionCard title="Capítulos" subtitle="Precisão por capítulo respondido">
            {chapters.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma resposta registrada ainda.</Text>
            ) : (
              <View style={styles.sectionList}>
                {chapters.map((chapter) => (
                  <ProgressRow
                    key={`${chapter.chapter_id ?? 'chapter'}-${chapter.chapter_name}`}
                    title={chapter.chapter_name}
                    subtitle={`${chapter.answered_count} respostas`}
                    percent={chapter.accuracy_pct}
                    answered={chapter.answered_count}
                    correct={chapter.correct_count}
                  />
                ))}
              </View>
            )}
          </SectionCard>

          <SectionCard title="Tópicos" subtitle="Detalhamento por tópico dentro dos capítulos">
            {topics.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma resposta registrada ainda.</Text>
            ) : (
              <View style={styles.sectionList}>
                {topics.map((topic) => (
                  <View
                    key={`${topic.topic_id ?? 'topic'}-${topic.topic_name}`}
                    style={styles.topicCard}
                  >
                    <View style={styles.topicHeader}>
                      <View style={styles.progressRowText}>
                        <Text style={styles.progressTitle}>{topic.topic_name}</Text>
                        <Text style={styles.topicSubtitle}>
                          {topic.chapter_name} · {topic.answered_count} respostas
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.topicBadge,
                          {
                            backgroundColor:
                              topic.accuracy_pct >= 70 ? 'rgba(85,191,68,0.14)' : 'rgba(0,116,195,0.12)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.topicBadgeText,
                            {
                              color:
                                topic.accuracy_pct >= 70 ? palette.primaryGreen : palette.primaryBlue,
                            },
                          ]}
                        >
                          {formatPercent(topic.accuracy_pct)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.topicMeta}>
                      {topic.correct_count}/{topic.answered_count} acertos
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>

          <SectionCard title="Tendência de 4 semanas" subtitle="Últimos 28 dias em quatro blocos semanais">
            <View style={styles.trendWrap}>
              <View style={styles.trendRow}>
                {trend.map((week) => {
                  const barHeight = Math.max(10, (week.answered_count / maxAnswered) * 120);
                  return (
                    <View key={week.week_start || week.label} style={styles.trendColumn}>
                      <View style={styles.trendBarSlot}>
                        <View
                          style={[
                            styles.trendBar,
                            {
                              height: barHeight,
                              backgroundColor:
                                week.accuracy_pct >= 70 ? palette.primaryGreen : palette.primaryBlue,
                              opacity: week.answered_count === 0 ? 0.25 : 1,
                            },
                          ]}
                        >
                          <Text style={styles.trendBarText}>{formatPercent(week.accuracy_pct)}</Text>
                        </View>
                      </View>
                      <Text style={styles.trendLabel}>{week.label || '--'}</Text>
                      <Text style={styles.trendMeta}>{week.answered_count} resp.</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.trendNote}>
                Cada barra mostra a precisão da semana e a altura acompanha o volume de respostas.
              </Text>
            </View>
          </SectionCard>
        </ScrollView>
      )}

      <Pressable
        style={[styles.footerButton, { backgroundColor: palette.primaryBlue }]}
        onPress={() => router.back()}
      >
        <Text style={styles.footerText}>VOLTAR</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    color: paletaEstatica.white,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: primaryFontA,
  },
  headerSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: paletaEstatica.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeading: {
    gap: 4,
  },
  sectionTitle: {
    color: paletaEstatica.darkBlue,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 100,
    backgroundColor: paletaEstatica.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  metricLabel: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: 11,
  },
  sectionList: {
    gap: 12,
  },
  progressRow: {
    gap: 8,
  },
  progressRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  progressRowText: {
    flex: 1,
    gap: 4,
  },
  progressTitle: {
    color: paletaEstatica.offBlack,
    fontSize: 14,
    fontWeight: '700',
  },
  progressSubtitle: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 11,
  },
  progressScoreWrap: {
    alignItems: 'flex-end',
  },
  progressScore: {
    color: paletaEstatica.primaryBlue,
    fontSize: 14,
    fontWeight: '800',
  },
  progressDetail: {
    color: 'rgba(0,0,0,0.45)',
    fontSize: 11,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(9,61,96,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
  },
  emptyText: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: 13,
  },
  topicCard: {
    backgroundColor: 'rgba(9,61,96,0.04)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  topicSubtitle: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 11,
  },
  topicBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  topicBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  topicMeta: {
    color: 'rgba(0,0,0,0.45)',
    fontSize: 11,
  },
  trendWrap: {
    gap: 12,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  trendColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  trendBarSlot: {
    height: 140,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  trendBar: {
    width: '70%',
    minHeight: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBarText: {
    color: paletaEstatica.white,
    fontSize: 11,
    fontWeight: '800',
  },
  trendLabel: {
    color: paletaEstatica.offBlack,
    fontSize: 11,
    fontWeight: '700',
  },
  trendMeta: {
    color: 'rgba(0,0,0,0.45)',
    fontSize: 10,
  },
  trendNote: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 12,
  },
  footerButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    color: paletaEstatica.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
