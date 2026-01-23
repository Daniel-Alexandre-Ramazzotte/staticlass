// app/_layout.tsx

import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router'; // <--- Adicione useRouter e useSegments
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native'; // Para o loading
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';
import { AuthProvider, useAuth } from './context/AuthContext'; // Ajuste o caminho se necessário

function InitialLayout() {
  const { session, role, isLoading } = useAuth(); //  Pegamos os dados do contexto
  const segments = useSegments(); // Para saber em qual tela estamos
  const router = useRouter(); // Para navegar

  const [fontsLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // LÓGICA DO PORTEIRO
  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(public)';

    if (!session) {
      // Se não tem sessão, manda pro login
      if (!inAuthGroup) {
        router.replace('/(public)/login');
      }
    } else {
      if (inAuthGroup) {
        router.replace('/(tabs)/home');
      }
    }
  }, [session, isLoading, fontsLoaded, segments]);

  // Enquanto carrega fontes ou verifica autenticação, mostra spinner
  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig}>
        <PaperProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#6200ee' },
              headerTintColor: '#ffffff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Stack.Screen
              name="(public)/login"
              options={{ headerShown: false }}
            />

            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen
              name="quizInProgress"
              options={{ headerShown: false }}
            />
          </Stack>
        </PaperProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
