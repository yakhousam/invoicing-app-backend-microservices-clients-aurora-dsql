import { APIGatewayProxyEvent } from "aws-lambda";

export function createUpdateExpression(
  updates: Record<string, string>,
): string {
  return Object.entries(updates)
    .map(([key, value]) => `"${key}" = '${value}'`)
    .join(", ");
}

const isDev = process.env.NODE_ENV === "development";

export function getUserId(event: APIGatewayProxyEvent): string {
  return isDev
    ? process.env.userId
    : event.requestContext.authorizer?.jwt?.claims?.sub;
}
