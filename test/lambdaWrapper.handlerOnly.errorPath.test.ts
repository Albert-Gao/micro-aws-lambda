// TODO: test if we can return non object

import { lambdaWrapper, httpError } from '../src';
const LambdaTester = require('lambda-tester');

it('should return error when throwing httpError', async () => {
  const mockResponse = { message: true };

  const testHandler = lambdaWrapper({
    handler: () => {
      throw httpError({ statusCode: 402, body: mockResponse });
    },
  });

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

  const testHandler = lambdaWrapper({
    handler: () => httpError({ statusCode: 403, body: mockResponse }),
  });

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
