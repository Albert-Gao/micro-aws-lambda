# Micro AWS Lambda

<img src='https://github.com/Albert-Gao/micro-aws-lambda/blob/master/logo.png?raw=true' maxWidth="100%" height='auto' />

## Intro

- Ready to go Lambda Proxy library
- Written in Typescript
- Zero runtime dependencies
- Tiny: 7KB after minified
- Extendable with middlewares
  - before (handler) hooks
  - after (handler) hooks
  - early exit for just `throw` `httpError()` or anything
  - pass values among middlewares
- Return response
  - an object, it will be converted to a Lambda compatible response
  - a customizable `httpResponse()` / `success()`
  - a customizable `httpError()` / `badRequest()` / `internalError()`
  - or string, number, boolean
- Easy debug:
  - Adding debug info to response object
  - console.log event / context

## Usage

### 1. Install

`npm install micro-aws-lambda`

### 2. Quick start

```typescript
import { Middleware, lambdaWrapper } from 'micro-aws-lambda';

const lambda: Middleware = ({event, context, passDownObj}) => {}

const handler = lambdaWrapper({
  handler: lambda,
  beforeHooks: [],
  afterHooks: [],
  config: {
      addTraceInfoToResponse: false;
      logRequestInfo: false;
  }
});
```

- The execution order is: `beforeHooks` -> `handler` -> `afterHooks`.
- `beforeHooks`, `handler`, `afterHooks` all have the same signature:

```typescript
type Middleware = ({
  event,
  context,
  passDownObj,
}: MiddlewareParams) =>
  | string
  | number
  | boolean
  | PlainObject
  | APIGatewayProxyResult
  | Promise<PlainObject | APIGatewayProxyResult>
  | HttpError
  | HttpResponse
  | void;
```

`event` and `context` is immutable, if you want to pass any info down, attach it to the `passDownObj` as a property, like `passDownObj.value = { message: 'checked' }`, the `passDownObj` object is mutable.

### 3. Simple handler

Writing an API which will return a JSON and logging things like `APIGatewayID` and `CloudWatchID`, blah blah

```typescript
import { lambdaWrapper, Middleware } from 'micro-aws-lambda';

const lambda: Middleware = ({ event, context, passDownObj }) => {
  return {
    message: 'it works',
  };
};

const handler = lambdaWrapper({
  handler: lambda,
  config: {
    addTraceInfoToResponse: true,
  },
});

// call the API, you will get json response: {message: ""it works"}
```

### 4. Before hooks

What about I want to validate this request before executing my lambda? Easy, you just add a hook.

In the following case, if the request name is 'albert', only `validateRequest` will be called.

```typescript
import { badRequest } from 'micro-aws-lambda';

const validateRequest: Middleware = ({ event }) => {
  if (event.request.body.name === 'albert') {
    throw badRequest({
      message: 'bad user, bye bye',
    });
  }
};

const handler = lambdaWrapper({
  // adding to the array
  // omitting the other things for briefing
  beforeHooks: [validateRequest],
});
```

Later on, you can reuse it in other lambdas.

### 5. After hooks

You can add `afterHooks` as well for changing response.
The middleware in `afterHooks` will receive an additional `response` as the response.

The following handler will only return `{ message: 'bad user, bye bye' }`

```typescript
import { badRequest } from 'micro-aws-lambda';

const validateResponse: Middleware = ({ response }) => {
  if (response?.name === 'albert') {
    throw badRequest({
      message: 'bad user, bye bye',
    };
  })
};

const testHandler = lambdaWrapper({
  handler: () => ({
    name: 'albert',
  }),
  afterHooks: [validateResponse],
});
```

### 6. Response

There are 2 types for response:

- `httpError()` for `throw`
- `httpResponse()` for `return`

Each one of them has some shortcuts to use.

All parameters are customizable.

```typescript
import { httpError, httpResponse } from 'micro-aws-lambda';

// It gives you an instance of HttpError, which extends from Error
const error = httpError({
  // default status code is 400 if not set
  statusCode: 401,
  body: {
    message: 'test',
  },
  headers: {
    'x-http-header': 'fake-header',
  },
});

// It gives you a plain JS object.
const response = httpResponse({
  // default status code is 200 if not set
  statusCode: 200,
  body: {
    message: 'test',
  },
  headers: {
    'x-http-header': 'fake-header',
  },
});
```

The commons headers are:

- 'Access-Control-Allow-Origin': '\*',
- 'Access-Control-Allow-Credentials': true,
- 'Content-Type': 'application/json',

Supports `multiValueHeaders` and `isBase64Encoded` in case you need them.

#### 6.1. Shortcuts

Compare to the above methods, the only difference is the shortcuts just sets the status code, you can still modify them if you want.

- `httpError`:
  - `badRequest()`: 400
  - `internalRequest()`: 500
- `httpResponse`:
  - `success()`: 200

### 7. Config

#### 7.1 addTraceInfoToResponse

It will add debug info into the response object

```javascript
{
  debug: {
    endpoint: "",
    requestBody: "",
    requestMethod: "",

    country: "",
    lambdaRequestId: "",
    logStreamName: "",
    logGroupName: "",
    apiGatewayId: ""
  }
}
```

#### 7.2 logRequestInfo

It will `console.log`:

- `event`
- `context`
- `Aws-Api-Gateway-Request-Id`
- `Identity-Source-Ip`

## 8. Credits

- The `beforeHooks` and `afterHooks` mechanism heavily inspired from my favourite REST framework: [Feathers.JS](https://feathersjs.com/)
- This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
