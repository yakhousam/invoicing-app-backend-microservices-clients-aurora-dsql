import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { ddbDocClient, tableName } from '../db/client'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import createError from 'http-errors'

const emailDuplicationValidator = (): middy.MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => {
  return {
    before: async (request): Promise<void> => {
      const email = JSON.parse(request.event.body || '{}').email
      if (!email) {
        return
      }
      const userId = request.event.requestContext.authorizer?.claims.sub
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

export default emailDuplicationValidator
