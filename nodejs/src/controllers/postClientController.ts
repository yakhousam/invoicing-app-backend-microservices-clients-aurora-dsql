import { getDatabaseClient } from "@/db/client";
import { DatabaseError } from "pg";
import { type Client, createClientSchema } from "@/validation";
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from "aws-lambda";
import createError from "http-errors";
import { ZodError } from "zod";
import { getUserId } from "@/utils";

const postClientController = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    if (!userId) {
      throw new createError.Unauthorized("Unauthorized");
    }

    const validateBody = createClientSchema.parse(event.body);

    const newClient: Client = {
      ...validateBody,
      clientId: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dbClient = await getDatabaseClient();

    const result = await dbClient.query(
      `INSERT INTO invoicing_app.clients ("clientId", "userId", "clientName", "email", "phone", "address", "VATNumber", "currencyPreference", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        newClient.clientId,
        newClient.userId,
        newClient.clientName,
        newClient.email,
        newClient.phone || "",
        newClient.address || "",
        newClient.VATNumber || "",
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
    if (error instanceof ZodError) {
      throw createError.BadRequest(error.message);
    }
    if (error instanceof DatabaseError && error.code === "23505") {
      throw createError.BadRequest("Client already exists");
    }
    throw error;
  }
};

export default postClientController;
