import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { type APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import { beforeEach, describe, expect, it } from 'vitest'
import { getClientsController } from '../controllers/getAllClients'
import { generateClients } from './generate'

describe('Test getAllClients', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return all clients', async () => {
    const clients = generateClients(1)

    ddbMock.on(QueryCommand).resolves({
      Items: clients
    })

    const event = {
      httpMethod: 'GET',
      requestContext: {
        authorizer: {
          claims: {
            sub: 'userId'
          }
        }
      }
    } as unknown as APIGatewayProxyEvent

    const result = await getClientsController(event)

    const expectedResult = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clients, lastEvaluatedKey: undefined })
    }

    expect(result).toEqual(expectedResult)
  })

  it('should return 500 on DynamoDB error', async () => {
    ddbMock.on(QueryCommand).rejects(new Error('DynamoDB error'))

    const event = {
      httpMethod: 'GET',
      requestContext: {
        authorizer: {
          claims: {
            sub: 'userId'
          }
        }
      }
    } as unknown as APIGatewayProxyEvent

    const result = await getClientsController(event)

    const expectedResult = {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(new Error('DynamoDB error'))
    }

    expect(result).toEqual(expectedResult)
  })

  it('should paginate clients', async () => {
    const clients = generateClients(1)

    ddbMock.on(QueryCommand).resolves({
      Items: clients,
      LastEvaluatedKey: { clientId: clients[0].clientId }
    })

    const event = {
      httpMethod: 'GET',
      queryStringParameters: {
        lastEvaluatedKey: JSON.stringify({ clientId: 'clientId' })
      },
      requestContext: {
        authorizer: {
          claims: {
            sub: 'userId'
          }
        }
      }
    } as unknown as APIGatewayProxyEvent

    const result = await getClientsController(event)

    const expectedResult = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clients,
        lastEvaluatedKey: { clientId: clients[0].clientId }
      })
    }

    expect(result).toEqual(expectedResult)
  })

  it('should return error for invalid lastEvaluatedKey', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: {
        lastEvaluatedKey: 'invalid'
      },
      requestContext: {
        authorizer: {
          claims: {
            sub: 'userId'
          }
        }
      }
    } as unknown as APIGatewayProxyEvent

    const result = await getClientsController(event)

    expect(result.statusCode).toEqual(500)
    expect(result.body).toStrictEqual(
      expect.stringContaining('Invalid JSON format for lastEvaluatedKey')
    )
  })
})
