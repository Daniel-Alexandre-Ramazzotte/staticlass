import React from 'react';
import { View, Text, Pressable } from 'react-native';
import styles from '../constants/style';
import { useRouter } from 'expo-router';
const AdminScreen = () => {
  const router = useRouter();
  return (
    <View>
      <Text style={styles.title}>Tela de Administração - Em breve</Text>
      <Pressable onPress={() => router.push('/(tabs)/home')}></Pressable>
    </View>
  );
};

export default AdminScreen;
