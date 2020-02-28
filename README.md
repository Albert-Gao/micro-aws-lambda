# Micro AWS Lambda

<img src='https://github.com/Albert-Gao/micro-aws-lambda/blob/master/logo.png?raw=true' maxWidth="100%" height='auto' />

## Intro

- For Lambda Proxy mode
- Written in Typescript
- Zero runtime dependencies
- Tiny: 7KB after minified
- Extendable with middlewares
  - simple reasoning, just running one by one
  - early exit for just `throw` `httpError()` or anything
  - pass values among middlewares
- Return response
  - an object, it will be converted to a Lambda compatible response
  - a customizable `httpResponse()` / `success()` (200)
  - a customizable `httpError()` / `badRequest()` (400) / `internalError()` (500)
  - or string, number, boolean
- Easy debug:
  - Adding debug info to response object
  - console.log event / context

## Why do you build this lib

AWS Lambda is making it a flash to creating an API endpoint. But that's just the infrastructure part. It doesn't mean your business logic can be simplified.

- I need a middleware setup to decouple my business logic without installing a lib that has many dependencies and result in a bigger bundle size as well.
- I want to deal with a simple interface, where the order is just one by one. I don't want to deal with a mental model where a middleware will be invoked twice for both stages, and handle both the `before` and `after` stage in one function.

## What problems does it solve

Middleware is for decoupling logic. I learned the value of `beforeHooks` and `afterHooks` after adopting [Feathers.JS](https://feathersjs.com/). Which has a beautiful concept of 3 layers for every endpoint, and I found myself start the declarative programming for the backend. No more code for the repeating work. In `micro-aws-lambda`'s context, it is just an array of `Middleware`.

Let's say a simple return-a-user endpoint, what does it look like when you are using `micro-aws-lambda`

```javascript
const handler = lambdas({
  middlewares: [
    validateRequestBody(GetUserSchema),
    isStillEmployed,
    verifyPaymentStatus,
    justReturnUserObjectDirectlyFromDB,
    removeFieldsFromResponse('password', 'address'),
    combineUserNames,
    transformResponseToClientSideStructure,
  ],
});
```

Ideally, you can just compose your future lambda without writing any code except for an integration test. The logic will be declarative. Every middleware here can be fully tested and ready to reuse.

## Usage

### 1. Install

`npm install micro-aws-lambda`

### 2. Quick start

```typescript
import { lambdas } from 'micro-aws-lambda';

const handler = lambdas([() => ({ message: 'it works' })]);

// call the API, you will get json response: { message: "it works" }
```

### 3. The type of the middleware

```typescript
type Middleware = ({
  event,
  context,
  passDownObj,
  response,
}: {
  event: APIGatewayProxyEvent; // from @types/aws-lambda
  context: Context; // from @types/aws-lambda
  passDownObj: PlainObject; // for sharing info among middlewares
  response?: any; // for checking the http response
}) =>
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

### 4. Two minutes master

- How to control the flow?

  - `return` WON'T stop the execution
  - `throw` will STOP the execution

- What can you `return`

  - a `httpResponse()`
  - or a `success()` (just a `httpResponse()` with status code set to 200, you can still change it)
  - or an plain object / string / number (which will be auto-wrapped with `success()` in the end)
  - Any value `return`ed will be passed to the next middleware as the `response` parameter

- What can you `throw`

  - an `httpError()`
  - an `badRequest()`
  - an `internalError()`
  - or anything else

- How to check what will be returned as the Http response

  - check the `response` from the parameter

- How to change the `response`

  - you just `return` a new one in your current middleware

- How to pass something down the chain,

  - use `passDownObj` from the parameter
  - attach your value to it: `passDownObj.myValue = 123`, `myValue` could be any name

- What will be returned if every middlewares is returning
  - the last one wins, it's simply because you can replace the current response by `return`ing a new one.

### 5. About the built-in responses

There are 2 types of response:

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

#### 5.1. Shortcuts

Compare to the above methods, the only difference is the shortcuts just sets the status code, you can still modify them if you want.

- `httpError`:
  - `badRequest()`: 400
  - `internalRequest()`: 500
- `httpResponse`:
  - `success()`: 200

### 6. Config

#### 6.1 addTraceInfoToResponse

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

#### 6.2 logRequestInfo

It will `console.log`:

- `event`
- `context`
- `Aws-Api-Gateway-Request-Id`
- `Identity-Source-Ip`

### 7. Examples

#### 7.1 Validation

In the following case, if the request name is 'albert', only `validateRequest` will be called.

```typescript
import { badRequest, Middleware } from 'micro-aws-lambda';

const validateRequest: Middleware = ({ event }) => {
  if (event.request.body.name === 'albert') {
    throw badRequest({
      message: 'bad user, bye bye',
    });
  }
};

// it will return a 400 error { message: 'bad user, bye bye' }
```

Or if you like me, you can write a simple validating middleware with the `yup` schema, you can then reuse from the client side.

```typescript
import { Schema } from 'yup';
import { lambdas, Middleware, badRequest } from 'micro-aws-lambda';

const validateBodyWithYupSchema = (schema: Schema): Middleware => async ({
  event,
}) => {
  if (!schema.isValid(event.body)) {
    throw badRequest('bad request');
  }
};

const handler = lambdas([validateBodyWithYupSchema(myYupSchema)]);
```

#### 7.2 processing Response

```typescript
import { badRequest } from 'micro-aws-lambda';

const removeFieldsFromResponse = (fieldsToRemove: string[]): Middleware = ({ response }) => {
    const newResponse = Object.assign({}, response);

    fieldsToRemove.forEach(field => {
      if (newResponse[field] != null) {
        delete newResponse[field]
      }
    })

    return newResponse;
};

const testHandler = lambdas(
  [
    () => ({
      name: 'albert',
      password: '123qwe',
      address: 'somewhere on earth'
    }),
    removeFieldsFromResponse(['password', 'address'])
   ],
);

// response will be  { name: 'albert' }
```

## Credits

- The initial version is heavily inspired by my favourite REST framework: [Feathers.JS](https://feathersjs.com/)
- This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
