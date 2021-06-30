import {
  funcQueueExecutor,
  logRequestInfo,
  addTraceInfoToResponseBody,
  transformResponseToHttpResponse,
} from './utils';
import { Middleware, IHttpResponse } from './types';
import {
  HttpResponse,
  HttpError,
  buildResponseObject,
  httpError,
} from './httpResponse';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from 'aws-lambda';

const { internalError } = HttpResponse;

export function lambdas<ResponseDataType = any, Shared = any>(
  middlewares: Middleware<ResponseDataType, Shared>[] = [],
  config?: {
    addTraceInfoToResponse?: boolean;
    logRequestInfo?: boolean;
  }
) {
  const wrapperHandler: Handler<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  > = async (event, context) => {
    let isErrorResponse = false;
    let response: HttpError | IHttpResponse = internalError({
      body: {
        error: 'Response not set',
      },
    });

    try {
      // @ts-ignore
      response = await funcQueueExecutor<ResponseDataType, Shared>({
        event,
        context,
        middlewares,
      });
    } catch (error) {
      console.log('uncaught error', error);
      response = error as HttpError;
      isErrorResponse = true;
    } finally {
      const isJsError =
        response instanceof Error && typeof response.statusCode != 'number';
      if (isJsError) {
        console.log('processed js error', response);

        return httpError({
          statusCode: 500,
          body: JSON.stringify({
            // @ts-ignore
            errorName: response.name,
            // @ts-ignore
            message: response.message,
          }),
        });
      }

      response = transformResponseToHttpResponse(response, isErrorResponse);

      if (config?.logRequestInfo) {
        logRequestInfo(event, context);
      }

      if (config?.addTraceInfoToResponse) {
        response.body = addTraceInfoToResponseBody(
          response.body,
          event,
          context
        );
      }

      const result = buildResponseObject({
        ...response,
      });

      if (typeof result.body === 'object') {
        result.body = JSON.stringify(result.body);
      }

      return result;
    }
  };

  return wrapperHandler;
}
