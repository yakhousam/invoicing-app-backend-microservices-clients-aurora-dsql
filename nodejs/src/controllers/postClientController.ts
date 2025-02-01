import { getClient } from "@/db/client";
import { DatabaseError } from "pg";
import { type Client, createClientSchema } from "@/validation";
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

    const dbClient = await getClient();

    const result = await dbClient.query(
      `INSERT INTO invoicing_app.clients ("clientId", "userId", "clientName", "email", "phone", "address", "VATNumber", "currencyPreference", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        newClient.clientId,
        newClient.userId,
        newClient.clientName,
        newClient.email,
        newClient.phone,
        newClient.address,
        newClient.VATNumber,
        newClient.currencyPreference,
        newClient.createdAt,
        newClient.updatedAt,
      ],
    );

    return {
      statusCode: 201,
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      throw createError.BadRequest(error.message);
    }
    if (error instanceof DatabaseError && error.code === "23505") {
      throw createError.BadRequest(error.message || "Client already exists");
    }
    throw error;
  }
};

export default postClientController;
