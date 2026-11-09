import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { filterTasks, getTaskStats } from '../domain/task';
import { useTasks } from '../hooks/useTasks';
import { useConnectivity } from '../hooks/useConnectivity';
import { usePreferences } from '../stores/preferences';
import { TaskCard } from '../components/TaskCard';
import { ProgressRing } from '../components/ProgressRing';
type Props = NativeStackScreenProps<RootStackParamList, 'Tasks'>;

export function TaskListScreen({ navigation }: Props) {
  const { data = [], isPending, isRefetching, error, refetch } = useTasks();
  const isOnline = useConnectivity();
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { localTasks, favoriteIds, showCompleted } = usePreferences();
  const allTasks = useMemo(() => [...localTasks, ...data], [localTasks, data]);
  const visible = filterTasks(allTasks, {
    query,
    showCompleted,
    favoriteIds,
    favoritesOnly,
  });
  const stats = getTaskStats(allTasks);
  return (
    <View style={styles.page}>
      <View style={styles.toolbar}>
        <View style={styles.summary}>
          <Text style={styles.title}>{stats.total} tasks</Text>
          <Text style={styles.hint}>
            {isOnline === false
              ? 'Offline, showing cached tasks'
              : 'Public demo API and local drafts'}
          </Text>
        </View>
        <ProgressRing percent={stats.completionPercent} />
      </View>
      <View style={styles.actions}>
        <Button title="Add" onPress={() => navigation.navigate('NewTask')} />
        <Button
          title="Settings"
          onPress={() => navigation.navigate('Settings')}
        />
        <Button
          title={favoritesOnly ? 'Show all' : 'Favorites'}
          onPress={() => setFavoritesOnly(!favoritesOnly)}
        />
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search task titles"
        placeholderTextColor="#94a3b8"
        style={styles.search}
        accessibilityLabel="Search tasks"
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error.message}
        </Text>
      ) : null}
      {isPending ? (
        <ActivityIndicator accessibilityLabel="Loading tasks" />
      ) : null}
      <FlatList
        data={visible}
        keyExtractor={task => String(task.id)}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            favorite={favoriteIds.includes(item.id)}
            onPress={() =>
              navigation.navigate('TaskDetails', { taskId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          !isPending ? (
            <Text style={styles.hint}>No matching tasks</Text>
          ) : undefined
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, padding: 20 },
  toolbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  summary: { flex: 1 },
  title: { color: '#f8fafc', fontSize: 29, fontWeight: '700' },
  hint: { color: '#94a3b8', fontSize: 14, marginTop: 8 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  search: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  error: { color: '#fca5a5', marginBottom: 12 },
});
