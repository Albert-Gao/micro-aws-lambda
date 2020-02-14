import { APIGatewayProxyResult } from 'aws-lambda';
import { PlainObject, HttpResponse } from './types';

interface HttpResponseParams extends Omit<APIGatewayProxyResult, 'body'> {
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
    statusCode = 400,
    headers,
    body,
    multiValueHeaders,
    isBase64Encoded,
  }: HttpResponse) {
    super(JSON.stringify(body));
    Object.setPrototypeOf(this, HttpError.prototype);

    this.statusCode = statusCode;
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
  statusCode = 400,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>) =>
  new HttpError({
    statusCode,
    body,
    headers: getMergedHeaders(headers),
    multiValueHeaders,
    isBase64Encoded,
  });

export function buildResponseObject<T extends true | false>({
  statusCode = 200,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
  shouldStringifyBody,
}: Partial<HttpResponseParams> & {
  shouldStringifyBody?: T;
}): T extends true ? APIGatewayProxyResult : HttpResponse {
  const result: any = {
    statusCode,
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
  statusCode = 200,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>): HttpResponse =>
  buildResponseObject({
    statusCode,
    body,
    headers,
    multiValueHeaders,
    isBase64Encoded,
    shouldStringifyBody: false,
  });

export const success = ({
  statusCode = 200,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>): HttpResponse =>
  buildResponseObject({
    statusCode,
    headers: getMergedHeaders(headers),
    body,
    multiValueHeaders,
    isBase64Encoded,
    shouldStringifyBody: false,
  });

export const badRequest = ({
  statusCode = 400,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>) =>
  new HttpError({
    statusCode,
    body,
    headers,
    multiValueHeaders,
    isBase64Encoded,
  });

export const internalError = ({
  statusCode = 500,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams>) =>
  new HttpError({
    statusCode,
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
