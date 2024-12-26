import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { Client, createClientSchema } from '../validation'
import { ZodError } from 'zod'
import createError from 'http-errors'

const validatePostClientBodyMiddleware = (): middy.MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => {
  return {
    before: async (request): Promise<void> => {
      try {
        const userId = request.event.requestContext.authorizer?.claims
          .sub as string

        const validClient = createClientSchema.parse(request.event.body)

        const newBody: Client = {
          ...validClient,
          clientId: crypto.randomUUID(),
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        request.event.body = JSON.stringify(newBody)
      } catch (error) {
        if (error instanceof ZodError) {
          throw createError.BadRequest(error.message)
        }
        throw error
      }
    }
  }
}

export default validatePostClientBodyMiddleware
