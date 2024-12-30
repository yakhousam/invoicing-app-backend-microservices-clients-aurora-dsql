import { ddbDocClient, tableName } from '@/db/client'
import { Client } from '@/validation'
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
      const userId = request.event.requestContext.authorizer?.jwt?.claims
        ?.sub as string // authorizeUserMiddleware will ensure that this is not undefined
      const body = request.event.body as unknown as Partial<Client>
      const email = body.email as string
      const clientId = request.event.pathParameters?.clientId as string
      if (!email) {
        return
      }
      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'emailIndex',
        KeyConditionExpression: 'email = :email AND userId = :userId',
        FilterExpression: clientId ? 'clientId <> :clientId' : undefined,
        ExpressionAttributeValues: {
          ':email': email,
          ':userId': userId,
          ':clientId': clientId
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
