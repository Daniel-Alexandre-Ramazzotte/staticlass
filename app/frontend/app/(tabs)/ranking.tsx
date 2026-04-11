import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XStack, YStack, Text } from 'tamagui';

import { AppButton } from 'app/components/AppButton';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';

type RankingEntry = {
  posicao: number;
  id: number;
  nome: string;
  xp: number;
};

function RankingRow({
  entry,
  highlighted = false,
}: {
  entry: RankingEntry;
  highlighted?: boolean;
}) {
  return (
    <XStack
      px="$4"
      py="$3"
      minHeight={52}
      ai="center"
      gap="$3"
      borderBottomWidth={1}
      borderBottomColor="rgba(255,255,255,0.08)"
      backgroundColor={highlighted ? 'rgba(255,215,0,0.15)' : 'transparent'}
      borderLeftWidth={highlighted ? 3 : 0}
      borderLeftColor={highlighted ? '#FFD700' : 'transparent'}
    >
      <Text color={palette.white} fontSize={15} fontWeight="bold" width={28}>
        #{entry.posicao}
      </Text>
      <Text color={palette.white} fontSize={15} f={1}>
        {entry.nome}
      </Text>
      <Text color={palette.primaryGreen} fontSize={15} fontWeight="bold">
        {entry.xp}
      </Text>
    </XStack>
  );
}

export default function RankingScreen() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [ownEntry, setOwnEntry] = useState<RankingEntry | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRanking = useCallback(
    async (targetPage = 1, append = false, pullToRefresh = false) => {
      if (append) {
        setLoadingMore(true);
      } else if (pullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await api.get(`/gamification/ranking?page=${targetPage}`);
        const incoming: RankingEntry[] = response.data?.ranking ?? [];
        setRanking((previous) => {
          if (!append) {
            return incoming;
          }

          const seen = new Set(previous.map((item) => item.id));
          const deduped = incoming.filter((item) => !seen.has(item.id));
          return [...previous, ...deduped];
        });
        setOwnEntry(response.data?.own_entry ?? null);
        setPage(response.data?.page ?? targetPage);
        setHasMore(Boolean(response.data?.has_more));
      } catch {
        setError('Nao foi possivel carregar o ranking. Tente novamente.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadRanking(1, false);
    }, [loadRanking])
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) {
      return;
    }
    loadRanking(page + 1, true);
  }, [hasMore, loadRanking, loadingMore, page]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.primaryBlue }}>
        <YStack f={1} jc="center" ai="center">
          <ActivityIndicator size="large" color={palette.primaryGreen} />
        </YStack>
      </SafeAreaView>
    );
  }

  if (error && ranking.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.primaryBlue }}>
        <YStack f={1} px="$6" jc="center" ai="center" gap="$4">
          <Text color={palette.red} fontSize={15} textAlign="center">
            {error}
          </Text>
          <AppButton backgroundColor={palette.primaryGreen} onPress={() => loadRanking(1, false)}>
            Tentar novamente
          </AppButton>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.primaryBlue }}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={ranking}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RankingRow entry={item} highlighted={item.id === ownEntry?.id} />
          )}
          contentContainerStyle={{ paddingBottom: ownEntry ? 112 : 40 }}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRanking(1, false, true)}
              tintColor={palette.primaryGreen}
            />
          )}
          ListHeaderComponent={(
            <YStack px="$5" pt="$6" pb="$4" gap="$2">
              <Text
                color={palette.white}
                fontSize={24}
                fontWeight="bold"
                fontFamily={primaryFontA}
                textAlign="center"
              >
                Ranking
              </Text>
              <Text color="rgba(255,255,255,0.8)" fontSize={13} textAlign="center">
                Top 100 alunos por XP
              </Text>
              <XStack px="$4" mt="$3" ai="center">
                <Text color="rgba(255,255,255,0.75)" fontSize={12} fontWeight="bold" width={28}>
                  #
                </Text>
                <Text color="rgba(255,255,255,0.75)" fontSize={12} fontWeight="bold" f={1}>
                  Aluno
                </Text>
                <Text color="rgba(255,255,255,0.75)" fontSize={12} fontWeight="bold">
                  XP
                </Text>
              </XStack>
            </YStack>
          )}
          ListEmptyComponent={(
            <YStack px="$6" py="$10" ai="center" gap="$2">
              <Text color={palette.white} fontSize={16} textAlign="center">
                Nenhum dado disponivel
              </Text>
              <Text color="rgba(255,255,255,0.75)" fontSize={13} textAlign="center">
                Complete um quiz para aparecer no ranking.
              </Text>
            </YStack>
          )}
          ListFooterComponent={(
            hasMore ? (
              <YStack px="$5" py="$5">
                {loadingMore ? (
                  <ActivityIndicator size="small" color={palette.primaryGreen} />
                ) : (
                  <AppButton backgroundColor={palette.primaryGreen} onPress={handleLoadMore}>
                    Carregar mais
                  </AppButton>
                )}
              </YStack>
            ) : null
          )}
        />

        {ownEntry ? (
          <YStack
            position="absolute"
            left={0}
            right={0}
            bottom={0}
            backgroundColor={palette.darkBlue}
            borderTopWidth={1}
            borderTopColor="rgba(255,255,255,0.12)"
            px="$4"
            py="$3"
          >
            <Text color="rgba(255,255,255,0.75)" fontSize={12} mb="$2">
              Sua posicao
            </Text>
            <RankingRow entry={ownEntry} highlighted />
          </YStack>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
