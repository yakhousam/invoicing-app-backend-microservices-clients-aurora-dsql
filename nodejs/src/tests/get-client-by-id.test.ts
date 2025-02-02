import { type Context, type APIGatewayProxyEvent } from "aws-lambda";
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { handler as getClientByIdHandler } from "../../functions/getClientById";
import { generateClients, generateUserId } from "./generate";
import { Client } from "pg";

vi.mock("pg", () => {
  const mClient = {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  };
  return { Client: vi.fn(() => mClient) };
});

describe("Test getClientById", () => {
  let dbClient: Client;

  const event = {
    httpMethod: "GET",
    headers: {
      "cache-control": "no-cache",
    },
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: "userId",
          },
        },
      },
    },
  } as unknown as APIGatewayProxyEvent;

  const context = {
    getRemainingTimeInMillis: false,
  } as unknown as Context;

  beforeEach(() => {
    dbClient = new Client();
  });

  it("should return a client by id", async () => {
    const returnedClient = generateClients(1)[0];

    (dbClient.query as Mock).mockResolvedValueOnce({
      rows: [returnedClient],
    });

    const getClientEvent = {
      ...event,
      pathParameters: {
        clientId: returnedClient.clientId,
      },
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: returnedClient.userId,
            },
          },
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await getClientByIdHandler(getClientEvent, context);

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(JSON.stringify(returnedClient));
  });

  it("should return 400 if clientId is missing", async () => {
    const getClientEvent = {
      ...event,
      pathParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const result = await getClientByIdHandler(getClientEvent, context);

    expect(result.statusCode).toBe(400);
  });

  it("should return 404 if client is not found", async () => {
    const userId = generateUserId();

    (dbClient.query as Mock).mockResolvedValueOnce({
      rows: [],
    });
    const getClientEvent = {
      ...event,
      pathParameters: {
        clientId: "nonExistentClientId",
      },
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

    const result = await getClientByIdHandler(getClientEvent, context);
    expect(result.statusCode).toBe(404);
  });
});
