import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Notebook, Trophy, User } from '@tamagui/lucide-icons';
import { Circle } from 'tamagui';
import { palette } from '../constants/style';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'rgb(255, 255, 255)',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarStyle: {
          backgroundColor: palette.primaryBlue,
          height: 75,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => (
            <Circle
              size={42}
              backgroundColor={palette.white}
              opacity={focused ? 1 : 0.7}
            >
              <Home color={palette.primaryBlue} size={26} />
            </Circle>
          ),
        }}
      />

      <Tabs.Screen
        name="questions"
        options={{
          title: 'Questões',
          tabBarIcon: ({ focused }) => (
            <Circle
              size={42}
              backgroundColor={palette.white}
              opacity={focused ? 1 : 0.7}
            >
              <Notebook color={palette.primaryBlue} size={26} />
            </Circle>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <Circle
              size={42}
              backgroundColor={palette.white}
              opacity={focused ? 1 : 0.7}
            >
              <User color={palette.primaryBlue} size={26} />
            </Circle>
          ),
        }}
      />
    </Tabs>
  );
}
