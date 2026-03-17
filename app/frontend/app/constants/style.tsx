import { Background } from '@react-navigation/elements';
import { PlaneLanding } from '@tamagui/lucide-icons';
import { StyleSheet } from 'react-native';

// #0066b7
export const palette = {
  primary: '#1E63C3',
  primaryBlue: '#0074c3',
  primaryGreen: '#55bf44',
  lightBlue: '#0089b7',
  accent: '#283cad9f',
  secondary: '#3700ffff',
  background: '#002272ff',
  backgroundLight: '#0074c3',
  offBlack: '#171717',
  offWhite: '#fcfcfc',
  white: '#ffffff',
  grey: '#b0b0b0',
  red: '#f65151',
  darkBlue: '#093d60',
};

export const PRIMARY = '#1E63C3';
export const CARD = '#002272ff';
export const BG = '#002272ff';
export const BUTTONS = ['#1E63C3', '#3700ffff', '#0026ffb0', '#3700ffff'];
export const SELECTED = '#00429eff';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PRIMARY },
  container: { flex: 1, backgroundColor: BG, paddingTop: 6 },
  screen: { flex: 1, padding: 20 },

  // Home Screen
  homeWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 28,
    marginBottom: 18,
    resizeMode: 'contain',
  },
  subtitle: { marginTop: 8, fontSize: 16, color: '#333', textAlign: 'center' },
  input: {
    height: 50,
    width: 300,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  startButton: {
    marginTop: 26,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: 'red',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  loginButton: {
    width: 200,
    marginTop: 26,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#ffffff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  startText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  footerNote: {
    position: 'absolute',
    bottom: 18,
    alignItems: 'center',
    width: '100%',
  },
  mainContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  gameContainer: {
    width: '90%',
    minHeight: '75%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    backgroundColor: palette.accent,
    borderRadius: 20,
  },

  resultContainer: {
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  listContainer: {
    flex: 1,
    marginTop: 10,
    backgroundColor: BG,
    width: '100%',
    padding: 20,
    marginBottom: -40,
  },

  issueText: {
    fontSize: 16,
    color: palette.offBlack,
    lineHeight: 24,
  },

  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  restartButton: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: palette.secondary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
  },
  restartText: { color: '#ffffff', fontWeight: 'bold' },

  errorLoginText: {
    fontSize: 14,
    textAlign: 'center',
    color: 'red',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
  },
  resultQuestion: { fontSize: 16, fontWeight: '600', color: '#ffffffff' },
  safeArea: { flex: 1, backgroundColor: BG },

  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 5,
  },

  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 2,
  },

  statLabel: {
    fontSize: 12,
    color: '#5a5a5a',
    fontWeight: '500',
  },
});

// Estilos específicos para componentes Tamagui
export const tamaguiStyles = {
  statsButton: {
    backgroundColor: '#007AFF', // Azul vibrante
    borderRadius: 12,
    size: '$5',
    pressStyle: { scale: 0.97, opacity: 0.9 },
  },
  rankingButton: {
    backgroundColor: '#D1E3F8', // Azul claro/bebê
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    color: '#007AFF',
    size: '$5',
    pressStyle: { scale: 0.97, opacity: 0.8 },
  },
  buttonOutline: {
    backgroundColor: '#171717',
    borderRadius: 12,
    size: '$5',
    pressStyle: { scale: 0.97, opacity: 0.9 },
  },
  buttonTextLight: {
    color: '#007AFF',
    fontWeight: '600',
  },
  buttonTextDark: {
    color: '#ffffff',
    fontWeight: '600',
  },
  logoLogin: {
    width: 200,
    height: 200,
    borderRadius: 28,
    marginBottom: 18,
    resizeMode: 'contain',
  },
};

export default styles;
