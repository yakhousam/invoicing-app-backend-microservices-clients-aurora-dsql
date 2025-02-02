import { type Client } from "@/validation";
import { type APIGatewayProxyEvent, type Context } from "aws-lambda";
import { Client as PgClient } from "pg";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { type ZodIssue } from "zod";
import { handler as postClientHandler } from "../../functions/postClient";
import { generatePostClient, generateUserId } from "./generate";

vi.mock(import("pg"), async (importOriginal) => {
  const actual = await importOriginal();
  const mClient = {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  };
  return {
    ...actual,
    Client: vi.fn(() => mClient) as unknown as typeof PgClient,
  };
});

describe("Test postClient", () => {
  let dbClient: PgClient;

  const event = {
    httpMethod: "POST",
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

  it("should post a client", async () => {
    const postClient = generatePostClient();
    const userId = generateUserId();

    (dbClient.query as Mock).mockResolvedValueOnce({
      rows: [postClient],
    });

    const putEvent = {
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
      body: JSON.stringify(postClient),
    } as unknown as APIGatewayProxyEvent;

    const result = await postClientHandler(putEvent, context);
    expect(result.statusCode).toBe(201);

    const returnedBody = JSON.parse(result.body) as Client;
    expect(returnedBody).contains(postClient);
  });

  describe("Validation", () => {
    it("should return 400 if client name is missing", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { clientName, ...client } = generatePostClient();
      const userId = generateUserId();

      const putEvent = {
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
        body: JSON.stringify(client),
      } as unknown as APIGatewayProxyEvent;

      const result = await postClientHandler(putEvent, context);
      const returnedBody = JSON.parse(result.body) as ZodIssue[];

      expect(result.statusCode).toBe(400);
      expect(returnedBody[0].path).toContain("clientName");
      expect(returnedBody[0].message).toBeTruthy();
    });

    it("should return 400 if client name is empty", async () => {
      const userId = generateUserId();
      const client = generatePostClient();
      client.clientName = "";

      const putEvent = {
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
        body: JSON.stringify(client),
      } as unknown as APIGatewayProxyEvent;

      const result = await postClientHandler(putEvent, context);
      const returnedBody = JSON.parse(result.body) as ZodIssue[];

      expect(result.statusCode).toBe(400);
      expect(returnedBody[0].path).toContain("clientName");
      expect(returnedBody[0].message).toBeTruthy();
    });

    it("should return 400 if email is invalid", async () => {
      const userId = generateUserId();
      const client = generatePostClient();
      client.email = "invalid-email";

      const putEvent = {
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
        body: JSON.stringify(client),
      } as unknown as APIGatewayProxyEvent;

      const result = await postClientHandler(putEvent, context);
      const returnedBody = JSON.parse(result.body) as ZodIssue[];

      expect(result.statusCode).toBe(400);
      expect(returnedBody[0].path).toContain("email");
      expect(returnedBody[0].message).toBeTruthy();
    });

    it("should return 400 if phone is invalid", async () => {
      const userId = generateUserId();
      const client = generatePostClient();
      client.phone = "123";

      const putEvent = {
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
        body: JSON.stringify(client),
      } as unknown as APIGatewayProxyEvent;

      const result = await postClientHandler(putEvent, context);
      const returnedBody = JSON.parse(result.body) as ZodIssue[];

      expect(result.statusCode).toBe(400);
      expect(returnedBody[0].path).toContain("phone");
      expect(returnedBody[0].message).toBeTruthy();
    });
  });
});
