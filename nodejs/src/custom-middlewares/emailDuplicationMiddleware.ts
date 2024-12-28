import { ddbDocClient, tableName } from '@/db/client'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import createError from 'http-errors'

const emailDuplicationMiddleware = (): middy.MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => {
  return {
    before: async (request): Promise<void> => {
      const email = JSON.parse(request.event.body!).email // we are sure that body is not null because we are using httpJsonBodyParserMiddleware and validatePostClientBodyMiddleware  middlewares
      if (!email) {
        return
      }
      const userId = request.event.requestContext.authorizer?.jwt.claims.sub
      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'emailIndex',
        KeyConditionExpression: 'email = :email AND userId = :userId',
        ExpressionAttributeValues: {
          ':email': email,
          ':userId': userId
        }
      })
      const duplicateEmail = await ddbDocClient.send(command)
      if (duplicateEmail.Count !== undefined && duplicateEmail.Count > 0) {
        throw new createError.Conflict('Email already exists')
      }
    }
  }
}

export default emailDuplicationMiddleware
