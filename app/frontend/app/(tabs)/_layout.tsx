import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Notebook, Calendar, Trophy, User, BarChart2 } from '@tamagui/lucide-icons';
import { Circle } from 'tamagui';
import { palette } from 'app/constants/style';
import { useAuth } from 'app/context/AuthContext';

function TabIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return (
    <Circle
      size={42}
      backgroundColor={palette.white}
      opacity={focused ? 1 : 0.7}
    >
      <Icon color={palette.primaryBlue} size={26} />
    </Circle>
  );
}

export default function TabLayout() {
  const { role } = useAuth();

  const isAluno = role === 'aluno';
  const isAdmin = role === 'admin';
  const isProfessor = role === 'professor';

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
          marginLeft: 4,
          marginTop: 4,
        },
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        }}
      />

      {/* Aluno + Admin */}
      <Tabs.Screen
        name="questions"
        options={{
          title: isAdmin ? 'Quiz' : 'Questões',
          href: (isAluno || isAdmin) ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Notebook} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Tarefa diária',
          href: isAluno ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Calendar} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          href: isAluno ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Trophy} focused={focused} />,
        }}
      />

      {/* Professor only */}
      <Tabs.Screen
        name="listas"
        options={{
          title: 'Listas',
          href: isProfessor ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Notebook} focused={focused} />,
        }}
      />

      {/* Admin only */}
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estatísticas',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon Icon={BarChart2} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
