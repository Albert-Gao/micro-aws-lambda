import { Middleware, PlainObject } from 'types';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { types } from 'util';
import { HttpError } from 'httpResponse';

export const funcQueueExecutor = async (
  event: APIGatewayProxyEvent,
  context: Context,
  beforeHooks: Middleware[],
  handler: Middleware,
  afterHooks: Middleware[]
) => {
  let returnValue: PlainObject = {};

  const allFuncs = [...beforeHooks, handler, ...afterHooks];
  const startIndex = 0;
  const endIndex = allFuncs.length - 1;
  let passDownObj = {};
  let isExit = false;

  const exit = (value: PlainObject | null = null) => {
    isExit = true;
    return value;
  };

  for (let i = startIndex; i <= endIndex; i += 1) {
    const isAsyncFunc = types.isAsyncFunction(allFuncs[i]);

    const result = (isAsyncFunc
      ? await allFuncs[i]({
          event,
          context,
          exit,
          passDownObj,
        })
      : allFuncs[i]({
          event,
          context,
          exit,
          passDownObj,
        })) as PlainObject | null;

    if (isExit && result) {
      returnValue = result;
      break;
    }

    if (result) {
      returnValue = result;
    }
  }

  return returnValue;
};

export const createTraceInfo = (
  event: APIGatewayProxyEvent,
  context: Context
) => ({
  debug: {
    endpoint: event.requestContext.domainName + event.requestContext.path,
    requestBody: event.body || '',
    requestMethod: event.requestContext.httpMethod,

    country: event.headers['CloudFront-Viewer-Country'],
    lambdaRequestId: context.awsRequestId,
    logStreamName: context.logStreamName,
    logGroupName: context.logGroupName,
    apiGatewayId: event.requestContext.requestId,
  },
});

export const addTraceInfoToJsonString = (
  responseBodyString: string,
  event: APIGatewayProxyEvent,
  context: Context
) => {
  const body = JSON.parse(responseBodyString);

  if (Array.isArray(body)) {
    return JSON.stringify({
      response: body,
      debug: createTraceInfo(event, context).debug,
    });
  }

  body.debug = createTraceInfo(event, context).debug;
  return JSON.stringify(body);
};

export const addExtraInfoToError = (
  event: APIGatewayProxyEvent,
  context: Context,
  error: HttpError
) => {
  const traceInfo = createTraceInfo(event, context);
  const isHttpError = error.setBody && typeof error.setBody === 'function';

  if (isHttpError) {
    error.setBody(traceInfo);
    return;
  }

  (error as Error) = {
    ...error,
    ...traceInfo,
  };
};

export const logRequestInfo = (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  console.log('EVENT: ', event);
  console.log('CONTEXT: ', context);
  console.log('Aws-Api-Gateway-Request-Id: ', event.requestContext.requestId);
  console.log('Identity-Source-Ip: ', event.requestContext.identity.sourceIp);
};
