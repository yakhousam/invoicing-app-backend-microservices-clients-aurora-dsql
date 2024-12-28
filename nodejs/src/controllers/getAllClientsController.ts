import { ddbDocClient, tableName } from '@/db/client'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

const getAllClientsController = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.jwt.claims.sub as string

  let lastEvaluatedKey: Record<string, unknown> | undefined = undefined
  const clients: Record<string, unknown>[] = []

  do {
    const command: QueryCommand = new QueryCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })
    const data = await ddbDocClient.send(command)
    if (data.Items) {
      clients.push(...data.Items)
    }
    lastEvaluatedKey = data.LastEvaluatedKey
  } while (lastEvaluatedKey)

  const response = {
    clients,
    count: clients.length
  }
  return {
    statusCode: 200,
    body: JSON.stringify(response)
  }
}

export default getAllClientsController
