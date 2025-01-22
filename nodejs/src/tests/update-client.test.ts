import {
  DynamoDBDocumentClient,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { type APIGatewayProxyEvent, type Context } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";
import { type ZodIssue } from "zod";
import { handler as updateClientHandler } from "../../functions/updateClient";
import { generateUpdateClient, generateUserId } from "./generate";
import { tableName } from "@/db/client";

describe("Test updateClient", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);
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
    ddbMock.reset();
  });

  it("should update a client", async () => {
    const userId = generateUserId();
    const clientId = generateUserId();

    const client = generateUpdateClient();

    const returnClient = { ...client, userId };

    ddbMock
      .on(QueryCommand, {
        TableName: tableName,
        IndexName: "emailIndex",
      })
      .resolves({ Count: 0 })
      .on(QueryCommand, {
        TableName: tableName,
        IndexName: "clientNameIndex",
      })
      .resolves({ Count: 0 })
      .on(UpdateCommand, {
        Key: {
          clientId: clientId,
          userId: userId,
        },
      })
      .resolves({
        Attributes: returnClient,
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

  it("should return 409 if client name already exists", async () => {
    const userId = generateUserId();
    const clientId = generateUserId();

    const client = generateUpdateClient();

    ddbMock
      .on(QueryCommand, {
        TableName: tableName,
        IndexName: "emailIndex",
      })
      .resolves({ Count: 0 })
      .on(QueryCommand, {
        TableName: tableName,
        IndexName: "clientNameIndex",
      })
      .resolves({ Count: 1 });

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

    expect(result.statusCode).toBe(409);
    expect(result.body).toBeTruthy();
  });

  it("should return 409 if email already exists", async () => {
    const userId = generateUserId();
    const clientId = generateUserId();

    const client = generateUpdateClient();

    ddbMock
      .on(QueryCommand, {
        TableName: tableName,
        IndexName: "emailIndex",
      })
      .resolves({ Count: 1 })
      .on(QueryCommand, {
        TableName: tableName,
        IndexName: "clientNameIndex",
      })
      .resolves({ Count: 0 });

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

    expect(result.statusCode).toBe(409);
    expect(result.body).toBeTruthy();
  });

  describe("Validation", () => {
    beforeEach(() => {
      ddbMock
        .on(QueryCommand, {
          TableName: tableName,
          IndexName: "emailIndex",
        })
        .resolves({ Count: 0 })
        .on(QueryCommand, {
          TableName: tableName,
          IndexName: "clientNameIndex",
        })
        .resolves({ Count: 0 });
    });
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
