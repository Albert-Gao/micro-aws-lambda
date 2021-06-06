# Micro AWS Lambda

<img src='https://github.com/Albert-Gao/micro-aws-lambda/blob/master/logo.png?raw=true' maxWidth="100%" height='auto' />

<p align="center" style="letter-spacing: 8px;">

  <a href="https://www.npmjs.com/package/micro-aws-lambda" alt="npm package">
    <img src="https://badgen.net/npm/v/micro-aws-lambda?icon=npm"/>
  </a>

  <a href="https://github.com/Albert-Gao/micro-aws-lambda/actions" alt="combined checks">
    <img src="https://badgen.net/github/checks/albert-gao/micro-aws-lambda?label=ci"/>
  </a>

  <a href="https://github.com/Albert-Gao/micro-aws-lambda" alt="last commits">
    <img src="https://badgen.net/github/last-commit/albert-gao/micro-aws-lambda"/>
  </a>

  <a href="https://github.com/Albert-Gao/micro-aws-lambda" alt="licence">
    <img src="https://badgen.net/npm/license/micro-aws-lambda"/>
  </a>

  <a href="https://coveralls.io/github/Albert-Gao/micro-aws-lambda" alt="test coverage">
    <img src="https://badgen.net/coveralls/c/github/Albert-Gao/micro-aws-lambda"/>
  </a>

  <a href="https://www.npmjs.com/package/micro-aws-lambda" alt="types">
    <img src="https://badgen.net/npm/types/micro-aws-lambda"/>
  </a>

  <a href="https://bundlephobia.com/result?p=micro-aws-lambda@latest" alt="minified">
    <img src="https://badgen.net/bundlephobia/min/micro-aws-lambda"/>
  </a>

  <a href="https://bundlephobia.com/result?p=micro-aws-lambda@latest" alt="minified + gzip">
    <img src="https://badgen.net/bundlephobia/minzip/micro-aws-lambda"/>
  </a>

  <a href="https://twitter.com/albertgao" alt="twitter">
    <img src="https://badgen.net/twitter/follow/albertgao"/>
  </a>

</p>

## Intro

- For Lambda Proxy / Http API mode
- Written in Typescript
- Zero runtime dependencies
- Tiny: 4.7KB after minified
- Rapid middlewares
  - simple reasoning, just running one by one
  - early exit with `throw` or `return` anything
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
const handler = lambdas([
  validateRequestBody(GetUserSchema),
  isStillEmployed,
  verifyPaymentStatus,
  justReturnUserObjectDirectlyFromDB,
  removeFieldsFromResponse('password', 'address'),
  combineUserNames,
  transformResponseToClientSideStructure,
]);
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

### 3. The usage of Typescript

```typescript
import { lambdas, Middleware, HttpResponse } from 'micro-aws-lambda';

interface Shared {
  user: { id: string; group: string };
}

interface Response {
  isPassing: boolean;
}

const extractUserFromEvent: Middleware<Response, Shared> = ({
  event,
  shared,
}) => {
  const user = JSON.parse(event.body ?? '');

  if (!user) {
    throw HttpResponse.badRequest({ body: { isPassing: false } });
  }

  shared.user = user;
};

const parseUserData: Middleware<Response, Shared> = ({ shared }) =>
  shared.user.id === 'bad-user-id'
    ? HttpResponse.badRequest({ body: { isPassing: false } })
    : HttpResponse.success({ body: { isPassing: true } });

export const handler = lambdas([extractUserFromEvent, parseUserData]);
```

For using with Javascript, you just use it. And later on, if there are any lambda handler needs that `extractUserFromEvent`, you just reuse that piece anywhere you want!

### 4. Two minutes master

- How to control the flow?

  - `return` will STOP the execution
  - `throw` will STOP the execution
  - if nothing is returning after invoking the last middleware, an empty object will be returned
  - otherwise, the array of `Middleware` will just be executed one by one
  - who returns the 1st wins, for example, `lambdas([m1, m2])`, if `m1` is returning something, it will be used as the http response and m2 will not be executed.

- What can you `return`

  - a `HttpResponse.response()`
  - or a `HttpResponse.success()` (just a `HttpResponse.response()` with status code set to 200, you can still change it)
  - or an plain object / string / number (which will be auto-wrapped with `HttpResponse.success()` in the end)

* What can you `throw`

  - an `HttpResponse.error()`
  - an `HttpResponse.badRequest()`
  - an `HttpResponse.internalError()`
  - or anything else

* How to pass something down the chain,

  - use `shared` from the parameter
  - attach your value to it: `shared.myValue = 123`, `myValue` could be any name

* Do I have to return something in the middleware

  - No. For example, a validation middleware can only react to the wrong data without returning anything like `if (wrong) {throw badRequest()}`

### 5. Actually, you can throw or return anything

- `return` a plain `object` | `string` | `number` === (200) response
- `throw` a plain `object` | `string` | `number` === (400) response
- custom status code by adding `statusCode` property
- Or use our built-in shortcut, `import {HttpResponse} from 'micro-aws-lambda'`, then `HttpResponse.success({body:{message:'wow'}})`
- or `import {success,badRequest} from 'micro-aws-lambda'`

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

### 7. Migrating from v4

- `passDownObj` has renamed to `shared`
- `return` **STOPS** the execution now, like `throw`, makes the flow easier to reason about!
- all `http` helpers can be used under `HttpResponse`, just import this one alone

## Credits

- The initial version is heavily inspired by my favourite REST framework: [Feathers.JS](https://feathersjs.com/)
- This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
