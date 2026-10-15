import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, TouchableOpacity } from 'react-native';
import { Button, Input, ScrollView, Text, XStack, YStack, ZStack } from 'tamagui';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react-native';
import { MathText } from 'app/components/MathText';
import { AppButton } from 'app/components/AppButton';
import { useAuth } from 'app/context/AuthContext';
import { palette } from 'app/constants/style';
import { API_BASE_URL } from 'app/constants/apiBase';
import api from 'app/services/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type QuestionType = 'multiple_choice' | 'true_false' | 'open_answer';
type AltItem = { letra: string; texto: string; isCorrect: boolean };

type Capitulo = { id: number; name: string; number: number };
type Topico = { id: number; name: string; chapter_id: number };

type QuestionDetail = {
  id: number;
  issue: string;
  question_type?: string;
  correct_answer: string | null;
  solution: string | null;
  difficulty: number | null;
  section: string | null;
  chapter_id?: number | null;
  topic_id?: number | null;
  source?: string | null;
  image_q?: string | null;
  image_q_position?: 'antes' | 'depois' | 'meio' | null;
  alternatives: { letter: string; text: string; is_correct: boolean }[];
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

const FONTES = [
  { label: 'Vestibular', value: 'vestibular' },
  { label: 'ENEM', value: 'ENEM' },
  { label: 'Concurso', value: 'concurso' },
  { label: 'Olimpíada', value: 'olimpíada' },
  { label: 'Lista', value: 'lista' },
  { label: 'Apostila', value: 'apostila' },
  { label: 'Outro', value: 'outro' },
];

const TIPOS: { label: string; value: QuestionType }[] = [
  { label: 'Múltipla Escolha', value: 'multiple_choice' },
  { label: 'Verdadeiro/Falso', value: 'true_false' },
  { label: 'Resposta Aberta', value: 'open_answer' },
];

const ALT_PADRAO: AltItem[] = LETRAS.map((l) => ({ letra: l, texto: '', isCorrect: false }));

const QUESTION_MANAGER_ROUTE = '/(admin)/QuestaoViewer';
const PROFESSOR_MANAGER_ROUTE = '/(app)/QuestionPicker';

function normalizarReturnTo(returnTo?: string, role?: string) {
  if (returnTo) return returnTo;
  return role === 'professor' ? PROFESSOR_MANAGER_ROUTE : QUESTION_MANAGER_ROUTE;
}

// ─── Tela principal ────────────────────────────────────────────────────────────

export default function AddNewQuestion() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const { userId, role } = useAuth();

  const questionId = params.id ? Number(params.id) : null;
  const isEditing = useMemo(() => questionId !== null && !Number.isNaN(questionId), [questionId]);
  const returnTo = useMemo(
    () => normalizarReturnTo(typeof params.returnTo === 'string' ? params.returnTo : undefined, role),
    [params.returnTo, role],
  );

  // ─ estado ─
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [enunciado, setEnunciado] = useState('');
  const [solucao, setSolucao] = useState('');
  const [imageQ, setImageQ] = useState<string | null>(null);
  const [imageQPosition, setImageQPosition] = useState<'antes' | 'depois' | 'meio'>('depois');
  const [alternativas, setAlternativas] = useState<AltItem[]>(ALT_PADRAO);
  const [respostaCorreta, setRespostaCorreta] = useState('');
  const [dificuldade, setDificuldade] = useState('');
  const [fonte, setFonte] = useState('');

  // assunto
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [customAssunto, setCustomAssunto] = useState('');
  const [chapters, setChapters] = useState<Capitulo[]>([]);
  const [allTopics, setAllTopics] = useState<Topico[]>([]);
  const [savedSections, setSavedSections] = useState<string[]>([]);

  // preview & loading
  const [latexPreviewEnunciado, setLatexPreviewEnunciado] = useState(false);
  const [latexPreviewSolucao, setLatexPreviewSolucao] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const visibleTopics = useMemo(
    () => (chapterId ? allTopics.filter((t) => t.chapter_id === chapterId) : []),
    [allTopics, chapterId],
  );

  // ─ carga inicial de metadados ─
  useEffect(() => {
    api.get<Capitulo[]>('/questions/chapters')
      .then((r) => setChapters(r.data))
      .catch((e) => console.error('chapters error:', e?.response?.status, e?.response?.data));

    api.get<Topico[]>('/questions/topics')
      .then((r) => setAllTopics(r.data))
      .catch((e) => console.error('topics error:', e?.response?.status, e?.response?.data));

    api.get<string[]>('/questions/sections')
      .then((r) => setSavedSections(Array.isArray(r.data) ? r.data : []))
      .catch((e) => console.error('sections error:', e?.response?.status, e?.response?.data));
  }, []);

  // ─ carga da questão em modo edição ─
  useEffect(() => {
    if (!isEditing || questionId === null) return;
    setCarregando(true);
    api
      .get(`/questions/${questionId}`)
      .then(({ data }) => {
        const q = data as QuestionDetail;
        const qt = (q.question_type as QuestionType) || 'multiple_choice';
        setQuestionType(qt);
        setEnunciado(q.issue || '');
        setSolucao(q.solution || '');
        setImageQ(q.image_q ?? null);
        setImageQPosition(q.image_q_position ?? 'depois');
        setDificuldade(q.difficulty ? String(q.difficulty) : '');
        setFonte(q.source || '');
        setChapterId(q.chapter_id ?? null);
        setTopicId(q.topic_id ?? null);
        setCustomAssunto(q.section || '');

        if (qt === 'multiple_choice') {
          setRespostaCorreta(q.correct_answer || '');
          const alts = (q.alternatives || []).map((a) => ({
            letra: a.letter,
            texto: a.text,
            isCorrect: a.is_correct,
          }));
          setAlternativas(alts.length >= 2 ? alts : ALT_PADRAO);
        } else if (qt === 'true_false') {
          const alts = (q.alternatives || []).map((a) => ({
            letra: a.letter,
            texto: a.text,
            isCorrect: a.is_correct,
          }));
          setAlternativas(alts.length >= 1 ? alts : [{ letra: 'A', texto: '', isCorrect: false }]);
        } else {
          setAlternativas([]);
        }
      })
      .catch(() => {
        alert('Não foi possível carregar a questão.');
        router.back();
      })
      .finally(() => setCarregando(false));
  }, [isEditing, questionId, router]);

  // ─ mudança de tipo limpa alternativas ─
  const handleSetType = useCallback((tipo: QuestionType) => {
    setQuestionType(tipo);
    setRespostaCorreta('');
    if (tipo === 'multiple_choice') setAlternativas(ALT_PADRAO);
    else if (tipo === 'true_false') setAlternativas([{ letra: 'A', texto: '', isCorrect: false }]);
    else setAlternativas([]);
  }, []);

  // ─ helpers de alternativas ─
  const addAlternativa = useCallback(() => {
    setAlternativas((prev) => {
      if (questionType === 'multiple_choice' && prev.length >= 5) return prev;
      const proxLetra = LETRAS[prev.length] ?? String.fromCharCode(65 + prev.length);
      return [...prev, { letra: proxLetra, texto: '', isCorrect: false }];
    });
  }, [questionType]);

  const removeAlternativa = useCallback((idx: number) => {
    setAlternativas((prev) => {
      const min = questionType === 'multiple_choice' ? 2 : 1;
      if (prev.length <= min) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  }, [questionType]);

  const updateAlternativaTexto = useCallback((idx: number, texto: string) => {
    setAlternativas((prev) => prev.map((a, i) => (i === idx ? { ...a, texto } : a)));
  }, []);

  const toggleIsCorrect = useCallback((idx: number) => {
    setAlternativas((prev) => prev.map((a, i) => (i === idx ? { ...a, isCorrect: !a.isCorrect } : a)));
  }, []);

  // ─ upload de imagem ─
  const uploadImagem = useCallback(async (campo: 'enunciado' | 'solucao') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert('Permissão de galeria negada.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (resultado.canceled || !resultado.assets?.[0]) return;

    const asset = resultado.assets[0];
    const formData = new FormData();
    const filename = asset.uri.split('/').pop()?.split('?')[0] ?? 'image.jpg';
    const type = asset.mimeType ?? 'image/jpeg';

    if (Platform.OS === 'web') {
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      formData.append('image', new File([blob], filename, { type }));
    } else {
      formData.append('image', { uri: asset.uri, name: filename, type } as any);
    }

    try {
      // Não passar Content-Type manualmente — o axios injeta o boundary correto
      const res = await api.post('/questions/upload_image', formData);
      const tag = `[img:${res.data.filename}]`;
      if (campo === 'enunciado') setEnunciado((prev) => prev + tag);
      else setSolucao((prev) => prev + tag);
    } catch (err: any) {
      const detalhe = err?.response?.data?.error ?? err?.message ?? 'erro desconhecido';
      console.error('upload_image error:', err?.response?.status, err?.response?.data, err);
      alert(`Falha ao enviar imagem: ${detalhe}`);
    }
  }, []);

  // ─ salvar ─
  const salvar = useCallback(async () => {
    if (!userId) {
      alert('Usuário não autenticado.');
      return;
    }
    if (!enunciado.trim()) {
      alert('Preencha o enunciado.');
      return;
    }
    if (questionType === 'multiple_choice') {
      if (!respostaCorreta) {
        alert('Selecione a resposta correta.');
        return;
      }
      if (alternativas.some((a) => !a.texto.trim())) {
        alert('Preencha todas as alternativas.');
        return;
      }
    }
    if (questionType === 'true_false' && alternativas.some((a) => !a.texto.trim())) {
      alert('Preencha todas as afirmações.');
      return;
    }

    try {
      const altsPayload =
        questionType === 'open_answer'
          ? []
          : alternativas.map((a) => ({
              letter: a.letra,
              text: a.texto,
              is_correct: a.isCorrect,
            }));

      const payload: Record<string, unknown> = {
        id: questionId ?? undefined,
        issue: enunciado,
        question_type: questionType,
        correct_answer: questionType === 'multiple_choice' ? respostaCorreta : null,
        solution: solucao || undefined,
        section: !chapterId && customAssunto.trim() ? customAssunto.trim() : null,
        chapter_id: chapterId ?? undefined,
        topic_id: topicId ?? undefined,
        difficulty: dificuldade ? Number(dificuldade) : undefined,
        source: fonte || undefined,
        image_q_position: imageQ ? imageQPosition : undefined,
        alternatives: altsPayload,
      };

      const resposta = isEditing
        ? await api.put('/questions/update', payload)
        : await api.post('/questions/add', payload, { headers: { 'Content-Type': 'application/json' } });

      if (resposta.status === 200 || resposta.status === 201) {
        alert(isEditing ? 'Questão atualizada!' : 'Questão adicionada!');
        router.replace(returnTo);
      } else {
        alert('Erro ao salvar questão.');
      }
    } catch (error: any) {
      const apiError = error?.response?.data?.error;
      alert(apiError ? `Erro: ${apiError}` : 'Erro ao salvar questão.');
    }
  }, [
    userId, enunciado, questionType, respostaCorreta, alternativas,
    solucao, chapterId, topicId, customAssunto, dificuldade, fonte,
    questionId, isEditing, returnTo, router, imageQ, imageQPosition,
  ]);

  return (
    <ZStack f={1}>
      <YStack
        position="absolute" top={0} right={0} bottom={0} left={0}
        backgroundColor={palette.backgroundLight} opacity={0.2} pointerEvents="none"
      />
      <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <YStack>
          {/* header */}
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
            {carregando ? <Text color={palette.darkBlue}>Carregando questão...</Text> : null}

            {/* ── tipo de questão ── */}
            <YStack width="100%" gap={0}>
              <RotuloLabel>Tipo de Questão:</RotuloLabel>
              <XStack width="94%" alignSelf="flex-end" marginTop="$1" gap="$2" flexWrap="wrap">
                {TIPOS.map(({ label, value }) => (
                  <BotaoSeletor
                    key={value}
                    label={label}
                    ativo={questionType === value}
                    onPress={() => handleSetType(value)}
                    flex={undefined}
                  />
                ))}
              </XStack>
            </YStack>

            {/* ── enunciado ── */}
            <YStack width="100%" gap={0}>
              <XStack ai="center" jc="space-between" width="100%" mb="$1">
                <RotuloLabel>Enunciado:</RotuloLabel>
                <XStack gap="$2">
                  <TouchableOpacity onPress={() => uploadImagem('enunciado')} style={iconBtn}>
                    <ImageIcon size={14} color="#fff" />
                    <Text color="#fff" fontSize={11} ml={4}>Imagem</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLatexPreviewEnunciado((v) => !v)}
                    style={[iconBtn, { backgroundColor: palette.darkBlue }]}
                  >
                    <Text color="#fff" fontSize={11}>LaTeX {latexPreviewEnunciado ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                </XStack>
              </XStack>
              <Input
                width="94%" alignSelf="flex-end"
                value={enunciado} onChangeText={setEnunciado}
                backgroundColor={palette.backgroundLight} opacity={0.3} color={palette.offWhite}
                multiline numberOfLines={4}
              />
              {latexPreviewEnunciado && enunciado ? (
                <YStack
                  width="94%" alignSelf="flex-end" mt="$2"
                  backgroundColor={palette.offWhite} borderRadius={8} padding="$3"
                >
                  <MathText fontSize={14} color={palette.offBlack} apiBase={API_BASE_URL}>
                    {enunciado}
                  </MathText>
                </YStack>
              ) : null}

              {imageQ ? (
                <YStack
                  width="94%" alignSelf="flex-end" mt="$2" gap="$2"
                  backgroundColor={palette.offWhite} borderRadius={8} padding="$3"
                >
                  <Text color={palette.offBlack} fontSize={12} fontWeight="700">
                    Imagem anexada: {imageQ}
                  </Text>
                  <Text color="#666" fontSize={11}>
                    Posição em relação ao enunciado:
                  </Text>
                  <XStack gap="$2">
                    {(['antes', 'depois', 'meio'] as const).map((pos) => (
                      <BotaoSeletor
                        key={pos}
                        label={pos === 'antes' ? 'Antes' : pos === 'depois' ? 'Depois' : 'No meio do texto'}
                        ativo={imageQPosition === pos}
                        onPress={() => setImageQPosition(pos)}
                        flex={undefined}
                      />
                    ))}
                  </XStack>
                  {imageQPosition === 'meio' ? (
                    <Text color="#666" fontSize={11}>
                      Para &ldquo;no meio do texto&rdquo;, insira {'[img:'}{imageQ}{']'} manualmente no ponto
                      desejado do enunciado (o botão &ldquo;Imagem&rdquo; acima insere no fim; recorte e cole
                      onde quiser) — esta imagem anexada não será exibida como bloco separado.
                    </Text>
                  ) : null}
                </YStack>
              ) : null}
            </YStack>

            {/* ── assunto ── */}
            <YStack width="100%" gap={0}>
              <RotuloLabel>Assunto:</RotuloLabel>
              <YStack width="94%" alignSelf="flex-end" mt="$2" gap="$2">
                {/* chips dos capítulos */}
                {chapters.length > 0 ? (
                  <XStack gap="$2" flexWrap="wrap">
                    {chapters.map((cap) => (
                      <Pressable
                        key={cap.id}
                        onPress={() => {
                          if (chapterId === cap.id) {
                            setChapterId(null);
                            setTopicId(null);
                          } else {
                            setChapterId(cap.id);
                            setTopicId(null);
                            setCustomAssunto('');
                          }
                        }}
                        style={[chip, chapterId === cap.id ? chipAtivo : null]}
                      >
                        <Text
                          fontSize={12}
                          color={chapterId === cap.id ? '#fff' : palette.darkBlue}
                        >
                          {cap.name}
                        </Text>
                      </Pressable>
                    ))}
                  </XStack>
                ) : null}

                {/* chips de seções salvas */}
                {savedSections.length > 0 ? (
                  <XStack gap="$2" flexWrap="wrap">
                    {savedSections.map((sec) => (
                      <Pressable
                        key={sec}
                        onPress={() => {
                          setCustomAssunto(sec);
                          setChapterId(null);
                          setTopicId(null);
                        }}
                        style={[chip, !chapterId && customAssunto === sec ? chipAtivo : null]}
                      >
                        <Text
                          fontSize={12}
                          color={!chapterId && customAssunto === sec ? '#fff' : palette.darkBlue}
                        >
                          {sec}
                        </Text>
                      </Pressable>
                    ))}
                  </XStack>
                ) : null}

                {/* texto livre */}
                <Input
                  value={customAssunto}
                  onChangeText={(t) => {
                    setCustomAssunto(t);
                    if (t) { setChapterId(null); setTopicId(null); }
                  }}
                  placeholder="ou digite assunto personalizado..."
                  placeholderTextColor="#aaa"
                  backgroundColor={palette.backgroundLight} opacity={0.3} color={palette.offWhite}
                />
              </YStack>
            </YStack>

            {/* ── tópico ── */}
            {visibleTopics.length > 0 ? (
              <YStack width="100%" gap={0}>
                <RotuloLabel>Tópico:</RotuloLabel>
                <XStack width="94%" alignSelf="flex-end" mt="$2" gap="$2" flexWrap="wrap">
                  {visibleTopics.map((top) => (
                    <Pressable
                      key={top.id}
                      onPress={() => setTopicId(topicId === top.id ? null : top.id)}
                      style={[chip, topicId === top.id ? chipAtivo : null]}
                    >
                      <Text fontSize={12} color={topicId === top.id ? '#fff' : palette.darkBlue}>
                        {top.name}
                      </Text>
                    </Pressable>
                  ))}
                </XStack>
              </YStack>
            ) : null}

            {/* ── alternativas (múltipla escolha) ── */}
            {questionType === 'multiple_choice' ? (
              <YStack width="100%" gap="$2">
                <RotuloLabel>Alternativas:</RotuloLabel>
                {alternativas.map((alt, idx) => (
                  <XStack key={alt.letra} width="94%" alignSelf="flex-end" gap="$2" ai="center">
                    <Text color={palette.darkBlue} fontWeight="bold" fontSize={14} width={20}>
                      {alt.letra})
                    </Text>
                    <Input
                      f={1}
                      value={alt.texto}
                      onChangeText={(t) => updateAlternativaTexto(idx, t)}
                      backgroundColor={palette.backgroundLight} opacity={0.3} color={palette.offWhite}
                    />
                    {alternativas.length > 2 ? (
                      <TouchableOpacity onPress={() => removeAlternativa(idx)} style={btnMinus}>
                        <Text color="#fff" fontWeight="bold">−</Text>
                      </TouchableOpacity>
                    ) : null}
                  </XStack>
                ))}
                {alternativas.length < 5 ? (
                  <TouchableOpacity onPress={addAlternativa} style={[btnMinus, { backgroundColor: palette.primaryBlue, width: 'auto' as any, paddingHorizontal: 12 }]}>
                    <Text color="#fff" fontSize={13}>+ Alternativa</Text>
                  </TouchableOpacity>
                ) : null}
              </YStack>
            ) : null}

            {/* ── afirmações (verdadeiro/falso) ── */}
            {questionType === 'true_false' ? (
              <YStack width="100%" gap="$2">
                <RotuloLabel>Afirmações (V/F):</RotuloLabel>
                {alternativas.map((alt, idx) => (
                  <YStack key={alt.letra} width="94%" alignSelf="flex-end" gap="$1">
                    <XStack ai="center" gap="$2">
                      <Text color={palette.darkBlue} fontWeight="bold" fontSize={14} width={20}>
                        {alt.letra})
                      </Text>
                      <Input
                        f={1}
                        value={alt.texto}
                        onChangeText={(t) => updateAlternativaTexto(idx, t)}
                        placeholder="Afirmação..."
                        placeholderTextColor="#aaa"
                        backgroundColor={palette.backgroundLight} opacity={0.3} color={palette.offWhite}
                        multiline
                      />
                      {alternativas.length > 1 ? (
                        <TouchableOpacity onPress={() => removeAlternativa(idx)} style={btnMinus}>
                          <Text color="#fff" fontWeight="bold">−</Text>
                        </TouchableOpacity>
                      ) : null}
                    </XStack>
                    <XStack ml={28} gap="$2">
                      <TouchableOpacity
                        onPress={() => alt.isCorrect ? null : toggleIsCorrect(idx)}
                        style={[vfBtn, alt.isCorrect ? { backgroundColor: palette.primaryGreen } : { backgroundColor: '#e0e0e0' }]}
                      >
                        <Text color={alt.isCorrect ? '#fff' : '#555'} fontWeight="bold" fontSize={13}>V</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => !alt.isCorrect ? null : toggleIsCorrect(idx)}
                        style={[vfBtn, !alt.isCorrect ? { backgroundColor: palette.red } : { backgroundColor: '#e0e0e0' }]}
                      >
                        <Text color={!alt.isCorrect ? '#fff' : '#555'} fontWeight="bold" fontSize={13}>F</Text>
                      </TouchableOpacity>
                    </XStack>
                  </YStack>
                ))}
                <TouchableOpacity onPress={addAlternativa} style={[btnMinus, { backgroundColor: palette.primaryBlue, width: 'auto' as any, paddingHorizontal: 12 }]}>
                  <Text color="#fff" fontSize={13}>+ Afirmação</Text>
                </TouchableOpacity>
              </YStack>
            ) : null}

            {/* ── resposta correta (múltipla escolha) ── */}
            {questionType === 'multiple_choice' ? (
              <YStack width="100%" gap={0}>
                <RotuloLabel>Resposta correta:</RotuloLabel>
                <XStack width="94%" alignSelf="flex-end" marginTop="$1" gap="$2">
                  {alternativas.map((alt) => (
                    <BotaoSeletor
                      key={alt.letra}
                      label={alt.letra}
                      ativo={respostaCorreta === alt.letra}
                      onPress={() => setRespostaCorreta(alt.letra)}
                    />
                  ))}
                </XStack>
              </YStack>
            ) : null}

            {/* ── dificuldade ── */}
            <YStack width="100%" gap={0}>
              <RotuloLabel>Dificuldade:</RotuloLabel>
              <XStack width="94%" alignSelf="flex-end" marginTop="$1" gap="$2">
                {[{ value: '1', label: 'Fácil' }, { value: '2', label: 'Médio' }, { value: '3', label: 'Difícil' }].map(
                  ({ value, label }) => (
                    <BotaoSeletor
                      key={value}
                      label={label}
                      ativo={dificuldade === value}
                      onPress={() => setDificuldade(value)}
                    />
                  ),
                )}
              </XStack>
            </YStack>

            {/* ── fonte ── */}
            <YStack width="100%" gap={0}>
              <RotuloLabel>Fonte:</RotuloLabel>
              <XStack width="94%" alignSelf="flex-end" mt="$2" gap="$2" flexWrap="wrap">
                {FONTES.map(({ value, label }) => (
                  <Pressable
                    key={value}
                    onPress={() => setFonte(fonte === value ? '' : value)}
                    style={[chip, fonte === value ? chipAtivo : null]}
                  >
                    <Text fontSize={12} color={fonte === value ? '#fff' : palette.darkBlue}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </XStack>
            </YStack>

            {/* ── solução ── */}
            <YStack width="100%" gap={0}>
              <XStack ai="center" jc="space-between" width="100%" mb="$1">
                <RotuloLabel>Solução:</RotuloLabel>
                <XStack gap="$2">
                  <TouchableOpacity onPress={() => uploadImagem('solucao')} style={iconBtn}>
                    <ImageIcon size={14} color="#fff" />
                    <Text color="#fff" fontSize={11} ml={4}>Imagem</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLatexPreviewSolucao((v) => !v)}
                    style={[iconBtn, { backgroundColor: palette.darkBlue }]}
                  >
                    <Text color="#fff" fontSize={11}>LaTeX {latexPreviewSolucao ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                </XStack>
              </XStack>
              <Input
                width="94%" alignSelf="flex-end"
                value={solucao} onChangeText={setSolucao}
                backgroundColor={palette.backgroundLight} opacity={0.3} color={palette.offWhite}
                multiline numberOfLines={4}
              />
              {latexPreviewSolucao && solucao ? (
                <YStack
                  width="94%" alignSelf="flex-end" mt="$2"
                  backgroundColor={palette.offWhite} borderRadius={8} padding="$3"
                >
                  <MathText fontSize={14} color={palette.offBlack} apiBase={API_BASE_URL}>
                    {solucao}
                  </MathText>
                </YStack>
              ) : null}
            </YStack>

            <AppButton backgroundColor={palette.darkBlue} onPress={salvar}>
              {isEditing ? 'Salvar Alterações' : 'Adicionar Nova Questão'}
            </AppButton>
          </YStack>
        </YStack>
      </ScrollView>
    </ZStack>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

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

function BotaoSeletor({
  label, ativo, onPress, flex = 1,
}: {
  label: string; ativo: boolean; onPress: () => void; flex?: number | undefined;
}) {
  return (
    <Button
      flex={flex as any} size="$3"
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

const iconBtn: any = {
  flexDirection: 'row', alignItems: 'center',
  backgroundColor: palette.primaryBlue, borderRadius: 6,
  paddingHorizontal: 8, paddingVertical: 4,
};

const btnMinus: any = {
  width: 32, height: 32, borderRadius: 16,
  backgroundColor: palette.red, alignItems: 'center', justifyContent: 'center',
};

const vfBtn: any = {
  width: 36, height: 36, borderRadius: 8,
  alignItems: 'center', justifyContent: 'center',
};

const chip: any = {
  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
  borderWidth: 1, borderColor: palette.darkBlue, backgroundColor: '#f0f4f8',
};

const chipAtivo: any = {
  backgroundColor: palette.primaryBlue, borderColor: palette.primaryBlue,
};
