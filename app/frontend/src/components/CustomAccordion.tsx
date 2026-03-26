import React from 'react';
import { Accordion, Paragraph, Square, Input, Label, YStack, XStack, Button } from 'tamagui';
import { ChevronDown } from '@tamagui/lucide-icons';
import { palette, primaryFontC } from '../constants/style';

export type Chapter = { id: number; name: string; number: number };

type Props = {
  num: string;
  setNum: (txt: string) => void;
  chapters: Chapter[];
  chapterId: number | null;
  setChapterId: (id: number | null) => void;
  difficulty: number | null;
  setDifficulty: (d: number | null) => void;
};

const DIFFICULTIES = [
  { label: 'Fácil', value: 1 },
  { label: 'Médio', value: 2 },
  { label: 'Difícil', value: 3 },
];

const textColor = '#ffffff';

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      size="$2"
      borderRadius="$6"
      backgroundColor={active ? palette.primaryBlue : palette.darkBlue}
      borderColor={active ? palette.lightBlue : 'transparent'}
      borderWidth={1}
      pressStyle={{ opacity: 0.7 }}
      onPress={onPress}
    >
      <Paragraph fontSize="$2" color={textColor} fontFamily={primaryFontC}>
        {label}
      </Paragraph>
    </Button>
  );
}

export function PersonalizarAccordion({
  num,
  setNum,
  chapters,
  chapterId,
  setChapterId,
  difficulty,
  setDifficulty,
}: Props) {
  return (
    <Accordion
      overflow="hidden"
      width="80%"
      type="single"
      collapsible
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$10"
      backgroundColor={palette.lightBlue}
    >
      <Accordion.Item value="personalizar">
        <Accordion.Trigger
          flexDirection="row"
          justifyContent="space-between"
          padding="$4"
          backgroundColor={palette.primaryBlue}
        >
          {({ open }: { open: boolean }) => (
            <>
              <Paragraph
                fontFamily={primaryFontC}
                fontWeight="bold"
                fontSize="$4"
                color={textColor}
              >
                Personalizar
              </Paragraph>
              <Square animation="quick" rotate={open ? '180deg' : '0deg'}>
                <ChevronDown size="$1" color={textColor} />
              </Square>
            </>
          )}
        </Accordion.Trigger>

        <Accordion.Content animation="medium" backgroundColor={palette.lightBlue}>
          <YStack padding="$4" gap="$4">
            {/* Número de questões */}
            <YStack gap="$2">
              <Label htmlFor="input-questoes" fontSize="$3" color={textColor}>
                Número de questões
              </Label>
              <Input
                id="input-questoes"
                size="$4"
                borderWidth={1}
                keyboardType="numeric"
                placeholder="Ex: 10"
                value={num}
                onChangeText={setNum}
                backgroundColor={palette.lightBlue}
                color={textColor}
                placeholderTextColor={palette.offWhite}
              />
            </YStack>

            {/* Capítulo */}
            {chapters.length > 0 && (
              <YStack gap="$2">
                <Label fontSize="$3" color={textColor}>
                  Capítulo
                </Label>
                <XStack flexWrap="wrap" gap="$2">
                  <FilterButton
                    label="Todos"
                    active={chapterId === null}
                    onPress={() => setChapterId(null)}
                  />
                  {chapters.map((ch) => (
                    <FilterButton
                      key={ch.id}
                      label={`Cap. ${ch.number}`}
                      active={chapterId === ch.id}
                      onPress={() => setChapterId(chapterId === ch.id ? null : ch.id)}
                    />
                  ))}
                </XStack>
                {chapterId !== null && (
                  <Paragraph fontSize="$2" color={palette.offWhite}>
                    {chapters.find((c) => c.id === chapterId)?.name}
                  </Paragraph>
                )}
              </YStack>
            )}

            {/* Dificuldade */}
            <YStack gap="$2">
              <Label fontSize="$3" color={textColor}>
                Dificuldade
              </Label>
              <XStack gap="$2">
                <FilterButton
                  label="Todas"
                  active={difficulty === null}
                  onPress={() => setDifficulty(null)}
                />
                {DIFFICULTIES.map((d) => (
                  <FilterButton
                    key={d.value}
                    label={d.label}
                    active={difficulty === d.value}
                    onPress={() => setDifficulty(difficulty === d.value ? null : d.value)}
                  />
                ))}
              </XStack>
            </YStack>
          </YStack>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
