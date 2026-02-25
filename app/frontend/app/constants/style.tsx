import { PlaneLanding } from '@tamagui/lucide-icons';
import { StyleSheet } from 'react-native';
import { black } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

export const palette = {
  primary: '#1E63C3',
  accent: '#283cad9f',
  secondary: '#3700ffff',
  background: '#002272ff',
  backgroundLight: '#0074c3',
  offBlack: '#171717',
  offWhite: '#fcfcfc',
  white: '#ffffff',
  grey: '#b0b0b0',
  red: '#f65151',
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
    //textTransform: 'lowercase',
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
  restartText: { color: '#ffffff', fontWeight: 'bold'},

  // Result Screen
  resultArea: {
    flex: 1,
    backgroundColor: '#0f6ea9',
  },
  containerResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  // Aba vermelha do topo
  clipboardClip: {
    position: 'absolute',
    top: -35,                
    width: 70,             
    height: 70,
    borderRadius: 35,        
    backgroundColor: '#f65151',
    alignItems: 'center',   
    zIndex: -1,             
  },

  clipboardHole: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginTop: 15,            
  },
  topBadge: {
    backgroundColor: '#f65151',
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 15,
    position: 'absolute',
    alignItems: 'center',
    overflow: 'visible',
    top: 80,
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
  },

  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  resultCard: {
    backgroundColor: '#f2f2f2',
    width: '90%',
    height: '70%',
    borderRadius: 30,
    paddingTop: 50,
    paddingHorizontal: 25,
    paddingBottom: 30,
    alignItems: 'center',
  },
  resultScore: {
    fontSize: 60,
    fontWeight: '900',
    color: '#000',
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  resultQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },

  resolutionText: {
    color: '#093d60',
    textDecorationLine: 'underline',
    fontWeight:'bold',
    fontSize: 14,
  },
  // Botão rodapé
  restartQuizButton: {
    backgroundColor: '#f65151',
    width: '100%',
    paddingVertical: 25,
    alignItems: 'center',
    alignContent: 'center',
    position: 'absolute',
    bottom: 0,
  },
  restartQuizText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
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
    alignItems: 'center',
    width: '80%',
    backgroundColor: '#FFFFFF', 
    borderRadius: 15,           
    paddingVertical: 10,      
    marginTop: -10,
    marginBottom: 30,             
    elevation: 4,           
  },

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
    size: "$5",
    pressStyle: { scale: 0.97, opacity: 0.9 },
  },
  rankingButton: {
    backgroundColor: '#D1E3F8', // Azul claro/bebê
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    color: '#007AFF',
    size: "$5",
    pressStyle: { scale: 0.97, opacity: 0.8 },
  },
  buttonOutline: {
    backgroundColor: '#171717', // Off-black como no seu print
    borderRadius: 12,
    size: "$5",
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
 
};

export default styles;

