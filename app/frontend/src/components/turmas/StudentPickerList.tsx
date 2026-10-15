import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Check } from '@tamagui/lucide-icons';
import { Text, YStack } from 'tamagui';

import { palette, primaryFontC } from 'app/constants/style';

export type Aluno = { id: number; name: string; email: string; ano_ingresso?: number | null };

type Props = {
  alunos: Aluno[];
  enrolledIds: Set<number>;
  onToggle: (alunoId: number) => void;
};

/** Lista de alunos com checkbox de matrícula e filtro por ano de ingresso
 * (client-side, sem mudança no backend). Compartilhado entre o editor de
 * turma do professor e do admin. */
export function StudentPickerList({ alunos, enrolledIds, onToggle }: Props) {
  const [anoFilter, setAnoFilter] = useState('');

  const filtered = useMemo(() => {
    const trimmed = anoFilter.trim();
    if (!trimmed) return alunos;
    const ano = Number(trimmed);
    return alunos.filter((a) => a.ano_ingresso === ano);
  }, [alunos, anoFilter]);

  return (
    <YStack gap="$2">
      <TextInput
        style={styles.filterInput}
        value={anoFilter}
        onChangeText={(t) => setAnoFilter(t.replace(/[^0-9]/g, ''))}
        placeholder="Filtrar por ano de ingresso"
        keyboardType="number-pad"
        maxLength={4}
      />

      <YStack gap="$1" mt="$1">
        {filtered.map((a) => {
          const enrolled = enrolledIds.has(a.id);
          return (
            <TouchableOpacity
              key={a.id}
              style={[styles.alunoRow, enrolled ? styles.alunoRowEnrolled : null]}
              onPress={() => onToggle(a.id)}
              activeOpacity={0.7}
            >
              <YStack f={1}>
                <Text
                  color={palette.darkBlue}
                  fontSize={14}
                  fontWeight={enrolled ? '700' : '400'}
                >
                  {a.name}
                </Text>
                <Text color="#6c7b8a" fontSize={12} fontFamily={primaryFontC}>
                  {a.email}
                  {a.ano_ingresso ? ` · ingresso ${a.ano_ingresso}` : ''}
                </Text>
              </YStack>
              {enrolled ? <Check color={palette.primaryGreen} size={20} /> : null}
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 ? (
          <Text color="#6c7b8a" fontSize={13} fontFamily={primaryFontC}>
            {alunos.length === 0
              ? 'Nenhum aluno cadastrado no sistema.'
              : 'Nenhum aluno com esse ano de ingresso.'}
          </Text>
        ) : null}
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  filterInput: {
    borderWidth: 1,
    borderColor: '#dbe4ee',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  alunoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  alunoRowEnrolled: { backgroundColor: 'rgba(85,191,68,0.12)' },
});
