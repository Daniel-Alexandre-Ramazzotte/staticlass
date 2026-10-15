import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Notebook, Calendar, Trophy, User, BarChart2 } from '@tamagui/lucide-icons';
import { Circle } from 'tamagui';
import { palette } from 'app/constants/style';
import { useAuth } from 'app/context/AuthContext';

function TabIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return (
    <Circle
      size={40}
      backgroundColor={focused ? palette.white : 'rgba(255,255,255,0.16)'}
      shadowColor="#000"
      shadowOpacity={focused ? 0.18 : 0}
      shadowRadius={6}
      shadowOffset={{ width: 0, height: 2 }}
    >
      <Icon color={focused ? palette.primaryBlue : palette.white} size={22} />
    </Circle>
  );
}

export default function TabLayout() {
  const { role, emailVerified } = useAuth();

  const isAluno = role === 'aluno';
  const isAdmin = role === 'admin';
  const isProfessor = role === 'professor';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'rgb(255, 255, 255)',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.75)',
        tabBarStyle: {
          backgroundColor: palette.primaryBlue,
          height: 78,
          paddingBottom: 12,
          paddingTop: 10,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
          marginLeft: 10,
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
          tabBarBadge: !emailVerified ? 1 : undefined,
        }}
      />
    </Tabs>
  );
}
