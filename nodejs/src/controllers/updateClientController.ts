import { getDatabaseClient } from "@/db/client";
import { createUpdateExpression, getUserId } from "@/utils";
import { updateClientSchema } from "@/validation";
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from "aws-lambda";
import createError from "http-errors";
import { ZodError } from "zod";

const updateClientController = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    if (!userId) {
      throw new createError.Unauthorized("Unauthorized");
    }
    const clientId = event.pathParameters?.clientId as string;

    const updates = updateClientSchema.parse(event.body);

    const updateExpression = createUpdateExpression(updates);
    const dbClient = await getDatabaseClient();

    const result = await dbClient.query(
      `UPDATE invoicing_app.clients SET ${updateExpression} WHERE "clientId" = $1 AND "userId" = $2 RETURNING *`,
      [clientId, userId],
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError.BadRequest(error.message);
    }

    console.error("Error instance:", error);
    throw error;
  }
};

export default updateClientController;
