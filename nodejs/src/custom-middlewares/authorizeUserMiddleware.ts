import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import createError from 'http-errors'

const authorizeUserMiddleware = (): middy.MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => {
  return {
    before: async (request): Promise<void> => {
      const userId = process.env.userId
        ? process.env.userId
        : request.event.requestContext.authorizer?.claims.sub
      if (userId === undefined) {
        throw new createError.Unauthorized()
      }
      if (!request.event.requestContext.authorizer?.claims.sub) {
        request.event.requestContext.authorizer = { claims: { sub: userId } } // it means  that userId is coming from the environment variable (local development)
      }
    }
  }
}

export default authorizeUserMiddleware
