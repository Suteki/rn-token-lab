import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTasks } from '../hooks/useTasks';
import { usePreferences } from '../stores/preferences';
type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetails'>;
export function TaskDetailsScreen({ route }: Props) {
  const { data = [] } = useTasks();
  const { localTasks, favoriteIds, toggleFavorite } = usePreferences();
  const task = [...localTasks, ...data].find(
    item => item.id === route.params.taskId,
  );
  if (!task) {
    return (
      <Text style={styles.missing}>Task not found in the current list</Text>
    );
  }
  return (
    <View style={styles.page}>
      <Text style={styles.label}>Task #{task.id}</Text>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.label}>{task.completed ? 'Complete' : 'Open'}</Text>
      <Button
        title={
          favoriteIds.includes(task.id) ? 'Remove favorite' : 'Add favorite'
        }
        onPress={() => toggleFavorite(task.id)}
      />
      <Text style={styles.note}>
        Favorites stay on this device. Public API tasks are read only.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, padding: 24 },
  label: { color: '#a5b4fc', fontSize: 17, marginBottom: 20 },
  title: { color: '#f8fafc', fontSize: 28, lineHeight: 38, marginBottom: 24 },
  note: { color: '#94a3b8', marginTop: 28, lineHeight: 22 },
  missing: { color: '#f8fafc', padding: 24 },
});
