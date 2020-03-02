import { APIGatewayProxyResult } from 'aws-lambda';
import { PlainObject, HttpResponse } from './types';

interface HttpResponseParams
  extends Omit<APIGatewayProxyResult, 'body' | 'statusCode'> {
  statusCode?: number;
  body: any;
}

const commonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json',
};

const getMergedHeaders = (headers?: APIGatewayProxyResult['headers']) =>
  headers
    ? {
        ...commonHeaders,
        ...headers,
      }
    : commonHeaders;

export class HttpError extends Error {
  statusCode: number;
  headers = commonHeaders;
  body: PlainObject;
  multiValueHeaders: APIGatewayProxyResult['multiValueHeaders'];
  isBase64Encoded: APIGatewayProxyResult['isBase64Encoded'];

  constructor({
    statusCode,
    headers,
    body,
    multiValueHeaders,
    isBase64Encoded,
  }: HttpResponseParams) {
    super(JSON.stringify(body));
    Object.setPrototypeOf(this, HttpError.prototype);

    this.statusCode = statusCode || 400;
    this.body = body;

    if (headers) {
      this.headers = getMergedHeaders(headers);
    }

    if (multiValueHeaders) {
      this.multiValueHeaders = multiValueHeaders;
    }

    if (typeof isBase64Encoded === 'boolean') {
      this.isBase64Encoded = isBase64Encoded;
    }
  }

  public toHttpResponse() {
    return buildResponseObject({
      statusCode: this.statusCode,
      body: this.body,
      headers: this.headers,
      multiValueHeaders: this.multiValueHeaders,
      isBase64Encoded: this.isBase64Encoded,
      shouldStringifyBody: false,
    });
  }
}

export const httpError = ({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>) =>
  new HttpError({
    statusCode: statusCode || 400,
    body,
    headers: getMergedHeaders(headers),
    multiValueHeaders,
    isBase64Encoded,
  });

export function buildResponseObject<T extends true | false>({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
  shouldStringifyBody,
}: Partial<HttpResponseParams> & {
  shouldStringifyBody?: T;
}): T extends true ? APIGatewayProxyResult : HttpResponse {
  const result: any = {
    statusCode: statusCode || 200,
    body: body,
    headers: getMergedHeaders(headers),
  };

  if (multiValueHeaders) {
    result.multiValueHeaders = multiValueHeaders;
  }

  if (isBase64Encoded) {
    result.isBase64Encoded = isBase64Encoded;
  }

  if (shouldStringifyBody) {
    if (typeof result.body === 'object' || Array.isArray(result.body)) {
      result.body = JSON.stringify(result.body);
    }
  }

  return result;
}

export const httpResponse = ({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>): HttpResponse =>
  buildResponseObject({
    statusCode: statusCode || 200,
    body,
    headers,
    multiValueHeaders,
    isBase64Encoded,
    shouldStringifyBody: false,
  });

export const success = ({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>): HttpResponse =>
  buildResponseObject({
    statusCode: statusCode || 200,
    headers: getMergedHeaders(headers),
    body,
    multiValueHeaders,
    isBase64Encoded,
    shouldStringifyBody: false,
  });

export const badRequest = ({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>) =>
  new HttpError({
    statusCode: statusCode || 400,
    body,
    headers,
    multiValueHeaders,
    isBase64Encoded,
  });

export const internalError = ({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>) =>
  new HttpError({
    statusCode: statusCode || 500,
    body,
    headers,
    multiValueHeaders,
    isBase64Encoded,
  });

export const isHttpResponse = (
  response: any
): response is APIGatewayProxyResult =>
  typeof response === 'object' &&
  'statusCode' in response &&
  'headers' in response &&
  'body' in response;

export const isHttpError = (value: any): value is HttpError =>
  value instanceof Error &&
  'toHttpResponse' in value &&
  typeof (value as HttpError).toHttpResponse === 'function';
