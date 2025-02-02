import { getDatabaseClient } from "@/db/client";
import { getUserId } from "@/utils";
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from "aws-lambda";
import createError from "http-errors";

const getClientByIdController = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = getUserId(event);

  if (!userId) {
    throw new createError.Unauthorized("Unauthorized");
  }

  const clientId = event.pathParameters?.clientId;

  if (!clientId) {
    throw new createError.BadRequest("clientId is required");
  }

  const dbClient = await getDatabaseClient();

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
