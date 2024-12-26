import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda'

import middy from '@middy/core'
import httpContentEncodingMiddleware from '@middy/http-content-encoding'
import httpErrorHandlerMiddleware from '@middy/http-error-handler'
import httpEventNormalizerMiddleware from '@middy/http-event-normalizer'
import httpHeaderNormalizerMiddleware from '@middy/http-header-normalizer'
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser'
import httpSecurityHeadersMiddleware from '@middy/http-security-headers'
import errorLogger from '@middy/error-logger'

import postClientController from '../src/controllers/postClientController'
import clientNameDuplicationMiddleware from '../src/custom-middlewares/clientNameDuplicationMiddleware'
import emailDuplicationMiddleware from '../src/custom-middlewares/emailDuplicationMiddleware'
import validatePostClientBodyMiddleware from '../src/custom-middlewares/validatePostClientBodyMiddleware'
import authorizeUserMiddleware from '../src/custom-middlewares/authorizeUserMiddleware'

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
  .use(httpContentEncodingMiddleware())
  .use(authorizeUserMiddleware())
  .use(validatePostClientBodyMiddleware())
  .use(emailDuplicationMiddleware())
  .use(clientNameDuplicationMiddleware())
  .use(httpErrorHandlerMiddleware())
  .use(errorLogger())
  .handler(postClientHandler)
