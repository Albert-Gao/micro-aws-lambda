import { APIGatewayProxyResult } from 'aws-lambda';
import { IHttpResponseLegacy as IHttpResponse } from './types';

interface HttpResponseParams<BodyType> {
  statusCode?: number;
  body: BodyType;
  multiValueHeaders?: APIGatewayProxyResult['multiValueHeaders'] | undefined;
  isBase64Encoded?: APIGatewayProxyResult['isBase64Encoded'] | undefined;
  headers?: APIGatewayProxyResult['headers'] | undefined;
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
  body: any;
  multiValueHeaders: APIGatewayProxyResult['multiValueHeaders'];
  isBase64Encoded: APIGatewayProxyResult['isBase64Encoded'];

  constructor({
    statusCode,
    headers,
    body,
    multiValueHeaders,
    isBase64Encoded,
  }: HttpResponseParams<any>) {
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
    const response: Parameters<typeof buildResponseObject>[0] = {
      statusCode: this.statusCode,
      body: this.body,
      headers: this.headers,

      shouldStringifyBody: false,
    };

    if (this.multiValueHeaders) {
      response.multiValueHeaders = this.multiValueHeaders;
    }

    if (this.isBase64Encoded) {
      response.isBase64Encoded = this.isBase64Encoded;
    }

    return buildResponseObject(response);
  }
}

export const httpError = <BodyType>({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams<BodyType>>) =>
  new HttpError({
    statusCode: statusCode || 400,
    body,
    headers: getMergedHeaders(headers),
    multiValueHeaders,
    isBase64Encoded,
  });

export function buildResponseObject<T extends true | false, BodyType = any>({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
  shouldStringifyBody,
}: HttpResponseParams<BodyType> & {
  shouldStringifyBody?: T;
}): T extends true ? APIGatewayProxyResult : IHttpResponse {
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

export const httpResponse = <BodyType>({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams<BodyType>>): IHttpResponse =>
  buildResponseObject({
    statusCode: statusCode || 200,
    body,
    headers,
    multiValueHeaders,
    isBase64Encoded,
    shouldStringifyBody: false,
  });

export const success = <BodyType>({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams<BodyType>>): IHttpResponse =>
  buildResponseObject({
    statusCode: statusCode || 200,
    headers: getMergedHeaders(headers),
    body,
    multiValueHeaders,
    isBase64Encoded,
    shouldStringifyBody: false,
  });

export const badRequest = <BodyType>({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams<BodyType>>) =>
  new HttpError({
    statusCode: statusCode || 400,
    body,
    headers,
    multiValueHeaders,
    isBase64Encoded,
  });

export const internalError = <BodyType>({
  statusCode,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: Partial<HttpResponseParams<BodyType>>) =>
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

export const HttpResponse = {
  error: httpError,
  response: httpResponse,
  success,
  badRequest,
  internalError,
} as const;
