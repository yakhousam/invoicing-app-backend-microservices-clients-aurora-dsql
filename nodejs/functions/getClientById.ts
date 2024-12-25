import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda'

import { getClientByIdController } from '../src/controllers/getClientById'

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    return await getClientByIdController(event)
  } catch (err: unknown) {
    console.error('postClient error: ', err)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}
