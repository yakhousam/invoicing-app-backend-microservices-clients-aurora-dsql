import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { type APIGatewayProxyEvent, type Context } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";
import { handler as getAllClientsHandler } from "../../functions/getAllClients";
import { generateClients, generateUserId } from "./generate";

describe("Test getAllClients", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

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
    ddbMock.reset();
  });

  it("should return all clients for the authenticated user", async () => {
    const userId = generateUserId();
    const clients = generateClients(1).map((client) => ({ ...client, userId }));

    ddbMock
      .on(QueryCommand)
      .resolves({
        Items: undefined,
      })
      .on(QueryCommand, {
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
      .resolves({
        Items: clients,
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

  it("should return 404 if no clients are found", async () => {
    const userId = generateUserId();

    ddbMock
      .on(QueryCommand, {
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
      .resolves({
        Items: undefined,
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

    expect(result.statusCode).toBe(404);
  });

  it("should handle pagination correctly", async () => {
    const userId = generateUserId();
    const clients = generateClients(20).map((client) => ({
      ...client,
      userId,
    }));
    const firstPage = clients.slice(0, 10);
    const secondPage = clients.slice(10);
    const lastEvaluatedKey = { clientId: "10" };
    ddbMock
      .on(QueryCommand)
      .resolves({ Items: undefined })
      .on(QueryCommand, {
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
      .resolves({ Items: firstPage, LastEvaluatedKey: lastEvaluatedKey })
      .on(QueryCommand, {
        ExclusiveStartKey: lastEvaluatedKey,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
      .resolves({ Items: secondPage });

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
      JSON.stringify({ clients: clients, count: clients.length }),
    );
  });

  it("should return 500 on DynamoDB error", async () => {
    const userId = generateUserId();
    ddbMock
      .on(QueryCommand, {
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
      .rejects(new Error("DynamoDB error"));

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

    expect(result.statusCode).toBe(500);
  });
});
