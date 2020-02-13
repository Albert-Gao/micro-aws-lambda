import {
  APIGatewayProxyEvent,
  Context,
  Handler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { HttpError } from './httpResponse';

type ExitFuncReturnValue = PlainObject | null;

export interface PlainObject {
  [key: string]: string | number | PlainObject | boolean;
}

interface ExitFunc {
  (value: PlainObject | null): ExitFuncReturnValue;
}

interface MiddlewareParams {
  event: APIGatewayProxyEvent;
  context: Context;
  exit: ExitFunc;
  passDownObj: object;
}

export type Middleware = ({
  event,
  context,
  exit,
  passDownObj,
}: MiddlewareParams) =>
  | PlainObject
  | APIGatewayProxyResult
  | Promise<PlainObject | APIGatewayProxyResult>
  | ExitFuncReturnValue
  | HttpError;

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
