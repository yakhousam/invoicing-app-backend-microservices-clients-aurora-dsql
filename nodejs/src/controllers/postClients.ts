import { PutCommand } from '@aws-sdk/lib-dynamodb'
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda'
import { ddbDocClient, tableName } from '../db/client'

const postClientController = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}')

    const command = new PutCommand({
      TableName: tableName,
      Item: body
    })
    await ddbDocClient.send(command)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  } catch (err: unknown) {
    console.error('Error adding or updating item:', err)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(err)
    }
  }
}

export default postClientController
