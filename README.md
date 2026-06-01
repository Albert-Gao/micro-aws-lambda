# Micro AWS Lambda

<img src="https://github.com/Albert-Gao/micro-aws-lambda/blob/master/logo.png?raw=true" maxWidth="100%" height="auto" />

<p align="center" style="letter-spacing: 8px;">
  <a href="https://www.npmjs.com/package/micro-aws-lambda" alt="npm package">
    <img src="https://badgen.net/npm/v/micro-aws-lambda?icon=npm" />
  </a>
  <a href="https://github.com/Albert-Gao/micro-aws-lambda" alt="last commit">
    <img src="https://badgen.net/github/last-commit/albert-gao/micro-aws-lambda" />
  </a>
  <a href="https://github.com/Albert-Gao/micro-aws-lambda/blob/master/LICENSE" alt="license">
    <img src="https://badgen.net/npm/license/micro-aws-lambda" />
  </a>
  <a href="https://www.npmjs.com/package/micro-aws-lambda" alt="types">
    <img src="https://badgen.net/npm/types/micro-aws-lambda" />
  </a>
</p>

`micro-aws-lambda` is a small TypeScript middleware wrapper for AWS Lambda
handlers behind API Gateway. It runs middleware functions one by one, stops on
the first returned value or thrown error, and converts the result into an API
Gateway-compatible HTTP response.

## Features

- API Gateway proxy responses with JSON headers and CORS defaults.
- Sequential middleware flow with early exit by `return` or `throw`.
- A shared object for passing state between middleware functions in one request.
- Response helpers for success, custom responses, and common HTTP errors.
- Optional request logging and trace information in response bodies.
- Zero runtime dependencies.

## Install

```sh
npm install micro-aws-lambda
```

## Quick Start

```typescript
import { lambdas } from 'micro-aws-lambda';

export const handler = lambdas([
  () => ({ message: 'it works' }),
]);
```

The value returned by the middleware becomes a `200` response. Object and array
bodies are JSON stringified before the Lambda handler returns.

## API Gateway v1 and v2

The runtime path accepts both API Gateway REST API proxy events (`version:
'1.0'`, commonly called v1) and HTTP API proxy events (`version: '2.0'`,
commonly called v2). Trace information is generated differently for each event
shape.

The default `Middleware` type matches the REST API/Lambda Proxy handler returned
by `lambdas`. You can also import `MiddlewareLegacy` for the same v1 event
shape, or `MiddlewareV2` when you are writing reusable middleware that reads HTTP
API v2 event fields.

```typescript
import { lambdas, Middleware } from 'micro-aws-lambda';

const readV1Method: Middleware = ({ event }) => ({
  method: event.httpMethod,
  path: event.path,
});

export const handler = lambdas([readV1Method]);
```

For v2 HTTP API middleware, use `MiddlewareV2`:

```typescript
import { MiddlewareV2 } from 'micro-aws-lambda';

export const readV2Route: MiddlewareV2 = ({ event }) => ({
  method: event.requestContext.http.method,
  routeKey: event.requestContext.routeKey,
});
```

## Middleware Flow

Each middleware receives `{ event, context, shared }`.

```typescript
import { lambdas, Middleware } from 'micro-aws-lambda';

type Shared = {
  user?: { id: string; group: string };
};

type ResponseBody = {
  isPassing: boolean;
};

const extractUser: Middleware<Shared, ResponseBody> = ({ event, shared }) => {
  if (!event.body) {
    return { isPassing: false };
  }

  shared.user = JSON.parse(event.body);
};

const authorizeUser: Middleware<Shared, ResponseBody> = ({ shared }) => {
  if (shared.user?.id === 'blocked-user') {
    return { isPassing: false };
  }

  return { isPassing: true };
};

export const handler = lambdas([extractUser, authorizeUser]);
```

Flow rules:

- Middleware functions run in array order.
- Returning any value other than `null` or `undefined` stops the chain.
- Throwing any value stops the chain and treats the value as an error response.
- Returning `null`, `undefined`, or nothing continues to the next middleware.
- If no middleware returns a value, the response body is `{}`.
- The `shared` object is created per invocation and reused across the chain.

## Response Helpers

Use `HttpResponse` when you need explicit status codes, headers,
`multiValueHeaders`, or `isBase64Encoded`.

```typescript
import { HttpResponse, lambdas, Middleware } from 'micro-aws-lambda';

const createUser: Middleware = () => {
  return HttpResponse.success(
    { id: 'user-123' },
    {
      statusCode: 201,
      headers: { 'X-Request-Source': 'signup' },
    }
  );
};

export const handler = lambdas([createUser]);
```

Available helpers:

- `HttpResponse.response({ statusCode, body, headers })`
- `HttpResponse.success(body, { statusCode, headers })`
- `HttpResponse.error({ statusCode, body, headers })`
- `HttpResponse.badRequest(body, options)`
- `HttpResponse.unauthorized(body, options)`
- `HttpResponse.forbidden(body, options)`
- `HttpResponse.notFound(body, options)`
- `HttpResponse.methodNotAllowed(body, options)`
- `HttpResponse.notAcceptable(body, options)`
- `HttpResponse.conflict(body, options)`
- `HttpResponse.internalError(body, options)`
- `HttpResponse.notImplemented(body, options)`
- `HttpResponse.badGateway(body, options)`
- `HttpResponse.serviceUnavailable(body, options)`
- `HttpResponse.gatewayTimeout(body, options)`
- `HttpResponse.networkAuthenticationRequire(body, options)`

Every response helper includes these default headers:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Content-Type": "application/json"
}
```

Custom headers are merged over the defaults.

## Error Defaults

Thrown values are normalized into HTTP responses.

- Throwing `HttpResponse.badRequest(...)` or another `HttpResponse` error helper
  uses that helper's status code.
- Throwing a plain object, string, number, boolean, or array becomes a `400`
  response.
- Throwing a JavaScript `Error` becomes a `500` response with `errorName` and
  `message` in the JSON body.
- Returning a plain object, string, number, boolean, or array becomes a `200`
  response.
- A plain returned or thrown value with a numeric `statusCode` property keeps
  that status code.

```typescript
import { HttpResponse, lambdas, Middleware } from 'micro-aws-lambda';

const requireBody: Middleware = ({ event }) => {
  if (!event.body) {
    throw HttpResponse.badRequest({ error: 'Missing request body' });
  }
};

const finish: Middleware = () => ({ ok: true });

export const handler = lambdas([requireBody, finish]);
```

## Logging

Pass `logRequestInfo: true` to log request details with `console.log`.

```typescript
import { lambdas } from 'micro-aws-lambda';

export const handler = lambdas(
  [() => ({ ok: true })],
  { logRequestInfo: true }
);
```

The logger prints:

- `Aws-Api-Gateway-Request-Id`
- `EVENT`
- `CONTEXT`

## Trace Information

Pass `addTraceInfoToResponse: true` to add a `debug` object to the response
body.

```typescript
import { lambdas } from 'micro-aws-lambda';

export const handler = lambdas(
  [() => ({ ok: true })],
  { addTraceInfoToResponse: true }
);
```

For object response bodies, `debug` is added alongside the existing fields. For
primitive or array response bodies, the original value is wrapped as
`{ response, debug }`.

For v1 events, trace information includes:

- `endpoint`
- `requestBody`
- `requestMethod`
- `country`
- `lambdaRequestId`
- `logStreamName`
- `logGroupName`
- `apiGatewayId`

For v2 events, trace information includes:

- `endpoint`
- `routeKey`
- `requestBody`
- `requestMethod`
- `requestId`

## Migration Notes

When migrating from older versions:

- `passDownObj` was renamed to `shared`.
- Returning a non-null value now stops execution, the same as throwing.
- HTTP helpers are available from the exported `HttpResponse` object.
- `Middleware` and `MiddlewareLegacy` type v1 API Gateway events.
- `MiddlewareV2` types HTTP API v2 events for reusable middleware.
- See [Versioning and compatibility](docs/versioning-and-compatibility.md) for
  modernization release classification and v5 upgrade notes.

## Credits

- The initial version was inspired by [Feathers](https://feathersjs.com/).
- This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
