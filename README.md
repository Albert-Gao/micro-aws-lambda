# Micro AWS Lambda

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
  - an built-in `httpResponse()` / `success()` / `badRequest()` / `internalError()`
  - or string, number, boolean
- Easier debug:
  - Adding debug info to response object
  - console.log event / context

## Usage

### Quick start

```typescript
import { Middleware, lambdaWrapper } from 'micro-lambda';

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

### Simple handler

Writing an API which will return a JSON and logging things like `APIGatewayID` and `CloudWatchID`, blahblah

```typescript
import { lambdaWrapper, Middleware } from 'micro-lambda';

const lambda: Middleware = ({ event, context, passDownObj }) => {
  return {
    message: 'it works',
  };
};

const handler = lambdaWrapper({
  handler: lambda,
});

// call the API, you will get json response: {message: ""it works"}
```

### Before hooks

What about I want to validate this request before executing my lambda? Easy, you just add a hook.

In the following case, if the request name is 'albert', only `validateRequest` will be called.

```typescript
import { badRequest } from 'micro-lambda';

const validateRequest: Middleware = ({ event }) => {
  if (event.request.name === 'albert') {
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

### After hooks

You can add `afterHooks` as well for changing response.
The following handler will only return { message: 'bad user, bye bye' }

```typescript
import { badRequest } from 'micro-lambda';

const validateResponse: Middleware = ({ passDownObj }) => {
  if (passDownObj.name === 'albert') {
    throw badRequest({
      message: 'bad user, bye bye',
    });
  }
};

const handler = lambdaWrapper({
  handler: ({ passDownObj }) => {
    const res = { name: 'albert' };
    passDownObj.name = res.name;
    return res;
  },
  afterHooks: [validateResponse],
});
```

### Config

#### addTraceInfoToResponse

It will add debug info into the response object

```javascript
{
  endpoint: "",
  requestBody: "",
  requestMethod: "",

  country: "",
  lambdaRequestId: "",
  logStreamName: "",
  logGroupName: "",
  apiGatewayId: "",
}
```

#### logRequestInfo

It will `console.log`:

- `event`
- `context`
- `Aws-Api-Gateway-Request-Id`
- `Identity-Source-Ip`

## Credits

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
