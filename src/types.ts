import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { HttpError } from './httpResponse';
import { createTraceInfo } from './utils';

export interface PlainObject {
  [key: string]: string | number | boolean | object;
}

export interface HttpResponse extends Omit<APIGatewayProxyResult, 'body'> {
  body: PlainObject & {
    debug?: ReturnType<typeof createTraceInfo>;
  };
}

export type Middleware<PassDownObjType = any> = ({
  event,
  context,
  passDownObj,
}: {
  event: APIGatewayProxyEvent;
  context: Context;
  passDownObj: PassDownObjType;
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
