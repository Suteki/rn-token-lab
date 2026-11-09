import {
  createLocalTask,
  filterTasks,
  getTaskStats,
  parseTasks,
  taskDraftSchema,
  toggleFavorite,
  Task,
} from '../src/domain/task';
const tasks: Task[] = [
  { id: 1, userId: 1, title: 'Review native navigation', completed: false },
  { id: 2, userId: 1, title: 'Add offline state', completed: true },
  { id: 3, userId: 2, title: 'Review validation', completed: false },
];
const base = {
  query: '',
  showCompleted: true,
  favoritesOnly: false,
  favoriteIds: [],
};
describe('Task API schema', () => {
  test('accepts the documented API shape', () =>
    expect(parseTasks(tasks)).toEqual(tasks));
  test.each(['id', 'userId', 'title', 'completed'])(
    'rejects a missing %s field',
    field => {
      const broken: Record<string, unknown> = { ...tasks[0] };
      delete broken[field];
      expect(() => parseTasks([broken])).toThrow();
    },
  );
  test.each([0, -1, 1.5, '1'])('rejects invalid task id %p', id =>
    expect(() => parseTasks([{ ...tasks[0], id }])).toThrow(),
  );
  test('rejects a non-array response', () =>
    expect(() => parseTasks({ items: tasks })).toThrow());
  test('accepts an empty result', () => expect(parseTasks([])).toEqual([]));
  test('trims task titles', () =>
    expect(parseTasks([{ ...tasks[0], title: '  Review  ' }])[0].title).toBe(
      'Review',
    ));
});
describe('Task filters', () => {
  test('keeps API order by default', () =>
    expect(filterTasks(tasks, base)).toEqual(tasks));
  test('hides completed tasks', () =>
    expect(
      filterTasks(tasks, { ...base, showCompleted: false }).map(t => t.id),
    ).toEqual([1, 3]));
  test('matches titles case insensitively', () =>
    expect(filterTasks(tasks, { ...base, query: 'REVIEW' })).toHaveLength(2));
  test('trims the search query', () =>
    expect(filterTasks(tasks, { ...base, query: ' offline ' })).toHaveLength(
      1,
    ));
  test('applies favorites and completion together', () =>
    expect(
      filterTasks(tasks, {
        ...base,
        favoritesOnly: true,
        favoriteIds: [1, 2],
        showCompleted: false,
      }).map(t => t.id),
    ).toEqual([1]));
  test('handles an unknown favorite id', () =>
    expect(
      filterTasks(tasks, { ...base, favoritesOnly: true, favoriteIds: [999] }),
    ).toEqual([]));
  test('does not mutate API data', () => {
    const copy = [...tasks];
    filterTasks(tasks, { ...base, query: 'Review' });
    expect(tasks).toEqual(copy);
  });
});
describe('Task summary', () => {
  test('handles an empty list without NaN', () =>
    expect(getTaskStats([])).toEqual({
      total: 0,
      completed: 0,
      pending: 0,
      completionPercent: 0,
    }));
  test('rounds the visible completion percentage', () =>
    expect(getTaskStats(tasks)).toEqual({
      total: 3,
      completed: 1,
      pending: 2,
      completionPercent: 33,
    }));
  test('counts all-complete input', () =>
    expect(
      getTaskStats(tasks.map(t => ({ ...t, completed: true })))
        .completionPercent,
    ).toBe(100));
});
describe('Local drafts and favorites', () => {
  test('adds a favorite without mutating the original ids', () => {
    const ids = [1];
    expect(toggleFavorite(ids, 2)).toEqual([1, 2]);
    expect(ids).toEqual([1]);
  });
  test('removes an existing favorite', () =>
    expect(toggleFavorite([1, 2], 1)).toEqual([2]));
  test('creates a validated local task', () =>
    expect(
      createLocalTask({ title: '  Native form  ', priority: 'high' }, 1000001),
    ).toEqual({
      id: 1000001,
      userId: 1,
      title: 'Native form',
      completed: false,
      priority: 'high',
    }));
  test.each(['', '  ', 'ab'])('rejects a short draft title %p', title =>
    expect(
      taskDraftSchema.safeParse({ title, priority: 'normal' }).success,
    ).toBe(false),
  );
  test('rejects an oversized draft', () =>
    expect(
      taskDraftSchema.safeParse({ title: 'x'.repeat(121), priority: 'normal' })
        .success,
    ).toBe(false));
  test('rejects an unknown priority', () =>
    expect(
      taskDraftSchema.safeParse({ title: 'Review', priority: 'urgent' })
        .success,
    ).toBe(false));
  test.each([0, -1, 1.5])('rejects invalid local ids %p', id =>
    expect(() =>
      createLocalTask({ title: 'Review', priority: 'normal' }, id),
    ).toThrow(),
  );
});
