import {
  funcQueueExecutor,
  logRequestInfo,
  addTraceInfoToResponseBody,
} from './utils';
import {
  LambdaWrapperParams,
  LambdaHandler,
  PlainObject,
  HttpResponse,
} from 'types';
import {
  isHttpResponse,
  isHttpError,
  HttpError,
  buildResponseObject,
  internalError,
} from './httpResponse';

const transformResponseToHttpResponse = (
  response: HttpError | PlainObject | HttpResponse
): HttpResponse => {
  let result = response;

  if (isHttpError(response)) {
    result = response.toHttpResponse();
  } else if (!isHttpResponse(response)) {
    result = buildResponseObject({
      statusCode: 200,
      body: response,
      shouldStringifyBody: false,
    });
  }

  return result as HttpResponse;
};

export const lambdaWrapper = ({
  handler,
  beforeHooks,
  afterHooks,
  config,
}: LambdaWrapperParams) => {
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
