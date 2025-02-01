import { getClient } from "@/db/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import createError from "http-errors";

const getAllClientsController = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
  if (!userId) {
    throw new createError.Unauthorized("Unauthorized");
  }
  const client = await getClient();

  const clientData = client.query(
    'SELECT * FROM invoicing_app.clients WHERE "userId" = $1',
    [userId],
  );
  const count = client.query(
    'SELECT COUNT(*) FROM invoicing_app.clients WHERE "userId" = $1',
    [userId],
  );
  const result = await Promise.all([clientData, count]);

  const response = {
    clients: result[0].rows,
    count: result[1].rows[0].count,
  };
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};

export default getAllClientsController;
