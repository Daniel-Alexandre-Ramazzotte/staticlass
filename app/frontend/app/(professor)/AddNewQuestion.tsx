import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { Input, YStack, XStack, ZStack, Text, ScrollView, Button } from 'tamagui';
import { palette } from 'app/constants/style';
import api from 'app/services/api';
import { AppButton } from 'app/components/AppButton';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { useAuth } from 'app/context/AuthContext';

const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const;
type Letra = typeof LETRAS[number];
const QUESTION_MANAGER_ROUTE = '/(admin)/QuestaoViewer';

const FONTES_ADD = [
  { label: 'Vestibular', value: 'vestibular' },
  { label: 'ENEM',       value: 'ENEM' },
  { label: 'Concurso',   value: 'concurso' },
  { label: 'Olimpíada',  value: 'olimpíada' },
  { label: 'Lista',      value: 'lista' },
  { label: 'Apostila',   value: 'apostila' },
  { label: 'Outro',      value: 'outro' },
];

type Alternative = { letter: string; text: string; is_correct: boolean };

type QuestionDetail = {
  id: number;
  issue: string;
  correct_answer: string;
  solution: string | null;
  difficulty: number | null;
  section: string | null;
  source?: string | null;
  alternatives: Alternative[];
};

const ALTERNATIVAS_VAZIAS: Record<Letra, string> = { A: '', B: '', C: '', D: '', E: '' };

function normalizarReturnTo(returnTo?: string) {
  if (!returnTo || returnTo.includes('QuestionsManager')) {
    return QUESTION_MANAGER_ROUTE;
  }

  return returnTo;
}

export default function AddNewQuestion() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const { userId } = useAuth();

  const questionId = params.id ? Number(params.id) : null;
  const isEditing = useMemo(() => questionId !== null && !Number.isNaN(questionId), [questionId]);
  const returnTo = useMemo(
    () => normalizarReturnTo(typeof params.returnTo === 'string' ? params.returnTo : undefined),
    [params.returnTo],
  );

  const [enunciado, setEnunciado] = useState('');
  const [alternativas, setAlternativas] = useState<Record<Letra, string>>(ALTERNATIVAS_VAZIAS);
  const [respostaCorreta, setRespostaCorreta] = useState<Letra | ''>('');
  const [secao, setSecao] = useState('');
  const [dificuldade, setDificuldade] = useState('');
  const [fonte, setFonte] = useState('');
  const [fonteOpen, setFonteOpen] = useState(false);
  const [solucao, setSolucao] = useState('');
  const [carregando, setCarregando] = useState(false);

  const setAlternativa = (letra: Letra, texto: string) =>
    setAlternativas((prev) => ({ ...prev, [letra]: texto }));

  useEffect(() => {
    if (!isEditing || questionId === null) return;

    setCarregando(true);
    api.get(`/questions/${questionId}`)
      .then(({ data }) => {
        const q = data as QuestionDetail;
        setEnunciado(q.issue || '');
        setRespostaCorreta((q.correct_answer || '') as Letra | '');
        setSecao(q.section || '');
        setDificuldade(q.difficulty ? String(q.difficulty) : '');
        setFonte(q.source || '');
        setSolucao(q.solution || '');

        const mapa: Record<string, string> = {};
        (q.alternatives || []).forEach((alt) => { mapa[alt.letter] = alt.text; });
        setAlternativas({
          A: mapa['A'] || '', B: mapa['B'] || '', C: mapa['C'] || '',
          D: mapa['D'] || '', E: mapa['E'] || '',
        });
      })
      .catch((err) => {
        console.error('Erro ao carregar questão:', err);
        alert('Não foi possível carregar a questão.');
        router.back();
      })
      .finally(() => setCarregando(false));
  }, [isEditing, questionId, router]);

  const salvar = async () => {
    if (!userId) {
      alert('Usuário não autenticado. Faça login novamente.');
      return;
    }
    if (!enunciado || !solucao || !respostaCorreta || LETRAS.some((l) => !alternativas[l])) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const payload = {
        id: questionId ?? undefined,
        issue: enunciado,
        correct_answer: respostaCorreta,
        solution: solucao,
        section: secao || undefined,
        difficulty: dificuldade ? Number(dificuldade) : undefined,
        source: fonte || undefined,
        alternatives: LETRAS.map((letra) => ({ letter: letra, text: alternativas[letra] })),
      };

      const resposta = isEditing
        ? await api.put('/questions/update', payload)
        : await api.post('/questions/add', payload, { headers: { 'Content-Type': 'application/json' } });

      if (resposta.status === 200 || resposta.status === 201) {
        alert(isEditing ? 'Questão atualizada com sucesso!' : 'Questão adicionada com sucesso!');
        router.replace(returnTo);
      } else {
        alert('Erro ao salvar questão. Tente novamente.');
      }
    } catch (error: any) {
      const apiError = error?.response?.data?.error;
      console.error('Erro ao salvar questão:', error?.response?.data ?? error);
      alert(apiError ? `Erro: ${apiError}` : 'Erro ao salvar questão. Tente novamente.');
    }
  };

  return (
    <ZStack f={1}>
      <YStack
        position="absolute" top={0} right={0} bottom={0} left={0}
        backgroundColor={palette.backgroundLight} opacity={0.2} pointerEvents="none"
      />
      <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <YStack>
          <XStack
            backgroundColor={palette.primaryBlue}
            pt="$8" pb="$4" px="$4"
            ai="center" jc="space-between" width="100%"
          >
            <Button
              size="$3" circular backgroundColor="transparent"
              pressStyle={{ opacity: 0.7 }} onPress={() => router.back()}
              icon={<ChevronLeft color={palette.white} size={28} />}
            />
            <Text f={1} color="#fff" fontSize="$8" fontWeight="bold" textAlign="center" mr="$6">
              {isEditing ? 'Editar Questão' : 'Nova Questão'}
            </Text>
          </XStack>

          <YStack ai="center" gap="$4" width="70%" alignSelf="center" py="$4">
            {carregando && <Text color={palette.darkBlue}>Carregando questão...</Text>}

            {[
              { label: 'Seção:', valor: secao, setValor: setSecao },
              { label: 'Enunciado:', valor: enunciado, setValor: setEnunciado },
            ].map(({ label, valor, setValor }) => (
              <CampoTexto key={label} label={label} valor={valor} setValor={setValor} />
            ))}

            {LETRAS.map((letra) => (
              <CampoTexto
                key={letra}
                label={`Alternativa ${letra}:`}
                valor={alternativas[letra]}
                setValor={(texto) => setAlternativa(letra, texto)}
              />
            ))}

            <YStack width="100%" gap={0}>
              <RotuloLabel>Dificuldade:</RotuloLabel>
              <XStack width="94%" alignSelf="flex-end" marginTop="$1" gap="$2">
                {[{ value: '1', label: 'Fácil' }, { value: '2', label: 'Médio' }, { value: '3', label: 'Difícil' }].map(({ value, label }) => (
                  <BotaoSeletor
                    key={value}
                    label={label}
                    ativo={dificuldade === value}
                    onPress={() => setDificuldade(value)}
                  />
                ))}
              </XStack>
            </YStack>

            <YStack width="100%" gap={0}>
              <RotuloLabel>Fonte:</RotuloLabel>
              <Pressable
                onPress={() => setFonteOpen(true)}
                style={{
                  width: '94%', alignSelf: 'flex-end', marginTop: 4,
                  backgroundColor: palette.lightBlue, borderRadius: 8,
                  paddingHorizontal: 12, paddingVertical: 12,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  minHeight: 44,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14 }}>
                  {fonte
                    ? FONTES_ADD.find((f) => f.value === fonte)?.label ?? fonte
                    : 'Selecionar fonte...'}
                </Text>
                <ChevronDown size={16} color="#fff" />
              </Pressable>
            </YStack>

            <Modal
              visible={fonteOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setFonteOpen(false)}
            >
              <Pressable
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
                onPress={() => setFonteOpen(false)}
              >
                <YStack
                  backgroundColor={palette.darkBlue}
                  borderRadius={12}
                  margin="$6"
                  padding="$4"
                  gap="$2"
                  onStartShouldSetResponder={() => true}
                >
                  {FONTES_ADD.map(({ value, label }) => (
                    <Pressable
                      key={value}
                      onPress={() => { setFonte(value); setFonteOpen(false); }}
                      style={{
                        paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8,
                        backgroundColor: fonte === value ? palette.primaryBlue : 'transparent',
                        minHeight: 44,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 14 }}>{label}</Text>
                    </Pressable>
                  ))}
                </YStack>
              </Pressable>
            </Modal>

            <YStack width="100%" gap={0}>
              <RotuloLabel>Resposta correta:</RotuloLabel>
              <XStack width="94%" alignSelf="flex-end" marginTop="$1" gap="$2">
                {LETRAS.map((letra) => (
                  <BotaoSeletor
                    key={letra}
                    label={letra}
                    ativo={respostaCorreta === letra}
                    onPress={() => setRespostaCorreta(letra)}
                  />
                ))}
              </XStack>
            </YStack>

            <CampoTexto label="Solução:" valor={solucao} setValor={setSolucao} />

            <AppButton backgroundColor={palette.darkBlue} onPress={salvar}>
              {isEditing ? 'Salvar Alterações' : 'Adicionar Nova Questão'}
            </AppButton>
          </YStack>
        </YStack>
      </ScrollView>
    </ZStack>
  );
}

function RotuloLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      backgroundColor={palette.darkBlue} color={palette.offWhite}
      padding="$1" width="40%" borderRadius={4}
      alignSelf="flex-start" marginLeft="$1" textAlign="left" fontWeight="bold"
    >
      {children}
    </Text>
  );
}

function CampoTexto({ label, valor, setValor }: { label: string; valor: string; setValor: (v: string) => void }) {
  return (
    <YStack width="100%" gap={0}>
      <RotuloLabel>{label}</RotuloLabel>
      <Input
        width="94%" alignSelf="flex-end" marginTop="$1"
        value={valor} onChangeText={setValor}
        backgroundColor={palette.backgroundLight} opacity={0.3} color={palette.offWhite}
      />
    </YStack>
  );
}

function BotaoSeletor({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <Button
      flex={1} size="$3"
      backgroundColor={ativo ? palette.primaryGreen : palette.backgroundLight}
      borderWidth={1} borderColor={ativo ? palette.primaryGreen : palette.darkBlue}
      pressStyle={{ opacity: 0.7 }} onPress={onPress}
    >
      <Text color={ativo ? palette.offWhite : palette.darkBlue} fontWeight="bold" fontSize="$4">
        {label}
      </Text>
    </Button>
  );
}
