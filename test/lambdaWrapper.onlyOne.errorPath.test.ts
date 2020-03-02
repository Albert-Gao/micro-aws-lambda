// TODO: test if we can return non object

import { lambdas, httpError } from '../src';
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
