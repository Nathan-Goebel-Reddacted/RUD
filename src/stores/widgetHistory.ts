/**
 * Runtime-only widget history store (module-level, not persisted).
 * Used by NumberCard (scalar sparkline) and LineChart (entry history).
 */

const scalars = new Map<string, number[]>();
const entries = new Map<string, Record<string, unknown>[]>();

export function appendScalar(widgetId: string, value: number, maxPoints: number): void {
  const arr = [...(scalars.get(widgetId) ?? []), value];
  scalars.set(widgetId, arr.length > maxPoints ? arr.slice(arr.length - maxPoints) : arr);
}

export function getScalars(widgetId: string): number[] {
  return scalars.get(widgetId) ?? [];
}

export function appendEntry(
  widgetId: string,
  entry: Record<string, unknown>,
  maxPoints: number
): void {
  const arr = [...(entries.get(widgetId) ?? []), entry];
  entries.set(widgetId, arr.length > maxPoints ? arr.slice(arr.length - maxPoints) : arr);
}

export function getEntries(widgetId: string): Record<string, unknown>[] {
  return entries.get(widgetId) ?? [];
}
