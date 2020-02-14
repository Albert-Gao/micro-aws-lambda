import {
  APIGatewayProxyEvent,
  Context,
  Handler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { HttpError } from './httpResponse';
import { createTraceInfo } from './utils';

export interface PlainObject {
  [key: string]: string | number | PlainObject | boolean;
}

export interface HttpResponse extends Omit<APIGatewayProxyResult, 'body'> {
  body: PlainObject & {
    debug?: ReturnType<typeof createTraceInfo>;
  };
}

interface MiddlewareParams {
  event: APIGatewayProxyEvent;
  context: Context;
  passDownObj: PlainObject;
}

export type Middleware = ({
  event,
  context,
  passDownObj,
}: MiddlewareParams) =>
  | string
  | number
  | boolean
  | PlainObject
  | APIGatewayProxyResult
  | Promise<PlainObject | APIGatewayProxyResult>
  | HttpError
  | HttpResponse
  | void;

export interface LambdaWrapperParams {
  handler: Middleware;
  beforeHooks?: Middleware[];
  afterHooks?: Middleware[];
  config?: {
    addTraceInfoToResponse?: boolean;
    logRequestInfo?: boolean;
  };
}

export type LambdaHandler = Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
>;
