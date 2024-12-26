import { PutCommand } from '@aws-sdk/lib-dynamodb'
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda'
import { ddbDocClient, tableName } from '../db/client'

const postClientController = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body!) // we are sure that body is not null because we are using httpJsonBodyParserMiddleware and validatePostClientBodyMiddleware  middlewares

  const command = new PutCommand({
    TableName: tableName,
    Item: body
  })

  await ddbDocClient.send(command)

  return {
    statusCode: 200,
    body: JSON.stringify(body)
  }
}

export default postClientController
