import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { HttpError } from './httpResponse';
import { createTraceInfo } from './utils';

export interface PlainObject {
  [key: string]: string | number | PlainObject | boolean | object;
}

export interface HttpResponse extends Omit<APIGatewayProxyResult, 'body'> {
  body: PlainObject & {
    debug?: ReturnType<typeof createTraceInfo>;
  };
}

export type Middleware = ({
  event,
  context,
  passDownObj,
}: {
  event: APIGatewayProxyEvent;
  context: Context;
  passDownObj: PlainObject;
  readonly response?: any;
}) =>
  | string
  | number
  | boolean
  | PlainObject
  | APIGatewayProxyResult
  | Promise<PlainObject | APIGatewayProxyResult>
  | HttpError
  | HttpResponse
  | void;
