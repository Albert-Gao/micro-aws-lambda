# Micro AWS Lambda

<img src='https://github.com/Albert-Gao/micro-aws-lambda/blob/master/logo.png?raw=true' maxWidth="100%" height='auto' />

## Intro

- Ready to go Lambda Proxy library
- Written in Typescript
- Zero runtime dependencies
- Tiny: 7KB after minified
- Extendable with middlewares
  - simple chain, just running one by one
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

# Why do you build this lib

Lambda Proxy is making it a flash to creating an API endpoint. But that's just the infrastructure part. It doesn't mean your business logic can be simplified.

- I need a middleware setup to decouple my business logic without installing a lib that has many dependencies and result in a bigger bundle size as well.
- I want to deal with a simple interface, where the order is just one by one. I don't want to deal with a mental model where a middleware will be invoked twice for both stages, and handle both the `before` and `after` stage in one function.

# What problems does it solve

Middleware is for decoupling logic. I learned the value of `beforeHooks` and `afterHooks` after adopting [Feathers.JS](https://feathersjs.com/). Which has a beautiful concept of 3 layers for every endpoint, and I found myself rarely have any boilerplate code anymore. In `micro-aws-lambda`'s context, `Middlewares[]`.

Let's say a simple return-a-user endpoint, what does it look like when you are using `micro-aws-lambda`

```javascript
export lambdaWrapper({
  middlewares: [
    validateRequestBody(GetUserSchema),
    isStillEmployed,
    verifyPaymentStatus,
    justReturnUserObjectDirectlyFromDB,
    removeFieldsFromResponse('password', 'address'),
    combineUserNames,
    transformResponseToClientSideStructure
  ]
})
```

As you can see here, instead of writing, you are composing your logic. Ideally, you can just compose your future lambda without writing any code except for an integration test. Every middleware here can be fully tested and ready to use.

This concept doesn't apply only to this library, but to any middleware based library or framework. In short, for the data fetching layer, you always want to make it as deadly simple as possible, in this example, `justReturnUserObjectDirectlyFromDB`, any logic for processing the entity, is just another middleware.

Another pain point is every time I want to trace the lambda logs in CloudWatch, a lot of information needed like the logId. I'd love to have a simple switch there so any time I want to trace the lambda, I should receive everything I need in the response, I can simply copy and paste in CloudWatch to get the information.

## Usage

### 1. Install

`npm install micro-aws-lambda`

### 2. Quick start

```typescript
import { Middleware, lambdaWrapper } from 'micro-aws-lambda';

const middleware: Middleware = ({event, context, passDownObj}) => {}

const handler = lambdaWrapper({
  middlewares:[ middleware ],
  config: {
      addTraceInfoToResponse: false;
      logRequestInfo: false;
  }
});
```

Below is the signature of the middleware:

```typescript
type Middleware = ({
  event,
  context,
  passDownObj,
  response,
}: {
  event: APIGatewayProxyEvent; // from @types/aws-lambda
  context: Context; // from @types/aws-lambda
  passDownObj: PlainObject;
  response?: any;
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

- What will be returned?

  - either: the `return` value from the last middleware will be taken as the response
  - or: the error `throw` by one of the middleware (all the rest middleware won't get executed)

- You can `return` in any middleware **(which won't stop the chain)**:
  - a `httpResponse()`
  - or a `success()` (just a `httpResponse()` with status code set to 200, you can still change it)
  - or an plain object / string / number which will be wrapped with `success()`
  - it will be passed to the next middleware as the `response` parameter
- You can `throw` **(which will stop the chain so any middlewares after it won't be executed)**:
  - an `httpError()`
  - an `badRequest()`
  - an `internalError()`
- Anytime you want to check what will be returned in the end, check the `response` from the parameter
  - to change the `response`, you just `return` in your current middleware
- Anytime you want to pass something down the chain, use `passDownObj` from the parameter
  - just attach your value to it: `passDownObj.myValue = 123`, `myValue` could be any name

### 3. Simple handler

Writing an API which will return a JSON and logging things like `APIGatewayID` and `CloudWatchID`, blah blah

```typescript
import { lambdaWrapper } from 'micro-aws-lambda';

export const handler = lambdaWrapper({
  middlewares: [
    () => ({
      message: 'it works',
    }),
  ],
  config: {
    addTraceInfoToResponse: true,
  },
});

// call the API, you will get json response: {message: "it works"}
```

### 4. Examples

#### 4.1 Validation

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
  middlewares: [validateRequest],
});
```

Or if you like me, you can write a simple validating middleware with the `yup` schema, you can then reuse from the client side.

```typescript
import { Schema } from 'yup';
import { lambdaWrapper, Middleware, badRequest } from 'micro-aws-lambda';

const validateBodyWithYupSchema = (schema: Schema): Middleware => async ({
  event,
}) => {
  if (!schema.isValid(event.body)) {
    throw badRequest('bad request');
  }
};

const handler = lambdaWrapper({
  middlewares: [validateBodyWithYupSchema(myYupSchema)],
});
```

#### 4.2. processing Response

The following handler will only return `{ message: 'bad user, bye bye' }`

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

const testHandler = lambdaWrapper({
  middlewares: [
    () => ({
      name: 'albert',
      password: '123qwe',
      address: 'somewhere on earth'
    }),
    removeFieldsFromResponse(['password', 'address'])
   ],
});

// response will be  { name: 'albert' }
```

### 5. Response

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

## 7. Credits

- This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
