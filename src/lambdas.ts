import {
  funcQueueExecutor,
  logRequestInfo,
  addTraceInfoToResponseBody,
  transformResponseToHttpResponse,
} from './utils';
import { Middleware, PlainObject, HttpResponse } from './types';
import { HttpError, buildResponseObject, internalError } from './httpResponse';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from 'aws-lambda';

export const lambdas = (
  middlewares: Middleware[] = [],
  config?: {
    addTraceInfoToResponse?: boolean;
    logRequestInfo?: boolean;
  }
) => {
  const wrapperHandler: Handler<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  > = async (event, context) => {
    let isErrorResponse = false;
    let response: HttpError | PlainObject | HttpResponse = internalError({
      body: {
        error: 'Response not set',
      },
    });

    try {
      response = await funcQueueExecutor({
        event,
        context,
        middlewares,
      });
    } catch (error) {
      console.error(error);
      response = error;
      isErrorResponse = true;
    } finally {
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

      return buildResponseObject({
        ...response,
        shouldStringifyBody: true,
      });
    }
  };

  return wrapperHandler;
};
