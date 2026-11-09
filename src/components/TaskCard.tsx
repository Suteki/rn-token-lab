import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Task } from '../domain/task';
type Props = { task: Task; favorite: boolean; onPress: () => void };
export function TaskCard({ task, favorite, onPress }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(180)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open task ${task.id}`}
        style={styles.card}
      >
        <View style={styles.heading}>
          <Text style={styles.tag}>
            #{task.id} {task.completed ? 'Complete' : 'Open'}
          </Text>
          <Text accessibilityLabel={favorite ? 'Favorite' : 'Not a favorite'}>
            {favorite ? '★' : '☆'}
          </Text>
        </View>
        <Text style={styles.title}>{task.title}</Text>
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tag: { color: '#a5b4fc', fontSize: 13 },
  title: { color: '#f8fafc', fontSize: 17, lineHeight: 24 },
});
