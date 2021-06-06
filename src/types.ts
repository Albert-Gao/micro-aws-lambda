import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { createTraceInfo } from './utils';

export type IHttpResponse<ResponseDataType = any> = Omit<
  APIGatewayProxyResult,
  'body'
> & {
  body: ResponseDataType & {
    debug?: ReturnType<typeof createTraceInfo>;
  };
};

export type Middleware<ResponseDataType = any, Shared = any> = ({
  event,
  context,
  shared,
}: {
  event: APIGatewayProxyEvent;
  context: Context;
  shared: Shared;
}) => IHttpResponse<ResponseDataType> | ResponseDataType | void | Error;
