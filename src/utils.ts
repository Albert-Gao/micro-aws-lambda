import { HttpResponse, Middleware, PlainObject } from './types';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
  HttpError,
  isHttpError,
  isHttpResponse,
  buildResponseObject,
} from './httpResponse';

export const funcQueueExecutor = async ({
  event,
  context,
  lambda,
  beforeHooks = [],
  afterHooks = [],
}: {
  event: APIGatewayProxyEvent;
  context: Context;
  lambda: Middleware;
  beforeHooks?: Middleware[];
  afterHooks?: Middleware[];
}) => {
  let returnValue: PlainObject = {};

  const chain = [...beforeHooks, lambda, ...afterHooks];
  let passDownObj = {};

  for (let i = 0; i <= chain.length - 1; i += 1) {
    const result = (await chain[i]({
      event,
      context,
      passDownObj,
      response: returnValue,
    })) as PlainObject;

    if (result != null) {
      returnValue = result;
    }
  }

  return returnValue;
};

export const createTraceInfo = (
  event: APIGatewayProxyEvent,
  context: Context
) => ({
  endpoint:
    event.requestContext?.domainName ?? '' + event.requestContext?.path ?? '',
  requestBody: event.body || '',
  requestMethod: event.requestContext?.httpMethod ?? '',

  country: event.headers?.['CloudFront-Viewer-Country'] ?? '',
  lambdaRequestId: context.awsRequestId ?? '',
  logStreamName: context.logStreamName ?? '',
  logGroupName: context.logGroupName ?? '',
  apiGatewayId: event.requestContext?.requestId ?? '',
});

export const addTraceInfoToResponseBody = (
  responseBody: string | number | boolean | any[] | object,
  event: APIGatewayProxyEvent,
  context: Context
):
  | {
      response: any;
      debug: ReturnType<typeof createTraceInfo>;
    }
  | (PlainObject & { debug: ReturnType<typeof createTraceInfo> }) => {
  const traceInfo = createTraceInfo(event, context);

  if (
    typeof responseBody === 'string' ||
    typeof responseBody === 'number' ||
    typeof responseBody === 'boolean' ||
    Array.isArray(responseBody)
  ) {
    return {
      response: responseBody,
      debug: traceInfo,
    };
  }

  return {
    ...responseBody,
    debug: traceInfo,
  };
};

export const logRequestInfo = (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  console.log(
    'Aws-Api-Gateway-Request-Id: ',
    event.requestContext?.requestId ?? ''
  );
  console.log(
    'Identity-Source-Ip: ',
    event.requestContext?.identity?.sourceIp ?? ''
  );
  console.log('EVENT: ', event);
  console.log('CONTEXT: ', context);
};

export const transformResponseToHttpResponse = (
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
