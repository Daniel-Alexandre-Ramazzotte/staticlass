import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from 'app/context/AuthContext';
import { XStack, YStack, ZStack, Image, Text } from 'tamagui';
import { Menu } from '@tamagui/lucide-icons';
import { palette as paletaEstatica, primaryFontA, primaryFontC } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';
import { useTema } from '../../src/context/ThemeContext';
import api from 'app/services/api';

type AssignedList = {
  id: number;
  title: string;
  deadline: string;
  status: 'rascunho' | 'publicada' | 'encerrada';
  student_status: 'nova' | 'em_andamento' | 'entregue' | 'entregue_fora_do_prazo';
  question_count: number;
  submitted_at: string | null;
  score_pct: number | null;
  can_submit: boolean;
};

function Header({ name, subtitle }: { name: string; subtitle: string }) {
  const { paleta } = useTema();
  const palette = paleta;
  return (
    <XStack
      backgroundColor={palette.primaryBlue}
      pt="$10"
      pb="$4"
      px="$4"
      ai="center"
      jc="space-between"
      width="100%"
    >
      <XStack ai="center" gap="$3">
        <YStack
          width={42}
          height={42}
          borderRadius={21}
          backgroundColor="rgba(255,255,255,0.3)"
          ai="center"
          jc="center"
        >
          <Text color={palette.white} fontWeight="bold" fontSize={16}>
            {name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </YStack>
        <YStack>
          <Text color={palette.white} fontSize={16} fontWeight="bold" fontFamily={primaryFontA}>
            {name || 'Usuário'}
          </Text>
          <Text color="rgba(255,255,255,0.8)" fontSize={12}>
            {subtitle}
          </Text>
        </YStack>
      </XStack>
      <Menu color={palette.white} size={28} />
    </XStack>
  );
}

function chipLabel(status: AssignedList['student_status'] | AssignedList['status']) {
  const labels: Record<string, string> = {
    nova: 'Nova',
    em_andamento: 'Em andamento',
    entregue: 'Entregue',
    entregue_fora_do_prazo: 'Fora do prazo',
    publicada: 'Publicada',
    encerrada: 'Encerrada',
    rascunho: 'Rascunho',
  };
  return labels[status] ?? status;
}

function chipStyle(status: AssignedList['student_status'] | AssignedList['status']) {
  if (status === 'entregue_fora_do_prazo' || status === 'encerrada') {
    return { backgroundColor: '#f57c00' };
  }
  if (status === 'entregue') {
    return { backgroundColor: paletaEstatica.primaryGreen };
  }
  if (status === 'em_andamento') {
    return { backgroundColor: paletaEstatica.darkBlue };
  }
  return { backgroundColor: paletaEstatica.primaryBlue };
}

function ctaForList(list: AssignedList) {
  if (list.student_status === 'nova') {
    return list.status === 'encerrada' ? 'Entregar atrasada' : 'Começar';
  }
  if (list.student_status === 'em_andamento') return 'Continuar';
  return 'Ver resultado';
}

export default function HomeScreen() {
  const router = useRouter();
  const { role, name } = useAuth();
  const { paleta } = useTema();
  const palette = paleta;
  const [assignedLists, setAssignedLists] = useState<AssignedList[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (role !== 'aluno') return () => undefined;
      let active = true;
      setListsLoading(true);
      api
        .get<AssignedList[]>('/lists/assigned')
        .then((response) => {
          if (active) setAssignedLists(response.data);
        })
        .catch(() => {
          if (active) setAssignedLists([]);
        })
        .finally(() => {
          if (active) setListsLoading(false);
        });
      return () => {
        active = false;
      };
    }, [role]),
  );

  const subtitle = role === 'professor' ? 'Professor' : 'Nível 1 ⭐';

  const studentContent = useMemo(
    () =>
      role === 'aluno' ? (
        <View style={styles.listSection}>
          <Text color={palette.darkBlue} fontSize={20} fontWeight="700" fontFamily={primaryFontA}>
            Minhas Listas
          </Text>

          {listsLoading ? (
            <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC} mt="$2">
              Carregando listas...
            </Text>
          ) : assignedLists.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text color={palette.darkBlue} fontSize={16} fontWeight="700" fontFamily={primaryFontA}>
                Nenhuma lista por aqui
              </Text>
              <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC} mt="$2">
                Quando um professor publicar uma lista para você, ela aparecerá aqui.
              </Text>
            </View>
          ) : (
            <YStack gap="$3" mt="$3">
              {assignedLists.map((list) => (
                <View key={list.id} style={styles.listCard}>
                  <XStack ai="flex-start" jc="space-between" gap="$3">
                    <YStack f={1} gap="$2">
                      <Text color={palette.darkBlue} fontSize={16} fontWeight="700">
                        {list.title}
                      </Text>
                      <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                        Prazo: {new Date(list.deadline).toLocaleDateString('pt-BR')}
                      </Text>
                    </YStack>
                    <YStack gap="$2" ai="flex-end">
                      <View style={[styles.chip, chipStyle(list.status)]}>
                        <Text color="#fff" fontSize={11} fontWeight="700">
                          {chipLabel(list.status)}
                        </Text>
                      </View>
                      <View style={[styles.chip, chipStyle(list.student_status)]}>
                        <Text color="#fff" fontSize={11} fontWeight="700">
                          {chipLabel(list.student_status)}
                        </Text>
                      </View>
                    </YStack>
                  </XStack>

                  <XStack mt="$3" jc="space-between" ai="center">
                    <YStack gap="$1">
                      <Text color={palette.darkBlue} fontSize={13} fontFamily={primaryFontC}>
                        {list.question_count} questão(ões)
                      </Text>
                      {list.score_pct != null ? (
                        <Text color={palette.primaryGreen} fontSize={13} fontWeight="700">
                          Nota: {list.score_pct.toFixed(0)}%
                        </Text>
                      ) : null}
                      {list.submitted_at ? (
                        <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                          Concluída em {new Date(list.submitted_at).toLocaleString('pt-BR')}
                        </Text>
                      ) : null}
                    </YStack>

                    <TouchableOpacity
                      style={[
                        styles.listCta,
                        list.student_status === 'entregue_fora_do_prazo' || list.status === 'encerrada'
                          ? styles.warningCta
                          : null,
                      ]}
                      onPress={() => {
                        if (
                          list.student_status === 'entregue' ||
                          list.student_status === 'entregue_fora_do_prazo'
                        ) {
                          router.push({
                            pathname: '/(app)/ResultScreen',
                            params: {
                              list_id: String(list.id),
                              list_title: list.title,
                              submission_view: '1',
                            },
                          });
                          return;
                        }

                        router.push({
                          pathname: '/(app)/QuizInProgressScreen',
                          params: {
                            list_id: String(list.id),
                            list_title: list.title,
                            list_mode: '1',
                          },
                        });
                      }}
                    >
                      <Text color="#fff" fontSize={12} fontWeight="700">
                        {ctaForList(list)}
                      </Text>
                    </TouchableOpacity>
                  </XStack>
                </View>
              ))}
            </YStack>
          )}
        </View>
      ) : null,
    [assignedLists, listsLoading, palette.darkBlue, palette.primaryGreen, role, router],
  );

  if (role === 'admin') {
    return (
      <YStack f={1} backgroundColor={palette.offWhite}>
        <Header name={name || ''} subtitle="Administrador" />
        <YStack f={1} jc="center" ai="center" gap="$4" px="$8">
          <AppButton
            backgroundColor={palette.primaryGreen}
            onPress={() => router.push('/(admin)/QuestaoViewer')}
          >
            Gerenciar Questões
          </AppButton>
          <AppButton
            backgroundColor={palette.darkBlue}
            onPress={() => router.push('/(admin)/ProfessorManager')}
          >
            Gerenciar professores
          </AppButton>
          <AppButton
            backgroundColor={palette.red}
            onPress={() => router.push('/(admin)/AlunoManager')}
          >
            Gerenciar alunos
          </AppButton>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack f={1} backgroundColor={palette.offWhite}>
      <Header name={role === 'professor' ? `Prof. ${name || ''}` : name || ''} subtitle={subtitle} />

      <ZStack f={1} width="100%">
        <YStack position="absolute" bottom={0} left={0} right={0} ai="center" opacity={0.15}>
          <Image
            source={require('../../assets/images/logo.png')}
            width="100%"
            height={380}
            objectFit="contain"
          />
        </YStack>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <YStack px="$6" pt="$8" gap="$1">
            <Text color={palette.darkBlue} fontSize={26} fontWeight="900" fontFamily={primaryFontA}>
              Olá, {name || 'Usuário'}!
            </Text>
            <Text color={palette.darkBlue} fontSize={20} fontWeight="600" fontFamily={primaryFontC}>
              Bem-vindo!
            </Text>
          </YStack>

          {studentContent}
        </ScrollView>
      </ZStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 48,
  },
  listSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
    marginTop: 12,
  },
  listCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  listCta: {
    backgroundColor: paletaEstatica.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  warningCta: {
    backgroundColor: '#f57c00',
  },
});
