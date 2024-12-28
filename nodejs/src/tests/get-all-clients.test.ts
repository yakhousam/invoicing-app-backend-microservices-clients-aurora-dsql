import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { Context, type APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import { beforeEach, describe, expect, it } from 'vitest'
import { handler as getAllClientsHandler } from '../../functions/getAllClients'
import { generateClients } from './generate'

describe('Test getAllClients', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  const event = {
    httpMethod: 'GET',
    headers: {
      'cache-control': 'no-cache'
    },
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: 'userId'
          }
        }
      }
    }
  } as unknown as APIGatewayProxyEvent

  const context = {
    getRemainingTimeInMillis: false
  } as unknown as Context

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return all clients', async () => {
    const clients = generateClients(1)

    ddbMock.on(QueryCommand).resolves({
      Items: clients
    })

    const result = await getAllClientsHandler(event, context)

    expect(result.statusCode).toBe(200)
    expect(result.body).toEqual(
      JSON.stringify({ clients, count: clients.length })
    )
  })

  it('should return 500 on DynamoDB error', async () => {
    ddbMock.on(QueryCommand).rejects(new Error('DynamoDB error'))

    const result = await getAllClientsHandler(event, context)

    expect(result.statusCode).toBe(500)
  })
})
