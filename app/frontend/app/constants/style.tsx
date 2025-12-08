import { StyleSheet } from 'react-native';

export const palette = {
  primary: '#1E63C3',
  accent: '#283cad9f',
  secondary: '#3700ffff',
  background: '#002272ff',
  offBlack: '#171717',
  offWhite: '#fcfcfc',
  grey: '#b0b0b0',
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
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: PRIMARY,
    textTransform: 'lowercase',
  },
  subtitle: { marginTop: 8, fontSize: 16, color: '#333', textAlign: 'center' },
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
  startText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  link: { marginTop: 12 },
  linkText: { color: PRIMARY, textDecorationLine: 'underline' },
  footerNote: {
    position: 'absolute',
    bottom: 18,
    alignItems: 'center',
    width: '100%',
  },
  footerText: { color: '#666' },

  barWrap: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRow: { marginBottom: 12, marginTop: 50, width: 200 },
  progressText: {
    color: '#ffffffff',
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#0011ffff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: { height: 8, backgroundColor: PRIMARY, borderRadius: 8 },

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
  gtitle: {
    fontWeight: 'bold',
    fontSize: 24,
    color: palette.offWhite,
  },
  gsubtitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#171717',
    marginBottom: 5,
  },
  endTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: BG,
  },
  scoreAnnouncement: {
    fontWeight: 'bold',
    fontSize: 30,
    color: '#fcfcfc',
  },
  awardImg: {
    width: 200,
    height: 250,
    resizeMode: 'contain',
  },
  bold: {
    fontWeight: 'bold',
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
  reviewAnswer: {
    marginVertical: 5,
  },
  question: {
    fontSize: 16,
    color: palette.offWhite,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  // Result Screen
  resultsWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
    padding: 100,
  },
  resultTitle: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  resultCard: {
    backgroundColor: BG,
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
    position: 'absolute',
    top: 80,
    width: 400,
  },
  resultScore: { fontSize: 42, fontWeight: '900', color: '#ffffff' },
  resultMessage: { marginTop: 10, fontSize: 16, color: '#ffffffff' },
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
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'red',
    marginBottom: 30,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    width: 200,
  },
  resultQuestion: { fontSize: 16, fontWeight: '600', color: '#ffffffff' },
  safeArea: { flex: 1, backgroundColor: BG },
  scrollContainer: {
    flexGrow: 1, // permite o conteúdo ocupar o espaço necessário
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});

export default styles;
