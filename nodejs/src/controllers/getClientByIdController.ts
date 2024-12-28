import { ddbDocClient, tableName } from '@/db/client'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda'
import createError from 'http-errors'

const getClientByIdController = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.jwt.claims.sub as string

  const clientId = event.pathParameters?.clientId

  if (!clientId) {
    throw new createError.BadRequest('clientId is required')
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
    throw new createError.NotFound(
      `Client with clientId "${clientId}" not found`
    )
  }

  return {
    statusCode: 200,
    body: JSON.stringify(item)
  }
}

export default getClientByIdController
