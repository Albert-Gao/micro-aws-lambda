import { lambdas } from '../src';
import { success } from '../src/httpResponse';
const LambdaTester = require('lambda-tester');

it('should return the 1st response from handler', async () => {
  const lambdaMock = jest.fn();
  const firstResponse = 'I am the 1st';

  const testHandler = lambdas([() => firstResponse, lambdaMock]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(lambdaMock).not.toBeCalled();
  expect(response).toEqual({
    body: firstResponse,
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  });
});

it('should return the error being thrown from the 1st middleware', async () => {
  const lambdaMock = jest.fn();
  const mockError = { name: 'test' };

  const testHandler = lambdas([
    () => {
      throw mockError;
    },
    lambdaMock,
  ]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(lambdaMock).not.toBeCalled();
  expect(response).toEqual({
    body: JSON.stringify(mockError),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 400,
  });
});

it('should return an response when throwing', async () => {
  const lambdaMock = jest.fn();
  const mockResult = { name: 'test' };

  const testHandler = lambdas([
    () => {
      throw success(mockResult);
    },
    lambdaMock,
  ]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(lambdaMock).not.toBeCalled();
  expect(response).toEqual({
    body: JSON.stringify(mockResult),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  });
});

it('should return an Error response from afterHooks', async () => {
  const lambdaMock = jest.fn();
  const mockError = { name: 'test' };

  const testHandler = lambdas([
    lambdaMock,
    () => {
      throw mockError;
    },
  ]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(lambdaMock).toBeCalledTimes(1);
  expect(response).toEqual({
    body: JSON.stringify(mockError),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 400,
  });
});

it('should return a normal response from afterHooks', async () => {
  const lambdaMock = jest.fn();
  const mockResponse = { name: 'test' };

  const testHandler = lambdas([lambdaMock, () => mockResponse]);

  const response = await LambdaTester(testHandler).expectResult();

  expect(lambdaMock).toBeCalledTimes(1);
  expect(response).toEqual({
    body: JSON.stringify(mockResponse),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  });
});

it('should call middlewares one by one', async () => {
  const orders: number[] = [];

  const middleware1 = jest.fn().mockImplementation(() => {
    orders.push(1);
  });
  const middleware2 = jest.fn().mockImplementation(() => {
    orders.push(2);
  });
  const middleware3 = jest.fn().mockImplementation(() => {
    orders.push(3);
  });

  const middleware4 = jest.fn().mockImplementation(() => {
    orders.push(4);
  });

  const middleware5 = jest.fn().mockImplementation(() => {
    orders.push(5);
  });
  const middleware6 = jest.fn().mockImplementation(() => {
    orders.push(6);
  });
  const middleware7 = jest.fn().mockImplementation(() => {
    orders.push(7);
  });

  const testHandler = lambdas([
    middleware1,
    middleware2,
    middleware3,
    middleware4,
    middleware5,
    middleware6,
    middleware7,
  ]);

  const result = await LambdaTester(testHandler).expectResult();

  expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7]);

  expect(middleware1).toBeCalledTimes(1);
  expect(middleware2).toBeCalledTimes(1);
  expect(middleware3).toBeCalledTimes(1);
  expect(middleware4).toBeCalledTimes(1);
  expect(middleware5).toBeCalledTimes(1);
  expect(middleware6).toBeCalledTimes(1);
  expect(middleware7).toBeCalledTimes(1);

  // because nothing is returned from middleware, so default value {} should be used
  expect(result.body).toEqual('{}');
});

it('should call async function without problems', async () => {
  const mockResponse = { message: 'wow' };

  const beforeMock = jest.fn();
  const lambdaMock = async () => Promise.resolve(mockResponse);

  const testHandler = lambdas([lambdaMock, beforeMock]);

  const result = await LambdaTester(testHandler).expectResult();

  expect(result).toEqual({
    body: JSON.stringify(mockResponse),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  });
});

test('passDownObj should work', async () => {
  const testHandler = lambdas<any, { name: string }>([
    ({ shared }) => {
      shared.name = 'albert';
    },
    ({ shared }) => shared,
  ]);

  const result = await LambdaTester(testHandler).expectResult();

  expect(result).toEqual({
    body: JSON.stringify({ name: 'albert' }),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  });
});
