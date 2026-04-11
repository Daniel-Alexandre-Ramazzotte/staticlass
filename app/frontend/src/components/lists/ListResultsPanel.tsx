import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { palette, primaryFontA, primaryFontC } from 'app/constants/style';
import api from 'app/services/api';

type ResultsPayload = {
  summary: {
    assigned_students: number;
    submitted_students: number;
    average_score_pct: number;
    highest_error_rate_pct: number;
  };
  students: {
    student_id: number;
    student_name: string;
    student_status: 'nova' | 'em_andamento' | 'entregue' | 'entregue_fora_do_prazo';
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

function studentStatusLabel(status: ResultsPayload['students'][number]['student_status']) {
  const labels: Record<ResultsPayload['students'][number]['student_status'], string> = {
    nova: 'Não iniciou',
    em_andamento: 'Em andamento',
    entregue: 'Entregue',
    entregue_fora_do_prazo: 'Entregue fora do prazo',
  };
  return labels[status];
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

  return (
    <View style={styles.root}>
      <Text color={palette.darkBlue} fontSize={20} fontWeight="700" fontFamily={primaryFontA}>
        Resultados da lista
      </Text>

      <XStack flexWrap="wrap" gap="$3" mt="$3">
        <View style={styles.metricCard}>
          <Text color={palette.darkBlue} fontSize={12} fontWeight="700">
            Enviadas
          </Text>
          <Text color={palette.primaryGreen} fontSize={24} fontWeight="900">
            {data.summary.submitted_students}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text color={palette.darkBlue} fontSize={12} fontWeight="700">
            Pendentes
          </Text>
          <Text color={palette.darkBlue} fontSize={24} fontWeight="900">
            {pendingStudents}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text color={palette.darkBlue} fontSize={12} fontWeight="700">
            Média da turma
          </Text>
          <Text color={palette.primaryGreen} fontSize={24} fontWeight="900">
            {data.summary.average_score_pct.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text color={palette.darkBlue} fontSize={12} fontWeight="700">
            Maior taxa de erro
          </Text>
          <Text color="#f57c00" fontSize={24} fontWeight="900">
            {data.summary.highest_error_rate_pct.toFixed(0)}%
          </Text>
        </View>
      </XStack>

      {data.summary.submitted_students === 0 ? (
        <View style={styles.emptyState}>
          <Text color={palette.darkBlue} fontSize={16} fontWeight="700" fontFamily={primaryFontA}>
            Ainda não há envios
          </Text>
          <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC} mt="$2">
            Os resultados aparecerão aqui quando os alunos começarem a responder.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text color={palette.darkBlue} fontSize={17} fontWeight="700">
              Alunos
            </Text>
            <YStack gap="$2" mt="$3">
              {data.students.map((student) => (
                <View key={student.student_id} style={styles.rowCard}>
                  <XStack ai="center" jc="space-between" gap="$3">
                    <YStack f={1}>
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
                      {student.submitted_at ? (
                        <Text color="#6c7b8a" fontSize={11} fontFamily={primaryFontC}>
                          {new Date(student.submitted_at).toLocaleString('pt-BR')}
                        </Text>
                      ) : null}
                    </YStack>
                  </XStack>
                </View>
              ))}
            </YStack>
          </View>

          <View style={styles.section}>
            <Text color={palette.darkBlue} fontSize={17} fontWeight="700">
              Questões
            </Text>
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
        </>
      )}

      <View style={styles.section}>
        <Text color={palette.darkBlue} fontSize={17} fontWeight="700">
          Histórico de alterações
        </Text>
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
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
});
