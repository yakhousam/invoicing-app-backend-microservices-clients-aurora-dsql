import { type APIGatewayProxyEvent, type Context } from "aws-lambda";
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { type ZodIssue } from "zod";
import { handler as updateClientHandler } from "../../functions/updateClient";
import { generateUpdateClient, generateUserId } from "./generate";
import { Client as PgClient } from "pg";

vi.mock("pg", () => {
  const mClient = {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  };
  return { Client: vi.fn(() => mClient) };
});

describe("Test updateClient", () => {
  let dbClient: PgClient;

  const event = {
    httpMethod: "PATCH",
    headers: {
      "cache-control": "no-cache",
      "content-type": "application/json",
    },
  } as unknown as APIGatewayProxyEvent;

  const context = {
    getRemainingTimeInMillis: false,
  } as unknown as Context;

  beforeEach(() => {
    dbClient = new PgClient();
  });

  it("should update a client", async () => {
    const userId = generateUserId();
    const clientId = generateUserId();

    const client = generateUpdateClient();

    const returnClient = { ...client, userId };

    (dbClient.query as Mock).mockResolvedValueOnce({
      rows: [returnClient],
    });

    const updateClientEvent = {
      ...event,
      body: JSON.stringify(client),
      pathParameters: {
        clientId: clientId,
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

    const result = await updateClientHandler(updateClientEvent, context);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(returnClient));
  });

  describe("Validation", () => {
    it("should return 400 if client name is empty", async () => {
      const userId = generateUserId();
      const clientId = generateUserId();

      const client = generateUpdateClient();
      client.clientName = "";

      const updateClientEvent = {
        ...event,
        body: JSON.stringify(client),
        pathParameters: {
          clientId: clientId,
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

      const result = await updateClientHandler(updateClientEvent, context);
      const returnedBody = JSON.parse(result.body) as ZodIssue[];

      expect(result.statusCode).toBe(400);
      expect(returnedBody[0].path).toContain("clientName");
      expect(returnedBody[0].message).toBeTruthy();
    });

    it("should return 400 if email is invalid", async () => {
      const userId = generateUserId();
      const clientId = generateUserId();

      const client = generateUpdateClient();
      client.email = "invalid-email";

      const updateClientEvent = {
        ...event,
        body: JSON.stringify(client),
        pathParameters: {
          clientId: clientId,
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

      const result = await updateClientHandler(updateClientEvent, context);
      const returnedBody = JSON.parse(result.body) as ZodIssue[];

      expect(result.statusCode).toBe(400);
      expect(returnedBody[0].path).toContain("email");
      expect(returnedBody[0].message).toBeTruthy();
    });

    it("should return 400 if phone is invalid", async () => {
      const userId = generateUserId();
      const clientId = generateUserId();

      const client = generateUpdateClient();
      client.phone = "123";

      const updateClientEvent = {
        ...event,
        body: JSON.stringify(client),
        pathParameters: {
          clientId: clientId,
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

      const result = await updateClientHandler(updateClientEvent, context);
      const returnedBody = JSON.parse(result.body) as ZodIssue[];

      expect(result.statusCode).toBe(400);
      expect(returnedBody[0].path).toContain("phone");
      expect(returnedBody[0].message).toBeTruthy();
    });
  });
});
