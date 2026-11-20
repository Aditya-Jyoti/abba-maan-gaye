// Failed-login limiter. Kept in memory, which is enough for a single app container.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const failures = new Map<string, number[]>();

function recent(key: string, now: number): number[] {
  const list = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
}

export function isLimited(key: string, now = Date.now()): boolean {
  return recent(key, now).length >= MAX_FAILURES;
}

export function recordFailure(key: string, now = Date.now()): void {
  failures.set(key, [...recent(key, now), now]);
  if (failures.size > 10_000) {
    for (const k of failures.keys()) recent(k, now);
  }
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
