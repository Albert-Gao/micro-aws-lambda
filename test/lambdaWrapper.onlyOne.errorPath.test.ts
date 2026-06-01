// TODO: test if we can return non object

import { httpError } from '../src/httpResponse';
import { lambdas } from '../src/lambdas';

const LambdaTester = require('lambda-tester');

it('should return error when throwing httpError', async () => {
  const mockResponse = { message: true };

  const testHandler = lambdas([
    () => {
      throw httpError({ statusCode: 402, body: mockResponse });
    },
  ]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(response).toEqual({
    statusCode: 402,
    body: JSON.stringify(mockResponse),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
    },
  });
});

it('should return error when returning httpError', async () => {
  const mockResponse = { message: true };

  const testHandler = lambdas([
    () => httpError({ statusCode: 403, body: mockResponse }),
  ]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(response).toEqual({
    statusCode: 403,
    body: JSON.stringify(mockResponse),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
    },
  });
});

it('should return a plain 500 response when throwing a JavaScript Error', async () => {
  const testHandler = lambdas([
    () => {
      throw new Error('boom');
    },
  ]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(response).toEqual({
    statusCode: 500,
    body: JSON.stringify({
      errorName: 'Error',
      message: 'boom',
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
    },
  });
  expect(response).not.toBeInstanceOf(Error);
});

it('should keep thrown plain values as 400 error responses', async () => {
  const testHandler = lambdas([
    () => {
      throw 'plain failure';
    },
  ]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(response).toEqual({
    statusCode: 400,
    body: 'plain failure',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
    },
  });
});

it('should return success() run even when no middlewares is passing', async () => {
  const testHandler = lambdas();

  const response = await LambdaTester(testHandler).expectResult();

  expect(response).toEqual({
    statusCode: 200,
    body: '{}',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
    },
  });
});

it('should return success() run even when middlewares is empty', async () => {
  const testHandler = lambdas([]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(response).toEqual({
    statusCode: 200,
    body: '{}',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
    },
  });
});

test('the response from Promise.reject should be 400 rather than 200 even when no statusCode is set', async () => {
  const mockResponse = { message: 'awesome' };

  const middleware2 = () => Promise.reject(mockResponse);

  const testHandler = lambdas([middleware2]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(response).toEqual({
    body: JSON.stringify(mockResponse),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 400,
  });
});

test('statusCode from Promise.reject should be used', async () => {
  const mockResponse = { statusCode: 401, message: 'awesome' };

  const middleware2 = () => Promise.reject(mockResponse);

  const testHandler = lambdas([middleware2]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(response).toEqual({
    body: JSON.stringify(mockResponse),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 401,
  });
});

test('explicit isBase64Encoded false should be preserved', async () => {
  const testHandler = lambdas([
    () => ({
      statusCode: 200,
      body: 'plain text',
      headers: {
        'Content-Type': 'text/plain',
      },
      isBase64Encoded: false,
    }),
  ]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(response).toEqual({
    statusCode: 200,
    body: 'plain text',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'text/plain',
    },
    isBase64Encoded: false,
  });
});
