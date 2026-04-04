import React from 'react';
import { Accordion, Paragraph, Square, Input, Label, YStack, XStack, Button } from 'tamagui';
import { ChevronDown } from '@tamagui/lucide-icons';
import { palette, primaryFontC } from '../constants/style';
import { CAP_NOMES } from '../constants/names';

export type Chapter = { id: number; name: string; number: number };
export type Topic = { id: number; name: string; chapter_id: number };

type Props = {
  num: string;
  setNum: (txt: string) => void;
  chapters: Chapter[];
  chapterIds: number[];
  setChapterIds: (ids: number[]) => void;
  topics: Topic[];
  topicIds: number[];
  setTopicIds: (ids: number[]) => void;
  difficulties: number[];
  setDifficulties: (ds: number[]) => void;
  sources: string[];
  setSources: (ss: string[]) => void;
};

const DIFFICULTIES = [
  { label: 'Fácil', value: 1 },
  { label: 'Médio', value: 2 },
  { label: 'Difícil', value: 3 },
];

const FONTES = [
  { label: 'Apostila', value: 'apostila' },
  { label: 'Concurso', value: 'concurso' },
  { label: 'Vestibular', value: 'vestibular' },
  { label: 'ENEM', value: 'enem' },
];

const textColor = '#ffffff';

function toggleN(arr: number[], val: number): number[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}
function toggleS(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

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

function ClearButton({ onPress }: { onPress: () => void }) {
  return (
    <Button
      size="$2"
      borderRadius="$6"
      backgroundColor="transparent"
      borderColor={palette.red}
      borderWidth={1}
      pressStyle={{ opacity: 0.7 }}
      onPress={onPress}
    >
      <Paragraph fontSize="$2" color={palette.red} fontFamily={primaryFontC}>
        ✕ Limpar
      </Paragraph>
    </Button>
  );
}

export function PersonalizarAccordion({
  num,
  setNum,
  chapters,
  chapterIds,
  setChapterIds,
  topics,
  topicIds,
  setTopicIds,
  difficulties,
  setDifficulties,
  sources,
  setSources,
}: Props) {
  const topicsVisible = chapterIds.length > 0
    ? topics.filter((t) => chapterIds.includes(t.chapter_id))
    : topics;

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
                  Capítulo{chapterIds.length > 0 ? ` (${chapterIds.length})` : ''}
                </Label>
                <XStack flexWrap="wrap" gap="$2">
                  {chapters.map((ch) => (
                    <FilterButton
                      key={ch.id}
                      label={CAP_NOMES[ch.number] ?? `Cap. ${ch.number}`}
                      active={chapterIds.includes(ch.id)}
                      onPress={() => setChapterIds(toggleN(chapterIds, ch.id))}
                    />
                  ))}
                  {chapterIds.length > 0 && (
                    <ClearButton onPress={() => { setChapterIds([]); setTopicIds([]); }} />
                  )}
                </XStack>
              </YStack>
            )}

            {/* Tópico */}
            {topicsVisible.length > 0 && (
              <YStack gap="$2">
                <Label fontSize="$3" color={textColor}>
                  Tópico{topicIds.length > 0 ? ` (${topicIds.length})` : ''}
                </Label>
                <XStack flexWrap="wrap" gap="$2">
                  {topicsVisible.map((t) => (
                    <FilterButton
                      key={t.id}
                      label={t.name}
                      active={topicIds.includes(t.id)}
                      onPress={() => setTopicIds(toggleN(topicIds, t.id))}
                    />
                  ))}
                  {topicIds.length > 0 && (
                    <ClearButton onPress={() => setTopicIds([])} />
                  )}
                </XStack>
              </YStack>
            )}

            {/* Dificuldade */}
            <YStack gap="$2">
              <Label fontSize="$3" color={textColor}>
                Dificuldade{difficulties.length > 0 ? ` (${difficulties.length})` : ''}
              </Label>
              <XStack gap="$2" flexWrap="wrap">
                {DIFFICULTIES.map((d) => (
                  <FilterButton
                    key={d.value}
                    label={d.label}
                    active={difficulties.includes(d.value)}
                    onPress={() => setDifficulties(toggleN(difficulties, d.value))}
                  />
                ))}
                {difficulties.length > 0 && (
                  <ClearButton onPress={() => setDifficulties([])} />
                )}
              </XStack>
            </YStack>

            {/* Fonte */}
            <YStack gap="$2">
              <Label fontSize="$3" color={textColor}>
                Fonte{sources.length > 0 ? ` (${sources.length})` : ''}
              </Label>
              <XStack flexWrap="wrap" gap="$2">
                {FONTES.map((c) => (
                  <FilterButton
                    key={c.value}
                    label={c.label}
                    active={sources.includes(c.value)}
                    onPress={() => setSources(toggleS(sources, c.value))}
                  />
                ))}
                {sources.length > 0 && (
                  <ClearButton onPress={() => setSources([])} />
                )}
              </XStack>
            </YStack>
          </YStack>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
