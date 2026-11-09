import { fetchTasks, TASKS_URL } from '../src/data/taskApi';
const sample = [
  { id: 1, userId: 1, title: 'Review navigation', completed: false },
];
const fetchMock = jest.fn();
beforeEach(() => {
  globalThis.fetch = fetchMock;
  fetchMock.mockReset();
});
describe('Task HTTP client', () => {
  test('requests the public demo endpoint and validates its response', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => sample });
    await expect(fetchTasks()).resolves.toEqual(sample);
    expect(fetchMock).toHaveBeenCalledWith(TASKS_URL, { signal: undefined });
  });
  test('passes cancellation to fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
    await fetchTasks(controller.signal);
    expect(fetchMock).toHaveBeenCalledWith(TASKS_URL, {
      signal: controller.signal,
    });
  });
  test.each([401, 429, 500])('surfaces HTTP %i as a failure', async status => {
    fetchMock.mockResolvedValue({ ok: false, status });
    await expect(fetchTasks()).rejects.toThrow(`HTTP ${status}`);
  });
  test('rejects a malformed successful response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'broken' }],
    });
    await expect(fetchTasks()).rejects.toThrow();
  });
  test('keeps network failures visible', async () => {
    fetchMock.mockRejectedValue(new Error('Network unavailable'));
    await expect(fetchTasks()).rejects.toThrow('Network unavailable');
  });
});
