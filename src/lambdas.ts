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
  middlewares: Middleware[],
  config?: {
    addTraceInfoToResponse?: boolean;
    logRequestInfo?: boolean;
  }
) => {
  // @ts-ignore
  const wrapperHandler: Handler<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  > = async (event, context, callback) => {
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
      console.log(error);
      response = error;
    } finally {
      response = transformResponseToHttpResponse(response);

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

      callback(
        null,
        buildResponseObject({
          ...response,
          shouldStringifyBody: true,
        })
      );
    }
  };

  return wrapperHandler;
};
