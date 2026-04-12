import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];
const WEEK_LABELS = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];

function MonthCalendar({ studentEmail }: { studentEmail: string }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [viewYear] = useState(currentYear); // locked to current year (D-13)
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-based
  const [practicedDays, setPracticedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/users/analytics/calendar?year=${viewYear}&month=${viewMonth}`)
      .then((res) => setPracticedDays(res.data?.practiced_days ?? []))
      .catch(() => setPracticedDays([]))
      .finally(() => setLoading(false));
  }, [viewYear, viewMonth, studentEmail]);

  // Build month grid
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const practicedSet = new Set(practicedDays);
  const todayDay = (today.getFullYear() === viewYear && today.getMonth() + 1 === viewMonth)
    ? today.getDate()
    : null;

  // Build flat array: nulls for leading blanks, then day numbers
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete final row
  while (cells.length % 7 !== 0) cells.push(null);

  // Group into rows of 7
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const canGoBack = viewMonth > 1; // locked to current year (D-13)
  const canGoForward = viewMonth < (today.getMonth() + 1); // cannot go past current month (D-12)

  return (
    <View style={calStyles.container}>
      {/* Month navigation header */}
      <View style={calStyles.navRow}>
        <TouchableOpacity
          onPress={() => canGoBack && setViewMonth((m) => m - 1)}
          disabled={!canGoBack}
          style={calStyles.navBtn}
        >
          <Text style={[calStyles.navArrow, !canGoBack && calStyles.navDisabled]}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={calStyles.monthTitle}>
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </Text>
        <TouchableOpacity
          onPress={() => canGoForward && setViewMonth((m) => m + 1)}
          disabled={!canGoForward}
          style={calStyles.navBtn}
        >
          <Text style={[calStyles.navArrow, !canGoForward && calStyles.navDisabled]}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week labels */}
      <View style={calStyles.weekLabels}>
        {WEEK_LABELS.map((d) => (
          <Text key={d} style={calStyles.weekLabel}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      {loading ? (
        <ActivityIndicator size="small" color={palette.primaryGreen} style={{ marginVertical: 16 }} />
      ) : (
        rows.map((row, ri) => (
          <View key={ri} style={calStyles.row}>
            {row.map((day, di) => {
              const isPracticed = day !== null && practicedSet.has(day);
              const isFuture = day !== null && todayDay !== null && day > todayDay;
              const isBlank = day === null;
              return (
                <View
                  key={di}
                  style={[
                    calStyles.cell,
                    isPracticed && calStyles.cellPracticed,
                    isBlank && calStyles.cellBlank,
                  ]}
                >
                  {!isBlank && (
                    <Text style={[
                      calStyles.dayText,
                      isPracticed && calStyles.dayTextPracticed,
                      isFuture && calStyles.dayTextFuture,
                    ]}>
                      {day}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))
      )}
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 16, backgroundColor: palette.darkBlue, borderRadius: 16, padding: 16, gap: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  navBtn: { paddingHorizontal: 12, paddingVertical: 4 },
  navArrow: { color: palette.white, fontSize: 24, fontWeight: '700' },
  navDisabled: { opacity: 0.3 },
  monthTitle: { color: palette.white, fontSize: 15, fontWeight: '700' },
  weekLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  weekLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', width: 36, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  cell: { width: 36, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  cellPracticed: { backgroundColor: palette.primaryGreen },
  cellBlank: { backgroundColor: 'transparent' },
  dayText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  dayTextPracticed: { color: palette.white, fontWeight: '700' },
  dayTextFuture: { opacity: 0.3 },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, role, email, name } = useAuth();
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [rankPosition, setRankPosition] = useState<number | null>(null);
  const [dadosCarregando, setDadosCarregando] = useState(true);

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
      ])
        .then(([resPerfil, resRanking]) => {
          setXp(resPerfil.data?.xp ?? 0);
          setStreak(resPerfil.data?.streak ?? 0);
          const ownEntry = resRanking.data?.own_entry;
          setRankPosition(ownEntry ? ownEntry.posicao : null);
        })
        .catch(() => {
          // Mantem os dados anteriores caso algum fetch falhe.
        })
        .finally(() => setDadosCarregando(false));
    }, [email, role])
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
        {role === 'aluno' && <MonthCalendar studentEmail={email ?? ''} />}

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
