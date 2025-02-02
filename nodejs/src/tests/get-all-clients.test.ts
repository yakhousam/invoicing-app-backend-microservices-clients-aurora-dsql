import { type APIGatewayProxyEvent, type Context } from "aws-lambda";
import { Client } from "pg";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { handler as getAllClientsHandler } from "../../functions/getAllClients";
import { generateClients, generateUserId } from "./generate";

vi.mock(import("pg"), async (importOriginal) => {
  const mod = await importOriginal(); // type is inferred
  return {
    ...mod,
    // replace some exports
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  };
});

describe("Test getAllClients", () => {
  let dbClient: Client;

  const event = {
    httpMethod: "GET",
    headers: {
      "cache-control": "no-cache",
    },
  } as unknown as APIGatewayProxyEvent;

  const context = {
    getRemainingTimeInMillis: false,
  } as unknown as Context;

  beforeEach(() => {
    dbClient = new Client();
  });

  it("should return all clients for the authenticated user", async () => {
    const userId = generateUserId();
    const clients = generateClients(10).map((client) => ({
      ...client,
      userId,
    }));
    (dbClient.query as Mock).mockResolvedValueOnce({
      rows: [{ count: clients.length }],
    });
    (dbClient.query as Mock).mockResolvedValueOnce({
      rows: clients,
    });
    const getAllClientsEvent = {
      ...event,
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: userId,
            },
          },
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await getAllClientsHandler(getAllClientsEvent, context);

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(
      JSON.stringify({ clients, count: clients.length }),
    );
  });
});
