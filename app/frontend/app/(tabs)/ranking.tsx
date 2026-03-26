import React, { useState, useCallback } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { YStack, XStack, Text } from 'tamagui';
import { palette, primaryFontA } from 'app/constants/style';
import api from 'app/services/api';

// Tipo que representa um item do ranking retornado pelo backend
type ItemRanking = {
  posicao: number;
  id:      number;
  nome:    string;
  pontos:  number;
};

function Avatar({ tamanho = 48 }: { tamanho?: number }) {
  return (
    <YStack
      width={tamanho}
      height={tamanho}
      borderRadius={tamanho / 2}
      backgroundColor="rgba(255,255,255,0.3)"
      ai="center"
      jc="center"
    >
      <Text color={palette.white} fontSize={tamanho / 3} fontWeight="bold">?</Text>
    </YStack>
  );
}

export default function RankingScreen() {
  const [ranqueados, setRanqueados] = useState<ItemRanking[]>([]);
  const [carregando, setCarregando]  = useState(true);
  const [erro, setErro]              = useState<string | null>(null);

  // Busca o ranking sempre que a aba é aberta
  const buscarRanking = useCallback(() => {
    setCarregando(true);
    setErro(null);
    api.get('/users/ranking')
      .then((res) => setRanqueados(res.data))
      .catch(() => setErro('Não foi possível carregar o ranking.'))
      .finally(() => setCarregando(false));
  }, []);

  useFocusEffect(buscarRanking);

  const top3 = ranqueados.slice(0, 3);
  const resto = ranqueados.slice(3);

  if (carregando) {
    return (
      <YStack f={1} backgroundColor={palette.primaryBlue} jc="center" ai="center">
        <ActivityIndicator size="large" color={palette.white} />
      </YStack>
    );
  }

  if (erro) {
    return (
      <YStack f={1} backgroundColor={palette.primaryBlue} jc="center" ai="center" px="$6">
        <Text color={palette.white} fontSize={16} textAlign="center">{erro}</Text>
      </YStack>
    );
  }

  if (ranqueados.length === 0) {
    return (
      <YStack f={1} backgroundColor={palette.primaryBlue} jc="center" ai="center">
        <Text color={palette.white} fontSize={16}>Nenhum aluno no ranking ainda.</Text>
      </YStack>
    );
  }

  return (
    <YStack f={1} backgroundColor={palette.primaryBlue}>
      {/* Título */}
      <YStack pt="$12" pb="$4" ai="center">
        <Text color={palette.white} fontSize={24} fontWeight="bold" fontFamily={primaryFontA}>
          Ranking
        </Text>
      </YStack>

      {/* Pódio — mostra apenas se tiver pelo menos 3 jogadores */}
      {top3.length >= 3 && (
        <XStack ai="flex-end" jc="center" px="$4" pb="$4" gap="$2">
          {/* 2º lugar */}
          <YStack ai="center" gap="$2">
            <Avatar tamanho={52} />
            <Text color={palette.white} fontSize={13} fontWeight="bold">
              {top3[1].nome.split(' ')[0]}
            </Text>
            <YStack
              backgroundColor={palette.darkBlue}
              width={90}
              height={70}
              borderTopLeftRadius={8}
              borderTopRightRadius={8}
              ai="center"
              jc="center"
            >
              <Text color={palette.white} fontSize={26} fontWeight="900">2</Text>
              <Text color="rgba(255,255,255,0.7)" fontSize={11}>{top3[1].pontos} pts</Text>
            </YStack>
          </YStack>

          {/* 1º lugar */}
          <YStack ai="center" gap="$2">
            <Text fontSize={24}>🏆</Text>
            <Avatar tamanho={60} />
            <Text color={palette.white} fontSize={13} fontWeight="bold">
              {top3[0].nome.split(' ')[0]}
            </Text>
            <YStack
              backgroundColor={palette.primaryGreen}
              width={90}
              height={100}
              borderTopLeftRadius={8}
              borderTopRightRadius={8}
              ai="center"
              jc="center"
            >
              <Text color={palette.white} fontSize={30} fontWeight="900">1</Text>
              <Text color="rgba(255,255,255,0.7)" fontSize={11}>{top3[0].pontos} pts</Text>
            </YStack>
          </YStack>

          {/* 3º lugar */}
          <YStack ai="center" gap="$2">
            <Avatar tamanho={52} />
            <Text color={palette.white} fontSize={13} fontWeight="bold">
              {top3[2].nome.split(' ')[0]}
            </Text>
            <YStack
              backgroundColor={palette.darkBlue}
              width={90}
              height={50}
              borderTopLeftRadius={8}
              borderTopRightRadius={8}
              ai="center"
              jc="center"
            >
              <Text color={palette.white} fontSize={22} fontWeight="900">3</Text>
              <Text color="rgba(255,255,255,0.7)" fontSize={11}>{top3[2].pontos} pts</Text>
            </YStack>
          </YStack>
        </XStack>
      )}

      {/* Lista do 4º em diante */}
      <ScrollView style={{ flex: 1, backgroundColor: palette.primaryBlue }}>
        {resto.map((item) => (
          <XStack
            key={item.posicao}
            px="$4"
            py="$3"
            ai="center"
            gap="$3"
            borderBottomWidth={1}
            borderBottomColor="rgba(255,255,255,0.1)"
          >
            <Text color={palette.white} fontSize={16} fontWeight="bold" width={30}>
              #{item.posicao}
            </Text>
            <Avatar tamanho={36} />
            <Text color={palette.white} fontSize={15} f={1}>{item.nome}</Text>
            <Text color={palette.white} fontSize={14} fontWeight="bold">{item.pontos} pts</Text>
          </XStack>
        ))}
      </ScrollView>
    </YStack>
  );
}
