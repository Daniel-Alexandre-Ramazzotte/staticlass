/** Destination after login for each role */
export const ROLE_HOME = {
  admin: '/dashboard',
  professor: '/listas',
  aluno: '/minhas-listas',
};

/** Human-readable role labels (PT-BR) */
export const ROLE_LABEL = {
  admin: 'Admin',
  professor: 'Professor',
  aluno: 'Aluno',
};

/** List status → display label */
export const STATUS_LABEL = {
  draft: 'Rascunho',
  published: 'Publicada',
  closed: 'Fechada',
};

/** List status → CSS chip class */
export const STATUS_CHIP = {
  draft: 'chip--neutral',
  published: 'chip--easy',
  closed: 'chip--hard',
};

/** Difficulty → display label */
export const DIFFICULTY_LABEL = {
  1: 'Fácil',
  2: 'Médio',
  3: 'Difícil',
};

/** Difficulty → CSS chip class */
export const DIFFICULTY_CHIP = {
  1: 'chip--easy',
  2: 'chip--medium',
  3: 'chip--hard',
};

/** localStorage key for JWT (web) */
export const AUTH_TOKEN_KEY = 'auth_token';

/** AsyncStorage key for JWT (mobile) */
export const AUTH_SESSION_KEY = '@auth_session';

/** Staticlass brand palette — single source of truth */
export const PALETTE = {
  primaryGreen: '#55bf44',
  primaryBlue: '#0074c3',
  darkBlue: '#093d60',
  red: '#f65151',
};
