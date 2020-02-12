# Micro Lambda

## Intro

- Ready to go Lambda Proxy library
- Zero dependencies
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

## Credits

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
