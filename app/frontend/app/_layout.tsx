import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTema } from '../src/context/ThemeContext';

function InitialLayout() {
  const { session, isLoading } = useAuth(); //  Pegamos os dados do contexto
  const segments = useSegments(); // Para saber em qual tela estamos
  const router = useRouter(); // Para navegar

  const [fontsLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
    ChauPhilomeneOne: require('../assets/fonts/ChauPhilomeneOne-Regular.ttf'),
    AoboshiOne: require('../assets/fonts/AoboshiOne-Regular.ttf'),
    Carlito: require('../assets/fonts/Carlito-Regular.ttf'),
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
  }, [session, isLoading, fontsLoaded, segments, router]);

  // Enquanto carrega fontes ou verifica autenticação, mostra spinner
  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  // Passa o tema efetivo ao Tamagui (light/dark)
  const { temaEfetivo } = useTema();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={temaEfetivo === 'escuro' ? 'dark' : 'light'}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)/login" options={{ headerShown: false }} />
        </Stack>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
