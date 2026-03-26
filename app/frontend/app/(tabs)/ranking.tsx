import React from 'react';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { palette, primaryFontA } from 'app/constants/style';

const MOCK_RANKING = [
  { pos: 1, name: 'João Silva', points: 980 },
  { pos: 2, name: 'Maria Souza', points: 870 },
  { pos: 3, name: 'Carlos Lima', points: 760 },
  { pos: 4, name: 'Ana Paula', points: 650 },
  { pos: 5, name: 'Pedro Costa', points: 580 },
  { pos: 6, name: 'Juliana Melo', points: 510 },
  { pos: 7, name: 'Rafael Nunes', points: 470 },
  { pos: 8, name: 'Fernanda Dias', points: 420 },
  { pos: 9, name: 'Lucas Ferreira', points: 390 },
  { pos: 10, name: 'Beatriz Alves', points: 350 },
];

function Avatar({ size = 48 }: { size?: number }) {
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor="rgba(255,255,255,0.3)"
      ai="center"
      jc="center"
    >
      <Text color={palette.white} fontSize={size / 3} fontWeight="bold">?</Text>
    </YStack>
  );
}

export default function RankingScreen() {
  const top3 = MOCK_RANKING.slice(0, 3);
  const rest = MOCK_RANKING.slice(3);

  return (
    <YStack f={1} backgroundColor={palette.primaryBlue}>
      {/* Title */}
      <YStack pt="$12" pb="$4" ai="center">
        <Text color={palette.white} fontSize={24} fontWeight="bold" fontFamily={primaryFontA}>
          Ranking
        </Text>
      </YStack>

      {/* Podium */}
      <XStack ai="flex-end" jc="center" px="$4" pb="$4" gap="$2">
        {/* 2nd */}
        <YStack ai="center" gap="$2" mb={0}>
          <Avatar size={52} />
          <Text color={palette.white} fontSize={13} fontWeight="bold">{top3[1].name.split(' ')[0]}</Text>
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
            <Text color="rgba(255,255,255,0.7)" fontSize={11}>{top3[1].points} pts</Text>
          </YStack>
        </YStack>

        {/* 1st */}
        <YStack ai="center" gap="$2" mb={0}>
          <Text fontSize={24}>🏆</Text>
          <Avatar size={60} />
          <Text color={palette.white} fontSize={13} fontWeight="bold">{top3[0].name.split(' ')[0]}</Text>
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
            <Text color="rgba(255,255,255,0.7)" fontSize={11}>{top3[0].points} pts</Text>
          </YStack>
        </YStack>

        {/* 3rd */}
        <YStack ai="center" gap="$2" mb={0}>
          <Avatar size={52} />
          <Text color={palette.white} fontSize={13} fontWeight="bold">{top3[2].name.split(' ')[0]}</Text>
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
            <Text color="rgba(255,255,255,0.7)" fontSize={11}>{top3[2].points} pts</Text>
          </YStack>
        </YStack>
      </XStack>

      {/* List */}
      <ScrollView style={{ flex: 1, backgroundColor: palette.primaryBlue }}>
        {rest.map((item) => (
          <XStack
            key={item.pos}
            px="$4"
            py="$3"
            ai="center"
            gap="$3"
            borderBottomWidth={1}
            borderBottomColor="rgba(255,255,255,0.1)"
          >
            <Text color={palette.white} fontSize={16} fontWeight="bold" width={30}>
              #{item.pos}
            </Text>
            <Avatar size={36} />
            <Text color={palette.white} fontSize={15} f={1}>{item.name}</Text>
            <Text color={palette.white} fontSize={14} fontWeight="bold">{item.points} pts</Text>
          </XStack>
        ))}
      </ScrollView>
    </YStack>
  );
}
