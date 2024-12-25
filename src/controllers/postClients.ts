import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda'
import { ZodError } from 'zod'
import { Client, createClientSchema } from '../validation'
import { ddbDocClient, tableName } from '../db/client'

export const postClientController = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`
    )
  }
  try {
    let userId = event.requestContext.authorizer?.claims.sub

    if (process.env.userId) {
      userId = process.env.userId
    }
    console.log('user id kjjdlfsjlkfjslkfjkls', userId)
    const body = JSON.parse(event.body || '{}')

    const validClient = createClientSchema.parse(body)

    const isEmailDuplicated = await checkEmailDuplication(
      validClient.email,
      userId
    )

    if (isEmailDuplicated) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ errors: { email: ['Email already exists'] } })
      }
    }

    const isClientNameUnique = await checkClientNameDuplication(
      validClient.clientName,
      userId
    )

    if (isClientNameUnique) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errors: { name: ['Client name already exists'] }
        })
      }
    }

    const item: Client = {
      ...validClient,
      clientId: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    console.log('item', item)
    const params = {
      TableName: tableName,
      Item: item
    }

    // create a new item in the table
    await ddbDocClient.send(new PutCommand(params))

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    }
  } catch (err: unknown) {
    console.error('Error adding or updating item:', err)
    if (err instanceof ZodError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ errors: err.flatten().fieldErrors })
      }
    }
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(err)
    }
  }
}

async function checkEmailDuplication(
  email: string | undefined,
  userId: string
): Promise<boolean> {
  if (email === undefined) {
    return true
  }
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
    return true
  }
  return false
}

async function checkClientNameDuplication(
  clientName: string,
  userId: string
): Promise<boolean> {
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
    return true
  }
  return false
}
