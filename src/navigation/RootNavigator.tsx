import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TaskListScreen } from '../screens/TaskListScreen';
import { TaskDetailsScreen } from '../screens/TaskDetailsScreen';
import { NewTaskScreen } from '../screens/NewTaskScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
export type RootStackParamList = {
  Tasks: undefined;
  TaskDetails: { taskId: number };
  NewTask: undefined;
  Settings: undefined;
};
const Stack = createNativeStackNavigator<RootStackParamList>();
export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <Stack.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{ title: 'Token Savings RN' }}
      />
      <Stack.Screen
        name="TaskDetails"
        component={TaskDetailsScreen}
        options={{ title: 'Task' }}
      />
      <Stack.Screen
        name="NewTask"
        component={NewTaskScreen}
        options={{ title: 'New local task' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
