import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Settings, Trophy } from '@tamagui/lucide-icons';
import { palette, primaryFontA } from 'app/constants/style';
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';
import { AppButton } from 'app/components/AppButton';

declare global {
  var process: {
    env: {
      EXPO_PUBLIC_API_URL?: string;
    };
  };
}

const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function WeekRow({ row }: { row: (boolean | null)[] }) {
  return (
    <View style={styles.weekRow}>
      {row.map((val, i) => (
        <View
          key={i}
          style={[
            styles.dayCell,
            {
              backgroundColor:
                val === true ? palette.primaryGreen : val === false ? palette.red : 'rgba(255,255,255,0.3)',
            },
          ]}
        >
          {val === false ? <Text style={styles.dayCellText}>✕</Text> : null}
        </View>
      ))}
    </View>
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

  const buildCalendar = useCallback((days: string[]): (boolean | null)[][] => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const toKey = (data: Date) => {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };

    const praticados = new Set(days.map((day) => day.slice(0, 10)));
    const grid: (boolean | null)[][] = [];

    for (let semana = 3; semana >= 0; semana -= 1) {
      const linha: (boolean | null)[] = [];
      for (let dia = 0; dia < 7; dia += 1) {
        const data = new Date(hoje);
        const diaDaSemanaHoje = hoje.getDay();
        const offset = semana * 7 + (diaDaSemanaHoje - dia);
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
        api.get('/users/analytics/activity'),
      ])
        .then(([resPerfil, resRanking, resAtividade]) => {
          setXp(resPerfil.data?.xp ?? 0);
          setStreak(resPerfil.data?.streak ?? 0);
          const ownEntry = resRanking.data?.own_entry;
          setRankPosition(ownEntry ? ownEntry.posicao : null);
          const dias = Array.isArray(resAtividade.data?.days) ? resAtividade.data.days : [];
          setCalendar(buildCalendar(dias));
        })
        .catch(() => {
          // Mantem os dados anteriores caso algum fetch falhe.
        })
        .finally(() => setDadosCarregando(false));
    }, [buildCalendar, email, role])
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.primaryBlue }]}>
      <View style={[styles.header, { backgroundColor: palette.primaryBlue }]}>
        <View style={styles.headerRow}>
          <View style={styles.profileIdentity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View>
              <Text style={styles.name}>{name || 'Usuário'}</Text>
              <Text style={styles.role}>
                {role === 'admin' ? 'Administrador' : role === 'professor' ? 'Professor' : 'Aluno'}
              </Text>
            </View>
          </View>
          <Settings color={palette.white} size={26} onPress={() => router.push('/(app)/Settings')} />
        </View>

        {role === 'aluno' && (
          <View style={styles.studentHeaderStats}>
            <View style={styles.xpBarTrack}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${Math.min((xp / 5000) * 100, 100)}%` },
                ]}
              />
            </View>
            <View style={styles.xpRow}>
              <Text style={styles.headerMeta}>{xp} XP total</Text>
              <Text style={styles.headerMeta}>
                {streak === 0 ? 'Sequência: 0 dias - pratique hoje!' : `Sequência: ${streak} dias`}
              </Text>
            </View>
            <Text style={styles.rankText}>
              {dadosCarregando
                ? 'Ranking: -'
                : rankPosition !== null
                  ? `Ranking: #${rankPosition}`
                  : 'Ranking: -'}
            </Text>
          </View>
        )}

        {role === 'professor' && <Text style={styles.secondaryHeaderText}>0 listas preparadas</Text>}

        {role === 'admin' && <Text style={styles.secondaryHeaderText}>0 dias de login</Text>}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {role === 'aluno' && (
          <View style={styles.calendarCard}>
            <View style={styles.weekLabels}>
              {DAYS.map((d) => (
                <View key={d} style={styles.weekLabelCell}>
                  <Text style={styles.weekLabel}>{d}</Text>
                </View>
              ))}
            </View>

            {calendar.map((row, i) => (
              <WeekRow key={i} row={row} />
            ))}

            <Text style={styles.calendarFooter}>
              {streak === 0 ? 'Sequência: 0 dias - pratique hoje!' : `Sequência: ${streak} dias`}
            </Text>
          </View>
        )}

        {role === 'aluno' && (
          <>
            <View style={styles.trophiesRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.trophyWrap}>
                  <Trophy color={palette.primaryGreen} size={32} />
                </View>
              ))}
            </View>

            <View style={styles.buttonSection}>
              <AppButton
                backgroundColor={palette.primaryGreen}
                onPress={() => router.push('/(app)/Statistics')}
              >
                Estatísticas do perfil
              </AppButton>
            </View>
          </>
        )}

        <View style={styles.buttonSection}>
          <AppButton
            backgroundColor={palette.red}
            onPress={async () => {
              await signOut();
              router.replace('/(public)/login');
            }}
          >
            Sair
          </AppButton>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(200,200,200,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  name: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: primaryFontA,
  },
  role: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  studentHeaderStats: {
    marginTop: 12,
    gap: 8,
  },
  xpBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 12,
  },
  headerMeta: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  rankText: {
    color: palette.primaryGreen,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  secondaryHeaderText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  calendarCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: palette.darkBlue,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  weekLabelCell: {
    width: 36,
    alignItems: 'center',
  },
  weekLabel: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dayCell: {
    width: 36,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellText: {
    color: palette.white,
    fontSize: 10,
  },
  calendarFooter: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'right',
  },
  trophiesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  trophyWrap: {
    alignItems: 'center',
  },
  buttonSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
});
