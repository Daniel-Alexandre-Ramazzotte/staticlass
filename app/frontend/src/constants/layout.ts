import { useWindowDimensions, Platform } from 'react-native';

/** Ponto de quebra: acima disso é considerado "wide" (desktop/tablet) */
export const BREAKPOINT_WIDE = 768;

/**
 * Hook de layout responsivo.
 * Retorna escalas de fonte, espaçamento e tamanho de botão adaptados
 * ao tamanho da janela. Use para deixar a versão web mais confortável.
 *
 * Exemplo:
 *   const { isWide, fs, pad, btnH } = useLayout();
 *   <Text style={{ fontSize: fs(16) }}>...</Text>
 */
export function useLayout() {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= BREAKPOINT_WIDE;

  /**
   * Escala um tamanho de fonte.
   * Em modo wide, aplica 1.25× (até o máximo de 28px para textos normais).
   */
  const fs = (base: number, max?: number): number => {
    const escalado = isWide ? base * 1.25 : base;
    return max ? Math.min(escalado, max) : escalado;
  };

  /**
   * Escala um valor de padding/margin.
   * Em modo wide, aplica 1.5× para dar mais respiro.
   */
  const pad = (base: number): number => (isWide ? base * 1.5 : base);

  /** Altura padrão de botão — maior em wide para facilitar clique. */
  const btnH = isWide ? 56 : 44;

  /** Largura máxima do conteúdo em wide — centraliza numa coluna legível. */
  const maxW = isWide ? 640 : undefined;

  /** Raio de borda levemente maior em wide. */
  const radius = (base: number): number => (isWide ? base * 1.2 : base);

  return { isWide, fs, pad, btnH, maxW, radius, width };
}
