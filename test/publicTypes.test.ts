import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyHandler,
} from 'aws-lambda';
import {
  HttpResponse,
  IHttpResponse,
  IHttpResponseLegacy,
  IHttpResponseV2,
  lambdas,
  Middleware,
  MiddlewareLegacy,
  MiddlewareV2,
} from '../src';

interface Shared {
  user: { id: string; group: string };
}

interface Response {
  isPassing: boolean;
}

const extractUserFromEvent: Middleware<Shared, Response> = async ({
  event,
  shared,
}) => {
  const user = JSON.parse(event.body || '{}');

  if (!user) {
    throw HttpResponse.badRequest({ isPassing: false });
  }

  shared.user = user;
};

const parseUserData: Middleware<Shared, Response> = ({ shared }) => {
  if (shared.user.id === 'bad-user-id') {
    throw HttpResponse.badRequest({ isPassing: false });
  }

  return HttpResponse.success({ isPassing: true });
};

const legacyMiddleware: MiddlewareLegacy<Shared, Response> = ({ event }) => {
  const method: APIGatewayProxyEvent['httpMethod'] =
    event.requestContext.httpMethod;

  return { isPassing: method.length > 0 };
};

const httpApiV2Middleware: MiddlewareV2<Shared, Response> = ({ event }) => {
  const method: APIGatewayProxyEventV2['requestContext']['http']['method'] =
    event.requestContext.http.method;

  return { isPassing: method.length > 0 };
};

test('README-style middleware types compile', () => {
  const handler: APIGatewayProxyHandler = lambdas<Response, Shared>([
    extractUserFromEvent,
    parseUserData,
    legacyMiddleware,
  ]);

  const response: IHttpResponse<Response> = HttpResponse.success({
    isPassing: true,
  });
  const legacyResponse: IHttpResponseLegacy<Response> = response;
  const v2Response: IHttpResponseV2<Response> = {
    statusCode: 200,
    body: { isPassing: true },
  };

  expect(typeof handler).toBe('function');
  expect(legacyResponse.statusCode).toBe(200);
  expect(v2Response.body.isPassing).toBe(true);
  expect(httpApiV2Middleware).toBeDefined();
});
