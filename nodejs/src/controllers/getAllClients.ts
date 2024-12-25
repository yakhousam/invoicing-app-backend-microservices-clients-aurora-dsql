import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { ddbDocClient, tableName } from '../db/client'
import { getAllClientsQuerySchema } from '../validation'

export const getClientsController = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = process.env.userId
      ? process.env.userId
      : event.requestContext.authorizer?.claims.sub

    const { limit, lastEvaluatedKey } = getAllClientsQuerySchema.parse(
      event.queryStringParameters ?? {}
    )

    const command = new QueryCommand({
      TableName: tableName,
      Limit: parseInt(limit),
      ExclusiveStartKey: lastEvaluatedKey
        ? JSON.parse(lastEvaluatedKey)
        : undefined,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })

    const data = await ddbDocClient.send(command)
    const response = {
      clients: data.Items,
      lastEvaluatedKey: data.LastEvaluatedKey
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    }
  } catch (err: unknown) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(err)
    }
  }
}
