# Versioning and compatibility

This project follows semantic versioning for the public npm package.

The current stable line is v5. The modernization baseline now declares
`"engines": { "node": ">=18" }`, so the modernized release should be published
as v6.0.0 unless that runtime floor is reverted before release.

## Release classification

Use these rules when classifying modernization changes.

### Patch

Use a patch release when the change is compatible with existing v5 consumers.

Examples:

- Documentation, examples, metadata, or repository workflow updates.
- Internal test, lint, formatting, or CI fixes that do not change published
  package contents.
- Dependency updates that keep the same supported Node.js and TypeScript ranges.
- Bug fixes that preserve the documented middleware flow and response shape.

### Minor

Use a minor release when the change adds capability without requiring existing
v5 consumers to change their code or runtime.

Examples:

- New response helpers or exported types.
- New optional configuration flags with v5-compatible defaults.
- Additional package metadata that keeps existing `main`, `module`, and
  `typings` consumers working.
- Wider AWS Lambda event or response type support that does not narrow current
  accepted inputs.

### Major

Use a major release when a v5 consumer may need to change code, tooling, or
runtime configuration.

Examples:

- Raising the minimum supported Node.js version.
- Raising the minimum supported TypeScript version in a way that affects
  consumers compiling against this package's declarations.
- Changing package format, entrypoints, or export maps so existing
  `require('micro-aws-lambda')` or deep imports stop working.
- Renaming, removing, or narrowing exported APIs such as `lambdas`,
  `HttpResponse`, `Middleware`, or documented response helpers.
- Changing default middleware control flow, error status mapping, CORS headers,
  JSON serialization, or trace/debug response structure.
- Switching the default Lambda event contract if it breaks existing REST API
  Gateway or HTTP API handlers.

## Known modernization compatibility decisions

- Minimum supported Node.js version is now 18. This is a major release change
  for consumers running older Lambda runtimes.
- Package metadata now defines an `exports` map for the root package export and
  `./package.json`. Consumers using undocumented deep imports from `dist` should
  move to the root export before upgrading.
- The documented root exports are expected to remain intact: `lambdas`,
  `HttpResponse`, and `Middleware`.
- The package is expected to remain zero-runtime-dependency unless a later
  change explicitly documents otherwise.

If later modernization work changes public type exports or runtime response
behavior, keep the v6.0.0 release classification and update this guide with the
final migration steps.

## v5 to modernized release migration

### Before upgrading

1. Check your Lambda runtime version.
2. Check your TypeScript version if you consume the package's types.
3. Check whether your deployment imports CommonJS, ESM, or bundled output.
4. Run your existing Lambda tests against both successful and thrown middleware
   responses.

### Runtime requirement changes

Update Lambda runtime configuration to Node.js 18 or newer before upgrading the
package.

```diff
- Runtime: nodejs14.x
+ Runtime: nodejs18.x
```

This is a breaking change for deployments still using Node.js 12, 14, or 16.

### Package entrypoint changes

Use the documented root export. The modernized package defines an `exports` map,
so undocumented deep imports are not a supported compatibility surface.

```ts
import { lambdas, HttpResponse } from 'micro-aws-lambda';
```

Avoid deep imports from `dist` files:

```diff
- import { HttpResponse } from 'micro-aws-lambda/dist/httpResponse';
+ import { HttpResponse } from 'micro-aws-lambda';
```

Deep imports are not part of the documented public API and may break when build
output is modernized.

### TypeScript contract changes

If TypeScript declarations are modernized, consumers may need to update generic
usage or AWS Lambda event typing. Keep middleware typed through the exported
`Middleware` type unless you explicitly need a legacy REST API Gateway event
shape.

```ts
import { Middleware } from 'micro-aws-lambda';

type Shared = { userId?: string };
type Body = { ok: boolean };

const middleware: Middleware<Shared, Body> = ({ shared }) => {
  shared.userId = '123';
  return { ok: true };
};
```

If a release re-exports a legacy middleware type, REST API Gateway handlers
should use that documented export instead of relying on internal declaration
paths.

### Response behavior

The v5 middleware flow is compatibility-sensitive:

- Returning a non-null value stops middleware execution.
- Throwing stops middleware execution.
- Returning `null`, `undefined`, or no value continues to the next middleware.
- Plain returned values become 200 responses.
- Plain thrown values become 400 responses.
- JavaScript `Error` instances without a numeric `statusCode` become 500
  responses.

Any intentional change to these rules is a major release.

### Trace/debug behavior

`addTraceInfoToResponse` changes response bodies by adding `debug` metadata. Any
change to the debug field names or wrapping behavior should be treated as a
major release unless it is guarded behind a new opt-in setting.

## Compatibility assumptions

These notes assume later modernization work keeps root imports compatible:

```ts
import { lambdas, HttpResponse, Middleware } from 'micro-aws-lambda';
```

If later pull requests alter module format or public type exports, prefer a
v6.0.0 release and update this guide before publishing.
