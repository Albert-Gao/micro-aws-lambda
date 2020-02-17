import {
  funcQueueExecutor,
  logRequestInfo,
  addTraceInfoToResponseBody,
  transformResponseToHttpResponse,
} from './utils';
import { Middleware, LambdaHandler, PlainObject, HttpResponse } from './types';
import { HttpError, buildResponseObject, internalError } from './httpResponse';

export const lambdaWrapper = ({
  handler,
  beforeHooks,
  afterHooks,
  config,
}: {
  handler: Middleware;
  beforeHooks?: Middleware[];
  afterHooks?: Middleware[];
  config?: {
    addTraceInfoToResponse?: boolean;
    logRequestInfo?: boolean;
  };
}) => {
  // @ts-ignore
  const wrapperHandler: LambdaHandler = async (event, context, callback) => {
    let response: HttpError | PlainObject | HttpResponse = internalError({
      body: {
        error: 'Response not set',
      },
    });

    try {
      response = await funcQueueExecutor({
        event,
        context,
        beforeHooks,
        handler,
        afterHooks,
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
