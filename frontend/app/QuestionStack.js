import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
//import QuestionLobbyScreen from './(tabs)/question.tsx';
import QuizInProgressScreen from './screens/QuizInProgressScreen';
import ResultScreen from './screens/ResultScreen';

const Stack = createStackNavigator();

const QuestionStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // headerStyle: {
        //   backgroundColor: '#6200ee',
        // },
        // headerTintColor: '#ffffff',
        // headerTitleStyle: {
        //   fontWeight: 'bold',
        // },
        // headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="QuestionList" component={QuizInProgressScreen} />
      <Stack.Screen
        name="QuizInProgress"
        component={QuizInProgressScreen}
        options={{
          title: 'Quiz em Andamento',
          headerShown: false,
        }}
      />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen
        name="ResultScreen"
        component={ResultScreen}
        options={{
          title: 'Resultados da Sessão',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default QuestionStack;
