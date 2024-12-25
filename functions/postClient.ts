import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda'

import middy from '@middy/core'
import httpErrorHandlerMiddleware from '@middy/http-error-handler'
import httpContentEncodingMiddleware from '@middy/http-content-encoding'
import httpCorsMiddleware from '@middy/http-cors'
import httpEventNormalizerMiddleware from '@middy/http-event-normalizer'
import httpHeaderNormalizerMiddleware from '@middy/http-header-normalizer'
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser'
import httpSecurityHeadersMiddleware from '@middy/http-security-headers'
import postClientController from '../src/controllers/postClients'
import clientNameDuplicationValidator from '../src/custom-middlewares/clientNameDuplicationValidator'
import emailDuplicationValidator from '../src/custom-middlewares/emailDuplicationValidator'
import validatePostClientBody from '../src/custom-middlewares/validatePostClientBody'
import validateUserMiddleware from '../src/custom-middlewares/validateUser'
import errorLogger from '@middy/error-logger'

const postClientHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await postClientController(event)
}

export const handler = middy({
  timeoutEarlyResponse: () => {
    return {
      statusCode: 408
    }
  }
})
  .use(httpEventNormalizerMiddleware())
  .use(httpHeaderNormalizerMiddleware())
  .use(httpJsonBodyParserMiddleware())
  .use(httpSecurityHeadersMiddleware())
  .use(
    httpCorsMiddleware({
      origin: '*',
      credentials: true,
      methods: 'POST'
    })
  )
  .use(httpContentEncodingMiddleware())
  .use(validateUserMiddleware())
  .use(validatePostClientBody())
  .use(emailDuplicationValidator())
  .use(clientNameDuplicationValidator())
  .use(httpErrorHandlerMiddleware())
  .use(errorLogger())
  .handler(postClientHandler)
