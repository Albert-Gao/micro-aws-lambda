import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { createTraceInfo } from './utils';

export interface PlainObject {
  [key: string]: string | number | boolean | object;
}

export interface HttpResponse extends Omit<APIGatewayProxyResult, 'body'> {
  body: PlainObject & {
    debug?: ReturnType<typeof createTraceInfo>;
  };
}

export type Middleware<PassDownObjType = any, ReturnValueType = any> = ({
  event,
  context,
  passDownObj,
}: {
  event: APIGatewayProxyEvent;
  context: Context;
  passDownObj: PassDownObjType;
  readonly response?: any;
}) => ReturnValueType;
