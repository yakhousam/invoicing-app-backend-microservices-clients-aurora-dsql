import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { ddbDocClient, tableName } from '../db/client'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import createError from 'http-errors'

const clientNameDuplicationValidator = (): middy.MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => {
  return {
    before: async (request): Promise<void> => {
      const userId = request.event.requestContext.authorizer?.claims.sub
      const clientName = JSON.parse(request.event.body || '{}').clientName
      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'clientNameIndex',
        KeyConditionExpression: 'clientName = :clientName AND userId = :userId',
        ExpressionAttributeValues: {
          ':clientName': clientName,
          ':userId': userId
        }
      })
      const duplicateName = await ddbDocClient.send(command)
      if (duplicateName.Count !== undefined && duplicateName.Count > 0) {
        throw new createError.Conflict('Client name already exists')
      }
    }
  }
}

export default clientNameDuplicationValidator
