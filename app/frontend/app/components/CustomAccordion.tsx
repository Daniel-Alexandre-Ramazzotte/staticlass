import React, { useState } from 'react';
import {
  Accordion,
  Paragraph,
  Square,
  Input,
  Label,
  YStack,
  XStack,
} from 'tamagui';
import { ChevronDown } from '@tamagui/lucide-icons'; // Certifique-se que está instalado

type Props = {
  num: string; // O número atual
  setNum: (txt: string) => void; // A função para atualizar
};
export function PersonalizarAccordion({ num, setNum }: Props) {
  // Estado para guardar o número digitado

  return (
    <Accordion
      overflow="hidden"
      width="70%"
      type="single"
      collapsible
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$4"
      backgroundColor="$background"
    >
      <Accordion.Item value="personalizar">
        {/* --- CABEÇALHO: "Personalizar" --- */}
        <Accordion.Trigger
          flexDirection="row"
          justifyContent="space-between"
          padding="$4"
        >
          {({ open }: { open: boolean }) => (
            <>
              <Paragraph fontWeight="bold" fontSize="$4">
                Personalizar
              </Paragraph>
              {/* Ícone animado */}
              <Square animation="quick" rotate={open ? '180deg' : '0deg'}>
                <ChevronDown size="$1" />
              </Square>
            </>
          )}
        </Accordion.Trigger>

        {/* --- CONTEÚDO: Input de Número --- */}
        <Accordion.Content animation="medium" backgroundColor="$gray2">
          <YStack padding="$4" space="$2">
            {/* Rótulo do Input */}
            <Label htmlFor="input-questoes" fontSize="$3" color="$gray11">
              Número de questões
            </Label>

            {/* Campo de Texto Numérico */}
            <Input
              id="input-questoes"
              size="$4"
              borderWidth={1}
              keyboardType="numeric" // Abre apenas o teclado numérico
              placeholder="Ex: 10"
              value={num}
              onChangeText={setNum} // Atualiza o estado ao digitar
              backgroundColor="$background"
            />
          </YStack>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
