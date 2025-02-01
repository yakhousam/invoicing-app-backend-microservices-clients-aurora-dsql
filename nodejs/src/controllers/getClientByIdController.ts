import { getClient } from "@/db/client";
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from "aws-lambda";
import createError from "http-errors";

const getClientByIdController = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;

  const clientId = event.pathParameters?.clientId;

  if (!clientId) {
    throw new createError.BadRequest("clientId is required");
  }

  const dbClient = await getClient();

  const result = await dbClient.query(
    'SELECT * FROM invoicing_app.clients WHERE "clientId" = $1 AND "userId" = $2',
    [clientId, userId],
  );

  const client = result.rows?.[0];

  if (!client) {
    throw new createError.NotFound(
      `Client with clientId "${clientId}" not found`,
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify(client),
  };
};

export default getClientByIdController;
