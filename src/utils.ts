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

type ApiGatewayEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;

const isApiGatewayV2Event = (
  event: ApiGatewayEvent
): event is APIGatewayProxyEventV2 =>
  'version' in event && event.version === '2.0';

type ResponseWithStatusCode = {
  statusCode?: unknown;
};

export async function funcQueueExecutor<
  Shared,
  ResponseDataType,
  Event extends ApiGatewayEvent = APIGatewayProxyEvent
>({
  event,
  context,
  middlewares,
}: {
  event: Event;
  context: Context;
  middlewares: Middleware<Shared, ResponseDataType, Event>[];
}) {
  let returnValue: IHttpResponse<ResponseDataType> | ResponseDataType | {} = {};

  let shared = {} as Shared;

  for (let middleware of middlewares) {
    const result = await middleware({
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

export const createTraceInfo = (event: ApiGatewayEvent, context: Context) => {
  if (isApiGatewayV2Event(event)) {
    return {
      endpoint: event.requestContext.domainName,
      routeKey: event.requestContext.routeKey,
      requestBody: event.body || '',
      requestMethod: event.requestContext.http.method,
      requestId: event.requestContext.requestId,
    };
  } else {
    return {
      endpoint:
        event.requestContext.domainName ?? '' + event.requestContext.path,
      requestBody: event.body || '',
      requestMethod: event.requestContext.httpMethod,

      country: event.headers['CloudFront-Viewer-Country'] ?? '',
      lambdaRequestId: context.awsRequestId,
      logStreamName: context.logStreamName,
      logGroupName: context.logGroupName,
      apiGatewayId: event.requestContext.requestId,
    };
  }
};

export const addTraceInfoToResponseBody = (
  responseBody: string | number | boolean | any[] | object,
  event: ApiGatewayEvent,
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

export const logRequestInfo = (event: ApiGatewayEvent, context: Context) => {
  console.log('Aws-Api-Gateway-Request-Id: ', event.requestContext.requestId);
  console.log('EVENT: ', event);
  console.log('CONTEXT: ', context);
};

export const transformResponseToHttpResponse = (
  response: HttpError | IHttpResponse | unknown,
  shouldAddErrorStatusCode: boolean
): IHttpResponse => {
  let result: HttpError | IHttpResponse | unknown = response;

  if (isHttpError(response)) {
    result = response.toHttpResponse();
  } else if (!isHttpResponse(response)) {
    result = buildResponseObject({
      statusCode: shouldAddErrorStatusCode ? 400 : 200,
      body: response,
    });
  }

  const isStatusCodeSet =
    typeof response === 'object' &&
    response !== null &&
    typeof (response as ResponseWithStatusCode).statusCode === 'number';
  if (isStatusCodeSet) {
    (result as IHttpResponse).statusCode = (response as {
      statusCode: number;
    }).statusCode;
  }

  return result as IHttpResponse;
};
