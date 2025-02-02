import { getDatabaseClient } from "@/db/client";
import { getUserId } from "@/utils";
import { clientQuerySchema } from "@/validation";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import createError from "http-errors";
import { ZodError } from "zod";

const getAllClientsController = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    if (!userId) {
      throw new createError.Unauthorized("Unauthorized");
    }

    const { limit, offset } = clientQuerySchema.parse(
      event.queryStringParameters,
    );

    const databaseClient = await getDatabaseClient();

    const countResult = await databaseClient.query(
      'SELECT COUNT(*) FROM invoicing_app.clients WHERE "userId" = $1',
      [userId],
    );

    const totalCount = parseInt(countResult.rows[0].count, 10);

    const clientData = await databaseClient.query(
      'SELECT * FROM invoicing_app.clients WHERE "userId" = $1 LIMIT $2 OFFSET $3',
      [userId, limit, offset],
    );

    const response = {
      clients: clientData.rows,
      count: totalCount,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new createError.BadRequest(error.message);
    }
    throw error;
  }
};

export default getAllClientsController;
