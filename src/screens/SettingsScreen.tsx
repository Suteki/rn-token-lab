import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { usePreferences } from '../stores/preferences';
import { useConnectivity } from '../hooks/useConnectivity';
export function SettingsScreen() {
  const { showCompleted, setShowCompleted, favoriteIds, localTasks } =
    usePreferences();
  const online = useConnectivity();
  return (
    <View style={styles.page}>
      <View style={styles.row}>
        <Text style={styles.label}>Show completed tasks</Text>
        <Switch
          value={showCompleted}
          onValueChange={setShowCompleted}
          accessibilityLabel="Show completed tasks"
        />
      </View>
      <Text style={styles.detail}>{favoriteIds.length} favorite tasks</Text>
      <Text style={styles.detail}>{localTasks.length} local drafts</Text>
      <Text style={styles.detail}>
        Network: {online === null ? 'Checking' : online ? 'Online' : 'Offline'}
      </Text>
      <Text style={styles.note}>
        Preferences use Zustand persistence with AsyncStorage. Query results
        stay in the TanStack Query memory cache.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  label: { color: '#f8fafc', fontSize: 17 },
  detail: { color: '#cbd5e1', fontSize: 16, marginBottom: 16 },
  note: { color: '#94a3b8', marginTop: 20, lineHeight: 23 },
});
