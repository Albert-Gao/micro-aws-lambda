# **Will be available soon!**

# Micro Lambda

## Intro

- Ready to go Lambda Proxy library
- Written in Typescript
- Zero runtime dependencies
- Tiny: 7KB after minified
- Extendable with middlewares
  - before (handler) hooks
  - after (handler) hooks
  - early exit with `exit()` or throw `httpError()`
  - pass values among middlewares
- You just return
  - an object, it will be converted to a Lambda compatible response
  - an built-in `httpResponse()` / `success()` / `badRequest()` / `internalError()`
- Easier debug:
  - Adding debug info to response object
  - console.log event / context

## Usage

Writing an API which will return a JSON and logging things like `APIGatewayID` and `CloudWatchID`, blahblah

```typescript
import {lambdaWrapper, Middleware} from 'micro-lambda'

const lambda: Middleware = ({event, context, exit, passDownObj})=>{
  return {
    message: 'it works'
  }
}

const handler = lambdaWrapper({
  handler: lambda,
  config: {
    addTraceInfoToResponse: true;
    logRequestInfo: true;
  }
})

// call the API, you will get json response: {message: ""it works"}
```

What about I want to validate this request before executing my lambda? Easy, you just add a hook.

```typescript
import { badRequest } from 'micro-lambda';

const validateRequest: Middleware = ({ event }) => {
  if (event.request.name === 'albert') {
    throw badRequest({
      message: 'bad user, byebye',
    });
  }
};

const handler = lambdaWrapper({
  // adding to the array
  // omitting the other things for briefing
  beforeHooks: [validateRequest],
});
```

Now if there are any problems with the request, it will exit the chain at the `validateRequest` rather than hitting the `lambda`.

## Credits

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
