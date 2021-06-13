import { IHttpResponse, Middleware } from './types';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  Context,
} from 'aws-lambda';
import {
  HttpError,
  isHttpError,
  isHttpResponse,
  buildResponseObject,
} from './httpResponse';

export async function funcQueueExecutor<Shared, ResponseDataType>({
  event,
  context,
  middlewares,
}: {
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2;
  context: Context;
  middlewares: Middleware<Shared, ResponseDataType>[];
}) {
  let returnValue = {};

  let shared = {} as Shared;

  for (let middleware of middlewares) {
    const result = await middleware({
      // @ts-ignore
      event,
      context,
      shared,
    });

    if (result != null) {
      returnValue = result;
      break;
    }
  }

  return returnValue;
}

export const createTraceInfo = (event: any, context: Context) => {
  // @ts-ignore
  if (event.version === '2.0') {
    const typedEvent = event as APIGatewayProxyEventV2;

    return {
      endpoint: typedEvent.requestContext.domainName,
      routeKey: typedEvent.requestContext.routeKey,
      requestBody: typedEvent.body || '',
      requestMethod: typedEvent.requestContext.http.method,
      requestId: event.requestContext.requestId,
    };
  } else {
    const typedEvent = event as APIGatewayProxyEvent;

    return {
      endpoint:
        typedEvent.requestContext.domainName ??
        '' + typedEvent.requestContext.path,
      requestBody: typedEvent.body || '',
      requestMethod: typedEvent.requestContext.httpMethod,

      country: typedEvent.headers['CloudFront-Viewer-Country'] ?? '',
      lambdaRequestId: context.awsRequestId,
      logStreamName: context.logStreamName,
      logGroupName: context.logGroupName,
      apiGatewayId: typedEvent.requestContext.requestId,
    };
  }
};

export const addTraceInfoToResponseBody = (
  responseBody: string | number | boolean | any[] | object,
  event: APIGatewayProxyEvent,
  context: Context
):
  | {
      response: any;
      debug: ReturnType<typeof createTraceInfo>;
    }
  | (object & { debug: ReturnType<typeof createTraceInfo> }) => {
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
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
  context: Context
) => {
  console.log('Aws-Api-Gateway-Request-Id: ', event.requestContext.requestId);
  console.log('EVENT: ', event);
  console.log('CONTEXT: ', context);
};

export const transformResponseToHttpResponse = (
  response: HttpError | IHttpResponse,
  shouldAddErrorStatusCode: boolean
): IHttpResponse => {
  let result = response;

  if (isHttpError(response)) {
    result = response.toHttpResponse();
  } else if (!isHttpResponse(response)) {
    result = buildResponseObject({
      statusCode: shouldAddErrorStatusCode ? 400 : 200,
      body: response,
    });
  }

  // @ts-ignore
  const isStatusCodeSet = typeof response.statusCode === 'number';
  if (isStatusCodeSet) {
    // @ts-ignore
    result.statusCode = response.statusCode as number;
  }

  return result as IHttpResponse;
};
