import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { palette, primaryFontA, primaryFontC } from 'app/constants/style';
import api from 'app/services/api';

type StudentStatus = 'nova' | 'em_andamento' | 'entregue' | 'entregue_fora_do_prazo';
type RiskBand = 'critico' | 'atencao' | 'ok';

type ResultsPayload = {
  summary: {
    assigned_students: number;
    submitted_students: number;
    average_score_pct: number;
    highest_error_rate_pct: number;
    late_students: number;
    at_risk_students: number;
  };
  risk_students: {
    student_id: number;
    student_name: string;
    student_status: StudentStatus;
    submitted_at: string | null;
    score_pct: number | null;
    risk_band: RiskBand;
  }[];
  score_distribution: {
    bucket: '0-49' | '50-69' | '70-100';
    count: number;
  }[];
  students: {
    student_id: number;
    student_name: string;
    student_status: StudentStatus;
    submitted_at: string | null;
    score_pct: number | null;
  }[];
  per_question: {
    question_id: number;
    order_index: number;
    error_rate_pct: number;
    response_count: number;
  }[];
  change_log: {
    id: number;
    action: string;
    summary: string;
    created_at: string;
  }[];
};

const STATUS_LABELS: Record<StudentStatus, string> = {
  nova: 'Não iniciou',
  em_andamento: 'Em andamento',
  entregue: 'Entregue',
  entregue_fora_do_prazo: 'Entregue fora do prazo',
};

const RISK_LABELS: Record<RiskBand, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  ok: 'OK',
};

const RISK_COLORS: Record<RiskBand, string> = {
  critico: '#d9534f',
  atencao: '#f0ad4e',
  ok: '#4caf50',
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString('pt-BR');
}

function studentStatusLabel(status: StudentStatus) {
  return STATUS_LABELS[status];
}

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
    <Text color={palette.darkBlue} fontSize={17} fontWeight="700">
      {children}
    </Text>
  );
}

export function ListResultsPanel({ listId }: { listId: number }) {
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<ResultsPayload>(`/lists/${listId}/results`)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar os resultados desta lista.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      setData(null);
    };
  }, [listId]);

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={palette.primaryBlue} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorBanner}>
        <Text color={palette.red} fontSize={14}>
          {error ?? 'Não foi possível carregar os resultados.'}
        </Text>
      </View>
    );
  }

  const pendingStudents = Math.max(
    data.summary.assigned_students - data.summary.submitted_students,
    0,
  );
  const distributionTotal = data.summary.submitted_students || 1;

  return (
    <View style={styles.root}>
      <Text color={palette.darkBlue} fontSize={20} fontWeight="700" fontFamily={primaryFontA}>
        Resultados da lista
      </Text>

      <XStack flexWrap="wrap" gap="$3" mt="$3">
        <MetricCard label="Enviadas" value={String(data.summary.submitted_students)} tone={palette.primaryGreen} />
        <MetricCard label="Pendentes" value={String(pendingStudents)} />
        <MetricCard
          label="Alunos em risco"
          value={String(data.summary.at_risk_students)}
          tone="#f57c00"
        />
        <MetricCard
          label="Atrasados"
          value={String(data.summary.late_students)}
          tone="#d9534f"
        />
        <MetricCard
          label="Média da turma"
          value={`${data.summary.average_score_pct.toFixed(0)}%`}
          tone={palette.primaryGreen}
        />
        <MetricCard
          label="Maior taxa de erro"
          value={`${data.summary.highest_error_rate_pct.toFixed(0)}%`}
          tone="#f57c00"
        />
      </XStack>

      {data.summary.submitted_students === 0 ? (
        <View style={styles.emptyState}>
          <Text color={palette.darkBlue} fontSize={16} fontWeight="700" fontFamily={primaryFontA}>
            Ainda não há envios
          </Text>
          <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC} mt="$2">
            Os blocos abaixo já mostram o estado da lista, e os indicadores de risco vão ganhar
            forma quando os alunos começarem a responder.
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionTitle>Alunos em risco</SectionTitle>
        <YStack gap="$2" mt="$3">
          {data.risk_students.length > 0 ? (
            data.risk_students.map((student) => (
              <View key={student.student_id} style={styles.rowCard}>
                <XStack ai="center" jc="space-between" gap="$3">
                  <YStack f={1} gap="$1">
                    <Text color={palette.darkBlue} fontSize={14} fontWeight="700">
                      {student.student_name}
                    </Text>
                    <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                      {studentStatusLabel(student.student_status)}
                    </Text>
                  </YStack>
                  <YStack ai="flex-end" gap="$1">
                    <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[student.risk_band] }]}>
                      <Text color="#fff" fontSize={11} fontWeight="700">
                        {RISK_LABELS[student.risk_band]}
                      </Text>
                    </View>
                    {student.score_pct != null ? (
                      <Text color={palette.primaryGreen} fontSize={13} fontWeight="700">
                        {student.score_pct.toFixed(0)}%
                      </Text>
                    ) : (
                      <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                        Sem envio
                      </Text>
                    )}
                    {formatDate(student.submitted_at) ? (
                      <Text color="#6c7b8a" fontSize={11} fontFamily={primaryFontC}>
                        {formatDate(student.submitted_at)}
                      </Text>
                    ) : null}
                  </YStack>
                </XStack>
              </View>
            ))
          ) : (
            <View style={styles.emptyInline}>
              <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC}>
                Nenhum aluno está em alerta agora.
              </Text>
            </View>
          )}
        </YStack>
      </View>

      <View style={styles.section}>
        <SectionTitle>Distribuição de pontuação</SectionTitle>
        <YStack gap="$2" mt="$3">
          {data.score_distribution.map((bucket) => {
            const widthPct =
              bucket.count === 0
                ? 0
                : Math.max((bucket.count / distributionTotal) * 100, 4);
            return (
              <View key={bucket.bucket} style={styles.bucketRow}>
                <XStack ai="center" jc="space-between" mb="$2">
                  <Text color={palette.darkBlue} fontSize={13} fontWeight="700">
                    {bucket.bucket}
                  </Text>
                  <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                    {bucket.count} aluno(s)
                  </Text>
                </XStack>
                <View style={styles.bucketTrack}>
                  <View
                    style={[
                      styles.bucketFill,
                      {
                        width: widthPct === 0 ? 0 : `${widthPct}%`,
                        backgroundColor:
                          bucket.bucket === '0-49'
                            ? '#d9534f'
                            : bucket.bucket === '50-69'
                              ? '#f0ad4e'
                              : palette.primaryGreen,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </YStack>
      </View>

      <View style={styles.section}>
        <SectionTitle>Questões</SectionTitle>
        <YStack gap="$2" mt="$3">
          {data.per_question.map((question) => (
            <View key={question.question_id} style={styles.rowCard}>
              <XStack ai="center" jc="space-between" gap="$3">
                <Text color={palette.darkBlue} fontSize={14} fontWeight="700">
                  Questão {question.order_index}
                </Text>
                <YStack ai="flex-end" gap="$1">
                  <Text color="#f57c00" fontSize={13} fontWeight="700">
                    {question.error_rate_pct.toFixed(0)}%
                  </Text>
                  <Text color="#6c7b8a" fontSize={11} fontFamily={primaryFontC}>
                    {question.response_count} respostas
                  </Text>
                </YStack>
              </XStack>
            </View>
          ))}
        </YStack>
      </View>

      <View style={styles.section}>
        <SectionTitle>Alunos</SectionTitle>
        <YStack gap="$2" mt="$3">
          {data.students.map((student) => (
            <View key={student.student_id} style={styles.rowCard}>
              <XStack ai="center" jc="space-between" gap="$3">
                <YStack f={1} gap="$1">
                  <Text color={palette.darkBlue} fontSize={14} fontWeight="700">
                    {student.student_name}
                  </Text>
                  <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                    {studentStatusLabel(student.student_status)}
                  </Text>
                </YStack>
                <YStack ai="flex-end" gap="$1">
                  {student.score_pct != null ? (
                    <Text color={palette.primaryGreen} fontSize={13} fontWeight="700">
                      {student.score_pct.toFixed(0)}%
                    </Text>
                  ) : null}
                  {formatDate(student.submitted_at) ? (
                    <Text color="#6c7b8a" fontSize={11} fontFamily={primaryFontC}>
                      {formatDate(student.submitted_at)}
                    </Text>
                  ) : null}
                </YStack>
              </XStack>
            </View>
          ))}
        </YStack>
      </View>

      <View style={styles.section}>
        <SectionTitle>Histórico de alterações</SectionTitle>
        <YStack gap="$2" mt="$3">
          {data.change_log.map((entry) => (
            <View key={entry.id} style={styles.rowCard}>
              <Text color={palette.darkBlue} fontSize={13} fontWeight="700">
                {entry.summary}
              </Text>
              <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC} mt="$1">
                {new Date(entry.created_at).toLocaleString('pt-BR')}
              </Text>
            </View>
          ))}
        </YStack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 24,
    gap: 16,
  },
  loadingState: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    marginTop: 24,
    backgroundColor: '#fff3f2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f2b8b5',
  },
  metricCard: {
    minWidth: 148,
    flexGrow: 1,
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  section: {
    gap: 8,
  },
  rowCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  emptyState: {
    backgroundColor: '#fff8ea',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f5d79b',
  },
  emptyInline: {
    backgroundColor: '#f5f7fa',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  riskBadge: {
    alignSelf: 'flex-end',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bucketRow: {
    gap: 8,
  },
  bucketTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e7edf4',
    overflow: 'hidden',
  },
  bucketFill: {
    height: '100%',
    borderRadius: 999,
  },
});
