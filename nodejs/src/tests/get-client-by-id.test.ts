import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { type Context, type APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";
import { handler as getClientByIdHandler } from "../../functions/getClientById";
import { generateClients } from "./generate";

describe("Test getClientById", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

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
    ddbMock.reset();
  });

  it("should return a client by id", async () => {
    const client = generateClients(1)[0];
    ddbMock
      .on(GetCommand)
      .resolves({
        Item: undefined,
      })
      .on(GetCommand, {
        Key: {
          clientId: client.clientId,
          userId: client.userId,
        },
      })
      .resolves({
        Item: client,
      });
    const getClientEvent = {
      ...event,
      pathParameters: {
        clientId: client.clientId,
      },
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: client.userId,
            },
          },
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await getClientByIdHandler(getClientEvent, context);

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(JSON.stringify(client));
  });

  it("should return 401 if user is not authorized", async () => {
    const client = generateClients(1)[0];
    ddbMock
      .on(GetCommand)
      .resolves({
        Item: undefined,
      })
      .on(GetCommand, {
        Key: {
          clientId: client.clientId,
          userId: client.userId,
        },
      })
      .resolves({
        Item: client,
      });

    const getClientEvent = {
      ...event,
      pathParameters: {
        clientId: client.clientId,
      },
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: undefined,
            },
          },
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await getClientByIdHandler(getClientEvent, context);

    expect(result.statusCode).toBe(401);
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
    const client = generateClients(1)[0];

    ddbMock
      .on(GetCommand)
      .resolves({
        Item: undefined,
      })
      .on(GetCommand, {
        Key: { clientId: client.clientId, userId: client.userId },
      })
      .resolves({
        Item: undefined,
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
              sub: client.userId,
            },
          },
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await getClientByIdHandler(getClientEvent, context);
    expect(result.statusCode).toBe(404);
  });

  it("should return 500 on DynamoDB error", async () => {
    ddbMock.on(GetCommand).rejects(new Error("DynamoDB error"));

    const result = await getClientByIdHandler(
      {
        ...event,
        pathParameters: {
          clientId: "clientId",
        },
      },
      context,
    );

    expect(result.statusCode).toBe(500);
  });
});
