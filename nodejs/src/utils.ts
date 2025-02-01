export function createUpdateExpression(
  updates: Record<string, string>,
): string {
  return Object.entries(updates)
    .map(([key, value]) => `"${key}" = '${value}'`)
    .join(", ");
}
