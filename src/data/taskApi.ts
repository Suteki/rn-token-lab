import { parseTasks, Task } from '../domain/task';
export const TASKS_URL = 'https://jsonplaceholder.typicode.com/todos?_limit=20';

export async function fetchTasks(signal?: AbortSignal): Promise<Task[]> {
  const response = await fetch(TASKS_URL, { signal });
  if (!response.ok) {
    throw new Error(`Task service returned HTTP ${response.status}`);
  }
  return parseTasks(await response.json());
}
