import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Paletas ────────────────────────────────────────────────────────────────

const CORES_MARCA = {
  primaryBlue:  '#0074c3',
  primaryGreen: '#55bf44',
  darkBlue:     '#093d60',
  lightBlue:    '#0089b7',
  red:          '#f65151',
  white:        '#ffffff',
};

export const paletaClara = {
  ...CORES_MARCA,
  fundo:            '#fcfcfc',
  fundoCartao:      '#ffffff',
  fundoSutil:       '#f0f4f8',
  texto:            '#171717',
  textoSecundario:  '#555555',
  borda:            '#e0e0e0',
  offWhite:         '#fcfcfc',
  offBlack:         '#171717',
};

export const paletaEscura = {
  ...CORES_MARCA,
  fundo:            '#0f0f0f',
  fundoCartao:      '#1c1c1e',
  fundoSutil:       '#2c2c2e',
  texto:            '#f5f5f5',
  textoSecundario:  '#9e9e9e',
  borda:            '#3a3a3c',
  offWhite:         '#0f0f0f',   // mapeia offWhite → fundo escuro para compatibilidade
  offBlack:         '#f5f5f5',   // mapeia offBlack → texto claro
};

export type Paleta = typeof paletaClara;

// ─── Contexto ────────────────────────────────────────────────────────────────

type TipoTema = 'claro' | 'escuro' | 'sistema';

type ContextoTema = {
  tema:         TipoTema;
  temaEfetivo: 'claro' | 'escuro';   // sistema resolvido para claro ou escuro
  paleta:       Paleta;
  alternarTema: () => void;
  definirTema:  (t: TipoTema) => void;
};

const ContextoTema = createContext<ContextoTema>({
  tema:         'sistema',
  temaEfetivo: 'claro',
  paleta:       paletaClara,
  alternarTema: () => {},
  definirTema:  () => {},
});

const CHAVE_STORAGE = '@staticlass_tema';

// ─── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sistemaTema = useColorScheme();   // 'light' | 'dark' | null
  const [tema, setTema] = useState<TipoTema>('sistema');

  // Carrega preferência salva ao iniciar
  useEffect(() => {
    AsyncStorage.getItem(CHAVE_STORAGE).then((salvo) => {
      if (salvo === 'claro' || salvo === 'escuro' || salvo === 'sistema') {
        setTema(salvo);
      }
    });
  }, []);

  const temaEfetivo: 'claro' | 'escuro' =
    tema === 'sistema'
      ? sistemaTema === 'dark' ? 'escuro' : 'claro'
      : tema;

  const paleta: Paleta = temaEfetivo === 'escuro' ? paletaEscura : paletaClara;

  const definirTema = (novoTema: TipoTema) => {
    setTema(novoTema);
    AsyncStorage.setItem(CHAVE_STORAGE, novoTema);
  };

  const alternarTema = () => {
    definirTema(temaEfetivo === 'claro' ? 'escuro' : 'claro');
  };

  return (
    <ContextoTema.Provider value={{ tema, temaEfetivo, paleta, alternarTema, definirTema }}>
      {children}
    </ContextoTema.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/** Retorna a paleta de cores do tema atual e utilitários de tema. */
export function useTema() {
  return useContext(ContextoTema);
}
