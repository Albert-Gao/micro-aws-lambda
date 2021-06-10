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

export const success = <BodyType>(
  httpBody: BodyType,
  {
    statusCode,
    headers,
  }: { statusCode?: number; headers?: APIGatewayProxyResult['headers'] } = {}
) =>
  buildResponseObject({
    statusCode: statusCode || 200,
    headers,
    body: httpBody,
    shouldStringifyBody: false,
  });

function generateErrorResponseWrapper(defaultStatusCode: number) {
  const helper = <BodyType>(
    httpBody: BodyType,
    {
      statusCode = defaultStatusCode,
      headers,
    }: { statusCode?: number; headers?: APIGatewayProxyResult['headers'] } = {}
  ) =>
    new HttpError({
      statusCode: statusCode,
      headers,
      body: httpBody,
    });

  return helper;
}

export const HttpResponse = {
  error: httpError,
  response: httpResponse,

  /** StatusCode 200 */
  success,

  /** StatusCode 400 */
  badRequest: generateErrorResponseWrapper(400),

  /** StatusCode 401 */
  unauthorized: generateErrorResponseWrapper(401),

  /** StatusCode 403 */
  forbidden: generateErrorResponseWrapper(403),

  /** StatusCode 404 */
  notFound: generateErrorResponseWrapper(404),

  /** StatusCode 405 */
  methodNotAllowed: generateErrorResponseWrapper(405),

  /** StatusCode 406 */
  notAcceptable: generateErrorResponseWrapper(406),

  /** StatusCode 409 */
  conflict: generateErrorResponseWrapper(409),

  /** StatusCode 500 */
  internalError: generateErrorResponseWrapper(500),

  /** StatusCode 501 */
  notImplemented: generateErrorResponseWrapper(501),

  /** StatusCode 502 */
  badGateway: generateErrorResponseWrapper(502),

  /** StatusCode 503 */
  serviceUnavailable: generateErrorResponseWrapper(503),

  /** StatusCode 504 */
  gatewayTimeout: generateErrorResponseWrapper(504),

  /** StatusCode 511 */
  networkAuthenticationRequire: generateErrorResponseWrapper(511),
} as const;
