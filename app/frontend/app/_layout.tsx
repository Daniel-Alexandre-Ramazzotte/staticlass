// app/_layout.tsx

import { Stack } from 'expo-router';
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper'; // Provider do Paper aqui
import { GestureHandlerRootView } from 'react-native-gesture-handler';
export default function RootLayout() {
  return (
    // O Provider do Paper pode viver aqui para envolver todo o app
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PaperProvider>
      <Stack
        screenOptions={{
          // Estilos globais para o header, se desejar
          headerStyle: {
            backgroundColor: '#6200ee',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Tela 1: O conjunto de abas. O nome "(tabs)" é uma convenção. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Tela 2: A tela do quiz em tela cheia. */}
        <Stack.Screen name="quizInProgress" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
    </GestureHandlerRootView>
  );
}