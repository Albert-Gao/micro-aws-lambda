import { APIGatewayProxyResult } from 'aws-lambda';
import { PlainObject } from 'types';

const commonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json',
};

const getMergedHeaders = (headers?: APIGatewayProxyResult['headers']) =>
  headers
    ? {
        ...headers,
        ...commonHeaders,
      }
    : commonHeaders;

export class HttpError extends Error implements APIGatewayProxyResult {
  statusCode: number;
  headers = commonHeaders;
  body: string;
  multiValueHeaders: APIGatewayProxyResult['multiValueHeaders'];
  isBase64Encoded: APIGatewayProxyResult['isBase64Encoded'];

  constructor({
    statusCode = 400,
    body,
    headers,
    multiValueHeaders,
    isBase64Encoded,
  }: APIGatewayProxyResult) {
    super(JSON.stringify(body));
    this.body = JSON.stringify(body);
    this.statusCode = statusCode;

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

  setBody(obj: PlainObject | null) {
    if (!obj) return;

    const newBody = JSON.parse(this.body);
    Object.keys(obj).forEach(key => {
      newBody[key] = obj[key];
    });
    this.body = JSON.stringify(newBody);
  }
}

export const httpError = ({
  statusCode = 400,
  body,
  headers,
}: APIGatewayProxyResult) =>
  new HttpError({ statusCode, body, headers: getMergedHeaders(headers) });

export const httpResponse = ({
  statusCode = 200,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: APIGatewayProxyResult): APIGatewayProxyResult => ({
  statusCode,
  body: JSON.stringify(body),
  headers: getMergedHeaders(headers),
  multiValueHeaders,
  isBase64Encoded,
});

export const success = ({
  statusCode = 400,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: APIGatewayProxyResult): APIGatewayProxyResult => ({
  statusCode,
  headers: getMergedHeaders(headers),
  body: JSON.stringify(body),
  multiValueHeaders,
  isBase64Encoded,
});

export const badRequest = ({
  statusCode = 400,
  body,
  headers,
  multiValueHeaders,
  isBase64Encoded,
}: APIGatewayProxyResult) =>
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
}: APIGatewayProxyResult) =>
  new HttpError({
    statusCode,
    body,
    headers,
    multiValueHeaders,
    isBase64Encoded,
  });

export const isHttpResponse = (
  response: PlainObject | APIGatewayProxyResult
): response is APIGatewayProxyResult => 'statusCode' in response;
