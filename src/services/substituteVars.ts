export function substituteVars(str: string, vars: Record<string, string>): string {
  if (!str || Object.keys(vars).length === 0) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match);
}
