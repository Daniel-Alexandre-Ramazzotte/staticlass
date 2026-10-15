import { StyleSheet } from 'react-native';

export const primaryFontA = 'ChauPhilomeneOne';
export const primaryFontB = 'AoboshiOne';
export const primaryFontC = 'Carlito';

// Paleta ancorada em app/web/src/styles/tokens.css e src/context/ThemeContext.tsx
// para manter as mesmas cores de marca entre mobile e web.
export const palette = {
  primary: '#1E63C3', // brand-500 (tokens.css)
  primaryBlue: '#0074c3', // brand-400
  primaryGreen: '#55bf44', // success-500
  lightBlue: '#0089b7',
  darkBlue: '#093d60', // brand-800
  backgroundLight: '#0074c3',

  red: '#f65151', // danger-500
  warn: '#e2a13a', // warn-500

  offBlack: '#0f1b2b', // --text (light)
  offWhite: '#fcfcfc',
  white: '#ffffff',
  grey: '#8b96a6', // --text-subtle (light)
};

export const PRIMARY = palette.primary;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.offWhite,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 28,
    marginBottom: 18,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: PRIMARY,
    textAlign: 'center',
  },
  input: {
    height: 50,
    width: 300,
    maxWidth: '100%',
    borderColor: '#dde3ec',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    color: palette.offBlack,
    backgroundColor: '#f4f7fa',
  },
  startButton: {
    marginTop: 20,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  startText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: palette.red,
    backgroundColor: '#fde8e8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    fontWeight: '600',
    overflow: 'hidden',
  },
  errorLoginText: {
    fontSize: 14,
    textAlign: 'center',
    color: palette.red,
    marginBottom: 20,
    fontWeight: '600',
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
  image: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
    borderRadius: 12,
  },
});

export default styles;
