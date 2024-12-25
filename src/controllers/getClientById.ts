import { GetCommand } from '@aws-sdk/lib-dynamodb'
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda'
import { ddbDocClient, tableName } from '../db/client'

export const getClientByIdController = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    let userId = event.requestContext.authorizer?.claims.sub

    if (process.env.userId) {
      userId = process.env.userId
    }

    const clientId = event.pathParameters?.clientId

    if (!clientId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'clientId is required' })
      }
    }

    const command = new GetCommand({
      TableName: tableName,
      Key: {
        clientId,
        userId
      }
    })

    const data = await ddbDocClient.send(command)
    const item = data.Item
    if (!item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: `client with id: ${clientId} not found` })
      }
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    }
  } catch (err: unknown) {
    console.error('DynamoDB error: ', err)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(err)
    }
  }
}
