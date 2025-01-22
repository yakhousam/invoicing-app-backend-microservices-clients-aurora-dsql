import { ddbDocClient, tableName } from "@/db/client";
import { Client, createClientSchema } from "@/validation";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from "aws-lambda";
import createError from "http-errors";
import { ZodError } from "zod";

const postClientController = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string; // authorizeUserMiddleware will ensure that this is not undefined

    const validateBody = createClientSchema.parse(event.body);

    const newClient: Client = {
      ...validateBody,
      clientId: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: tableName,
      Item: newClient,
    });

    await ddbDocClient.send(command);

    return {
      statusCode: 201,
      body: JSON.stringify(newClient),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError.BadRequest(error.message);
    }
    throw error;
  }
};

export default postClientController;
