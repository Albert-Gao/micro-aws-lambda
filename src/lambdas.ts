import {
  funcQueueExecutor,
  logRequestInfo,
  addTraceInfoToResponseBody,
  transformResponseToHttpResponse,
} from './utils';
import { Middleware } from './types';
import { HttpResponse, buildResponseObject, httpError } from './httpResponse';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from 'aws-lambda';

const { internalError } = HttpResponse;

type ResponseStatus = {
  statusCode?: unknown;
};

export function lambdas<ResponseDataType = any, Shared = any>(
  middlewares: Middleware<Shared, ResponseDataType>[] = [],
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
    let response: unknown = internalError({
      body: {
        error: 'Response not set',
      },
    });

    try {
      response = await funcQueueExecutor<Shared, ResponseDataType>({
        event,
        context,
        middlewares,
      });
    } catch (error) {
      console.log('uncaught error', error);
      response = error;
      isErrorResponse = true;
    } finally {
      if (
        response instanceof Error &&
        typeof (response as ResponseStatus).statusCode != 'number'
      ) {
        console.log('processed js error', response);

        response = httpError({
          statusCode: 500,
          body: {
            errorName: response.name,
            message: response.message,
          },
        });
      }

      const httpResponse = transformResponseToHttpResponse(
        response,
        isErrorResponse
      );

      if (config?.logRequestInfo) {
        logRequestInfo(event, context);
      }

      if (config?.addTraceInfoToResponse) {
        httpResponse.body = addTraceInfoToResponseBody(
          httpResponse.body,
          event,
          context
        );
      }

      const result = buildResponseObject({
        ...httpResponse,
      });

      if (typeof result.body !== 'string' && result.body !== undefined) {
        result.body = JSON.stringify(result.body);
      }

      return result;
    }
  };

  return wrapperHandler;
}
