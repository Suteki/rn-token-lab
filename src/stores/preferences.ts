import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  createLocalTask,
  LocalTask,
  TaskDraft,
  toggleFavorite,
} from '../domain/task';
export const preferencesStorage = createAsyncStorage('token-savings-rn');
type Preferences = {
  showCompleted: boolean;
  favoriteIds: number[];
  localTasks: LocalTask[];
  setShowCompleted: (value: boolean) => void;
  toggleFavorite: (id: number) => void;
  addTask: (draft: TaskDraft) => void;
};
export const usePreferences = create<Preferences>()(
  persist(
    (set, get) => ({
      showCompleted: true,
      favoriteIds: [],
      localTasks: [],
      setShowCompleted: showCompleted => set({ showCompleted }),
      toggleFavorite: id =>
        set({ favoriteIds: toggleFavorite(get().favoriteIds, id) }),
      addTask: draft => {
        const tasks = get().localTasks;
        const nextId = Math.max(1_000_000, ...tasks.map(task => task.id)) + 1;
        set({ localTasks: [...tasks, createLocalTask(draft, nextId)] });
      },
    }),
    {
      name: 'preferences',
      storage: createJSONStorage(() => preferencesStorage),
      version: 1,
      partialize: state => ({
        showCompleted: state.showCompleted,
        favoriteIds: state.favoriteIds,
        localTasks: state.localTasks,
      }),
    },
  ),
);
