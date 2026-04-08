import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTema } from '../src/context/ThemeContext';

const WEB_BUTTON_HOVER_STYLE_ID = 'staticlass-button-hover-styles';

function useWebButtonHoverStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById(WEB_BUTTON_HOVER_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = WEB_BUTTON_HOVER_STYLE_ID;
    style.textContent = `
      button:not(:disabled),
      [role="button"]:not([aria-disabled="true"]),
      [role="tab"]:not([aria-disabled="true"]) {
        transition: background-color 140ms ease, box-shadow 140ms ease, filter 140ms ease, opacity 140ms ease;
      }

      button:not(:disabled):hover,
      [role="button"]:not([aria-disabled="true"]):hover,
      [role="tab"]:not([aria-disabled="true"]):hover {
        cursor: pointer;
        filter: brightness(1.08) saturate(1.08);
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
      }

      [role="tab"]:not([aria-disabled="true"]):hover {
        background-color: rgba(255, 255, 255, 0.14) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);
}

function InitialLayout() {
  const { session, isLoading } = useAuth(); //  Pegamos os dados do contexto
  const segments = useSegments(); // Para saber em qual tela estamos
  const router = useRouter(); // Para navegar
  const { temaEfetivo } = useTema();
  useWebButtonHoverStyles();

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
