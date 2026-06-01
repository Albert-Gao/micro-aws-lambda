import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { createTraceInfo } from './utils';

type MaybePromise<T> = T | Promise<T>;

export type IHttpResponseLegacy<ResponseDataType = any> = Omit<
  APIGatewayProxyResult,
  'body'
> & {
  body: ResponseDataType & {
    debug?: ReturnType<typeof createTraceInfo>;
  };
};

export type IHttpResponseV2<ResponseDataType = any> = Omit<
  APIGatewayProxyStructuredResultV2,
  'body'
> & {
  body: ResponseDataType & {
    debug?: ReturnType<typeof createTraceInfo>;
  };
};

export type IHttpResponse<ResponseDataType = any> = IHttpResponseLegacy<
  ResponseDataType
>;

type SupportedApiGatewayEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;

type HttpResponseForEvent<
  Event extends SupportedApiGatewayEvent,
  ResponseDataType
> = Event extends APIGatewayProxyEventV2
  ? IHttpResponseV2<ResponseDataType>
  : IHttpResponseLegacy<ResponseDataType>;

type MiddlewareResult<
  Event extends SupportedApiGatewayEvent,
  ResponseDataType
> =
  | HttpResponseForEvent<Event, ResponseDataType>
  | ResponseDataType
  | null
  | undefined
  | void
  | Error;

export type Middleware<
  Shared = any,
  ResponseDataType = any,
  Event extends SupportedApiGatewayEvent = APIGatewayProxyEvent
> = ({
  event,
  context,
  shared,
}: {
  event: Event;
  context: Context;
  shared: Shared;
}) => MaybePromise<MiddlewareResult<Event, ResponseDataType>>;

export type MiddlewareLegacy<Shared = any, ResponseDataType = any> = Middleware<
  Shared,
  ResponseDataType,
  APIGatewayProxyEvent
>;

export type MiddlewareV2<Shared = any, ResponseDataType = any> = Middleware<
  Shared,
  ResponseDataType,
  APIGatewayProxyEventV2
>;
