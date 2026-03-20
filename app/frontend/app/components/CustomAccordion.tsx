import React from 'react';
import { Accordion, Paragraph, Square, Input, Label, YStack } from 'tamagui';
import { ChevronDown } from '@tamagui/lucide-icons';
import { palette } from '../constants/style';

type Props = {
  num: string;
  setNum: (txt: string) => void;
};

export function PersonalizarAccordion({ num, setNum }: Props) {
  const textColor = '#ffffff';

  return (
    <Accordion
      overflow="hidden"
      width="40%"
      type="single"
      collapsible
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$10"
      backgroundColor={palette.lightBlue}
    >
      <Accordion.Item value="personalizar">
        {/* --- CABEÇALHO: "Personalizar" --- */}
        <Accordion.Trigger
          flexDirection="row"
          justifyContent="space-between"
          padding="$4"
          backgroundColor={palette.primaryBlue}
        >
          {({ open }: { open: boolean }) => (
            <>
              <Paragraph fontWeight="bold" fontSize="$4" color={textColor}>
                Personalizar
              </Paragraph>

              <Square animation="quick" rotate={open ? '180deg' : '0deg'}>
                <ChevronDown size="$1" color={textColor} />
              </Square>
            </>
          )}
        </Accordion.Trigger>

        {/* --- CONTEÚDO: Input de Número --- */}
        <Accordion.Content
          animation="medium"
          backgroundColor={palette.lightBlue}
        >
          <YStack padding="$4" gap="$2">
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
              color={textColor} // Cor do texto que o usuário digita
              placeholderTextColor={palette.offWhite} // Cor do texto de exemplo "Ex: 10"
            />
          </YStack>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
