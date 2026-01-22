// app/_layout.tsx

import { Stack, SplashScreen, Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import React from 'react';
import { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper'; // Provider do Paper aqui
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider, Theme } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;
  return (
    // O Provider do Paper pode viver aqui para envolver todo o app
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig}>
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
          {/* Tela de login/registro */}
          <Stack.Screen
            name="(public)/login"
            options={{ headerShown: false }}
          />

          {/* Tela 1: O conjunto de abas. O nome "(tabs)" é uma convenção. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Tela 2: A tela do quiz em tela cheia. */}
          <Stack.Screen
            name="quizInProgress"
            options={{ headerShown: false }}
          />
        </Stack>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
