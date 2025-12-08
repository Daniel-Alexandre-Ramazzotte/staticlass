import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Use um pacote de ícones

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0084ffff',
        tabBarInactiveTintColor: '#cccccc',
        tabBarStyle: {
          backgroundColor: '#001147ff',
        },
      }}
    >
      <Tabs.Screen
        name="home" // Corresponde ao arquivo home.tsx
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          ),
        }}
      />

      <Tabs.Screen
        name="question"
        options={{
          title: 'Questão',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="comment-question"
              color={color}
              size={26}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" color={color} size={26} />
          ),
        }}
      />
    </Tabs>
  );
}
