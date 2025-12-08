import { StyleSheet } from 'react-native';
import palette from '../../constants/style';

const getStyles = (screenDimensions) => {
  const styles = StyleSheet.create({
    button: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 10,
      borderRadius: 20,
      margin: 5,
    },
    buttonText: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: 14,
    },
  });
  return styles;
};

export default getStyles;
