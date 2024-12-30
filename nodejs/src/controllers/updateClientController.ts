import { ddbDocClient, tableName } from '@/db/client'
import {
  createExpressionAttributeValues,
  createUpdateExpression
} from '@/utils'
import { updateClientSchema } from '@/validation'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda'
import createError from 'http-errors'
import { ZodError } from 'zod'

const updateClientController = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.jwt.claims.sub as string
    const clientId = event.pathParameters?.clientId as string

    const updates = updateClientSchema.parse(event.body)

    const updateExpression = createUpdateExpression(updates)
    const expressionAttributeValues = createExpressionAttributeValues(updates)

    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        clientId: clientId,
        userId: userId
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression:
        'attribute_exists(clientId) AND attribute_exists(userId)',
      ReturnValues: 'ALL_NEW'
    })

    const result = await ddbDocClient.send(command)
    console.log('result', result)

    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError.BadRequest(error.message)
    }
    if (error instanceof ConditionalCheckFailedException) {
      throw createError.NotFound('Client not found')
    }
    console.error('Error instance:', error)
    throw error
  }
}

export default updateClientController
