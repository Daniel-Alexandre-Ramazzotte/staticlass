import React, { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { Settings, Trophy } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';
import { AppButton } from 'app/components/AppButton';

const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function WeekRow({ row }: { row: (boolean | null)[] }) {
  return (
    <XStack gap="$1" jc="center">
      {row.map((val, i) => (
        <YStack
          key={i}
          width={36}
          height={20}
          borderRadius={10}
          backgroundColor={val === true ? palette.primaryGreen : val === false ? palette.red : 'rgba(255,255,255,0.3)'}
          ai="center"
          jc="center"
        >
          {val === false && <Text color={palette.white} fontSize={10}>✕</Text>}
        </YStack>
      ))}
    </XStack>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, role, email, name } = useAuth();
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [rankPosition, setRankPosition] = useState<number | null>(null);
  const [dadosCarregando, setDadosCarregando] = useState(true);
  const [calendar, setCalendar] = useState<(boolean | null)[][]>([
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ]);

  const buildCalendar = useCallback((historico: { criado_em: string }[]): (boolean | null)[][] => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const toKey = (data: Date) => {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };

    const praticados = new Set(historico.map((item) => item.criado_em.slice(0, 10)));
    const grid: (boolean | null)[][] = [];

    for (let semana = 3; semana >= 0; semana -= 1) {
      const linha: (boolean | null)[] = [];
      for (let dia = 0; dia < 7; dia += 1) {
        const data = new Date(hoje);
        const diaDaSemanaHoje = hoje.getDay();
        const offset = (semana * 7) + (diaDaSemanaHoje - dia);
        data.setDate(hoje.getDate() - offset);
        const chave = toKey(data);

        if (data > hoje) {
          linha.push(null);
        } else if (data.getTime() === hoje.getTime() && !praticados.has(chave)) {
          linha.push(null);
        } else {
          linha.push(praticados.has(chave));
        }
      }
      grid.push(linha);
    }

    return grid;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!email || role !== 'aluno') {
        setDadosCarregando(false);
        return;
      }

      setDadosCarregando(true);

      Promise.all([
        api.get(`/users/profile/${email.trim()}`),
        api.get('/gamification/ranking?page=1'),
        api.get('/users/historico'),
      ])
        .then(([resPerfil, resRanking, resHistorico]) => {
          setXp(resPerfil.data?.xp ?? 0);
          setStreak(resPerfil.data?.streak ?? 0);
          const ownEntry = resRanking.data?.own_entry;
          setRankPosition(ownEntry ? ownEntry.posicao : null);
          const historico = resHistorico.data ?? [];
          setCalendar(buildCalendar(historico));
        })
        .catch(() => {
          // Mantem os dados anteriores caso algum fetch falhe.
        })
        .finally(() => setDadosCarregando(false));
    }, [buildCalendar, email, role])
  );

  return (
    <YStack f={1} backgroundColor={palette.primaryBlue}>
      {/* Header */}
      <YStack backgroundColor={palette.primaryBlue} pt="$10" pb="$4" px="$5">
        <XStack ai="center" jc="space-between">
          <XStack ai="center" gap="$4">
            <YStack
              width={70}
              height={70}
              borderRadius={35}
              backgroundColor="rgba(200,200,200,0.5)"
              ai="center"
              jc="center"
            >
              <Text fontSize={28}>👤</Text>
            </YStack>
            <YStack>
              <Text color={palette.white} fontSize={20} fontWeight="bold" fontFamily={primaryFontA}>
                {name || 'Usuário'}
              </Text>
              <Text color="rgba(255,255,255,0.8)" fontSize={14}>
                {role === 'admin' ? 'Administrador' : role === 'professor' ? 'Professor' : 'Aluno'}
              </Text>
            </YStack>
          </XStack>
          <Settings
            color={palette.white}
            size={26}
            onPress={() => router.push('/(app)/Settings')}
          />
        </XStack>

        {role === 'aluno' && (
          <YStack mt="$3" gap="$1">
            {/* XP bar */}
            <YStack height={8} borderRadius={4} backgroundColor="rgba(255,255,255,0.3)">
              <YStack
                height={8}
                borderRadius={4}
                backgroundColor="#FFD700"
                width={`${Math.min((xp / 5000) * 100, 100)}%`}
              />
            </YStack>
            <XStack jc="space-between" mt="$1">
              <Text color="rgba(255,255,255,0.75)" fontSize={12}>
                {xp} XP total
              </Text>
              <Text color="rgba(255,255,255,0.75)" fontSize={12}>
                {streak === 0
                  ? 'Sequência: 0 dias - pratique hoje!'
                  : `Sequência: ${streak} dias`}
              </Text>
            </XStack>
            <Text
              fontSize={15}
              fontWeight="bold"
              color={palette.primaryGreen}
              mt="$1"
            >
              {dadosCarregando
                ? 'Ranking: -'
                : rankPosition !== null
                  ? `Ranking: #${rankPosition}`
                  : 'Ranking: -'}
            </Text>
          </YStack>
        )}

        {role === 'professor' && (
          <Text color="rgba(255,255,255,0.8)" fontSize={13} mt="$2">0 listas preparadas</Text>
        )}

        {role === 'admin' && (
          <Text color="rgba(255,255,255,0.8)" fontSize={13} mt="$2">0 dias de login</Text>
        )}
      </YStack>

      <ScrollView style={{ flex: 1 }}>
        {role === 'aluno' && (
          <YStack
            mx="$4"
            mt="$4"
            backgroundColor={palette.darkBlue}
            borderRadius={16}
            p="$4"
            gap="$3"
          >
            {/* Days header */}
            <XStack gap="$1" jc="center">
              {DAYS.map(d => (
                <YStack key={d} width={36} ai="center">
                  <Text color={palette.white} fontSize={11} fontWeight="bold">{d}</Text>
                </YStack>
              ))}
            </XStack>

            {calendar.map((row, i) => (
              <WeekRow key={i} row={row} />
            ))}

            <Text color="rgba(255,255,255,0.7)" fontSize={12} textAlign="right">
              {streak === 0 ? 'Sequência: 0 dias - pratique hoje!' : `Sequência: ${streak} dias`}
            </Text>
          </YStack>
        )}

        {role === 'aluno' && (
          <>
            {/* Trophies */}
            <XStack px="$4" mt="$4" gap="$3" jc="center">
              {[1, 2, 3, 4, 5].map(i => (
                <YStack key={i} ai="center">
                  <Trophy color={palette.primaryGreen} size={32} />
                </YStack>
              ))}
            </XStack>

            <YStack px="$6" mt="$6" mb="$4">
              <AppButton
                backgroundColor={palette.primaryGreen}
                onPress={() => router.push('/(app)/Statistics')}
              >
                Estatísticas do perfil
              </AppButton>
            </YStack>
          </>
        )}

        <YStack px="$6" mt="$4" mb="$8">
          <AppButton
            backgroundColor={palette.red}
            onPress={async () => {
              await signOut();
              router.replace('/(public)/login');
            }}
          >
            Sair
          </AppButton>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
