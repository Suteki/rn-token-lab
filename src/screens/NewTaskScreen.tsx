import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TaskDraft, taskDraftSchema } from '../domain/task';
import { usePreferences } from '../stores/preferences';
type Props = NativeStackScreenProps<RootStackParamList, 'NewTask'>;
export function NewTaskScreen({ navigation }: Props) {
  const addTask = usePreferences(state => state.addTask);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskDraft>({
    resolver: zodResolver(taskDraftSchema),
    defaultValues: { title: '', priority: 'normal' },
  });
  const submit = handleSubmit(draft => {
    addTask(draft);
    navigation.goBack();
  });
  return (
    <View style={styles.page}>
      <Text style={styles.label}>Title</Text>
      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="What needs doing?"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            accessibilityLabel="Task title"
          />
        )}
      />
      {errors.title ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errors.title.message}
        </Text>
      ) : null}
      <Controller
        control={control}
        name="priority"
        render={({ field: { value, onChange } }) => (
          <Button
            title={`Priority: ${value}`}
            onPress={() => onChange(value === 'normal' ? 'high' : 'normal')}
          />
        )}
      />
      <Button title="Save on this device" onPress={() => submit()} />
      <Text style={styles.note}>
        This form creates a local draft and never posts personal data to the
        demo API.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, padding: 24 },
  label: { color: '#f8fafc', fontSize: 18, marginBottom: 12 },
  input: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  error: { color: '#fca5a5', marginBottom: 12 },
  note: { color: '#94a3b8', marginTop: 28, lineHeight: 22 },
});
