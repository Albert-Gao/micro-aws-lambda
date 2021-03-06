import {
  buildResponseObject,
  HttpError,
  httpError,
  success,
  httpResponse,
  HttpResponse,
} from '../src/httpResponse';

const { badRequest, internalError, notFound, unauthorized } = HttpResponse;

test('badRequest() should return an HTTPError', () => {
  const mockBody = { message: 'test' };

  const result = badRequest(mockBody);

  expect(result).toBeInstanceOf(HttpError);
  expect(result).toBeInstanceOf(Error);
  expect(result.statusCode).toEqual(400);
  expect(result.body).toEqual(mockBody);
  expect(result.headers).toEqual({
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  expect(result.multiValueHeaders).not.toBeDefined();
});

test('notFound() should return an HTTPError', () => {
  const mockBody = { message: 'test' };

  const result = notFound(mockBody);

  expect(result).toBeInstanceOf(HttpError);
  expect(result).toBeInstanceOf(Error);
  expect(result.statusCode).toEqual(404);
  expect(result.body).toEqual(mockBody);
  expect(result.headers).toEqual({
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  expect(result.multiValueHeaders).not.toBeDefined();
});

test('unauthorized() should return an HTTPError', () => {
  const mockBody = { message: 'test' };

  const result = unauthorized(mockBody);

  expect(result).toBeInstanceOf(HttpError);
  expect(result).toBeInstanceOf(Error);
  expect(result.statusCode).toEqual(401);
  expect(result.body).toEqual(mockBody);
  expect(result.headers).toEqual({
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  expect(result.multiValueHeaders).not.toBeDefined();
});

test('HttpError will set default statusCode to 400', () => {
  const err = new HttpError({
    body: { message: true },
  });
  expect(err.statusCode).toBe(400);
});

test('HttpError class constructor should honor multiValueHeaders', () => {
  const mockBody = { message: 'test' };
  const multiValueHeaders = {
    name: ['albert', 'x', 'z'],
  };

  const err = new HttpError({
    statusCode: 502,
    body: mockBody,
    multiValueHeaders,
  });

  expect(err).toBeInstanceOf(Error);
  expect(err.statusCode).toEqual(502);
  expect(err.body).toEqual(mockBody);
  expect(err.multiValueHeaders).toEqual(multiValueHeaders);
  expect(err.isBase64Encoded).toBeUndefined();
});

test('HttpError class constructor should honor isBase64Encoded', () => {
  const mockBody = { message: 'test' };

  const err = new HttpError({
    statusCode: 502,
    body: mockBody,
    isBase64Encoded: false,
  });

  expect(err).toBeInstanceOf(HttpError);
  expect(err).toBeInstanceOf(Error);
  expect(err.statusCode).toEqual(502);
  expect(err.body).toEqual(mockBody);
  expect(err.multiValueHeaders).toBeUndefined();
  expect(err.isBase64Encoded).toEqual(false);
});

test('HttpError.toHttpResponse should return an plain object rather than an Error object', () => {
  const mockBody = { message: 'test' };

  const err = new HttpError({
    statusCode: 502,
    body: mockBody,
  });

  const result = err.toHttpResponse();

  expect(result).not.toBeInstanceOf(Error);
  expect(result.statusCode).toEqual(502);
  expect(result.body).toEqual(mockBody);
  expect(result.multiValueHeaders).toBeUndefined();
  expect(result.isBase64Encoded).toBeUndefined();
});

test('httpError should set default statusCode to 400', () => {
  const err = httpError({ body: { message: true } });
  expect(err.statusCode).toBe(400);
});

test('httpError should honor multiValueHeaders', () => {
  const err = httpError({
    body: { message: true },
    multiValueHeaders: { vales: [1, 2, 3] },
  });
  expect(err.multiValueHeaders).toStrictEqual({ vales: [1, 2, 3] });
});

test('httpError should honor isBased64Encoded', () => {
  const err = httpError({
    body: { message: true },
    isBase64Encoded: true,
  });
  expect(err.isBase64Encoded).toStrictEqual(true);
});

test('httpError.toHttpResponse', () => {
  const err = httpError({
    body: { message: true },
    isBase64Encoded: true,
  });
  expect(err.toHttpResponse()).toStrictEqual({
    body: { message: true },
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    isBase64Encoded: true,
    statusCode: 400,
  });
});

test('buildResponseObject should set default statusCode to 200', () => {
  const res = buildResponseObject({ body: { message: true } });
  expect(res.statusCode).toBe(200);
});

test('buildResponseObject should honor multiValueHeaders', () => {
  const mockBody = { message: 'test' };
  const multiValueHeaders = {
    name: ['albert', 'x', 'z'],
  };

  const result = buildResponseObject({
    statusCode: 300,
    body: mockBody,
    multiValueHeaders,
  });

  expect(result).toEqual({
    body: {
      message: 'test',
    },
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    multiValueHeaders: {
      name: ['albert', 'x', 'z'],
    },
    statusCode: 300,
  });
});

test('buildResponseObject should isBase64Encoded', () => {
  const mockBody = { message: 'test' };

  const result = buildResponseObject({
    statusCode: 300,
    body: mockBody,
    isBase64Encoded: true,
  });

  expect(result).toEqual({
    body: {
      message: 'test',
    },
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    isBase64Encoded: true,
    statusCode: 300,
  });
});

test('badRequest should set default statusCode to 400', () => {
  const res = badRequest({ message: true });
  expect(res.statusCode).toBe(400);
});

test('badRequest should set default statusCode to custom one', () => {
  const res = badRequest({ message: true }, { statusCode: 500 });
  expect(res.statusCode).toBe(500);
});

test('badRequest should not change the body', () => {
  const res = badRequest({ message: true }, { statusCode: 500 });
  expect(res.body).toStrictEqual({ message: true });
});

test('internalError should set default statusCode to 500', () => {
  const res = internalError({ body: { message: true } });
  expect(res.statusCode).toBe(500);
});

test('httpResponse should set default statusCode to 200', () => {
  const res = httpResponse({ body: { message: true } });
  expect(res.statusCode).toBe(200);
});

test('success should set default statusCode to 200', () => {
  const res = success({ body: { message: true } });
  expect(res.statusCode).toBe(200);
});
