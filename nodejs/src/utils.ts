export function createUpdateExpression(
  updates: Record<string, string>
): string {
  return (
    'SET ' +
    Object.keys(updates)
      .map((key) => `${key} = :${key}`)
      .join(', ')
  )
}

export function createExpressionAttributeValues(
  updates: Record<string, string>
) {
  return Object.entries(updates).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[`:${key}`] = value
      return acc
    },
    {}
  )
}
