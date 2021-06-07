import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { createTraceInfo } from './utils';

export type IHttpResponse<ResponseDataType = any> = Omit<
  APIGatewayProxyResultV2<ResponseDataType>,
  'body'
> & {
  body: ResponseDataType & {
    debug?: ReturnType<typeof createTraceInfo>;
  };
};

export type Middleware<Shared = any, ResponseDataType = any> = ({
  event,
  context,
  shared,
}: {
  event: APIGatewayProxyEventV2;
  context: Context;
  shared: Shared;
}) =>
  | IHttpResponse<ResponseDataType>
  | Promise<ResponseDataType | null | undefined | void | Error>
  | ResponseDataType
  | null
  | undefined
  | void
  | Error;

export type IHttpResponseLegacy<ResponseDataType = any> = Omit<
  APIGatewayProxyResult,
  'body'
> & {
  body: ResponseDataType & {
    debug?: ReturnType<typeof createTraceInfo>;
  };
};

export type MiddlewareLegacy<Shared = any, ResponseDataType = any> = ({
  event,
  context,
  shared,
}: {
  event: APIGatewayProxyEvent;
  context: Context;
  shared: Shared;
}) =>
  | IHttpResponseLegacy<ResponseDataType>
  | Promise<ResponseDataType | null | undefined | void | Error>
  | ResponseDataType
  | null
  | undefined
  | void
  | Error;
