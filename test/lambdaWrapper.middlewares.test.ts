import { lambdas, Middleware } from '../src';
const LambdaTester = require('lambda-tester');

it('should return an json response from handler', async () => {
  const mockResponse = { message: true };

  const testHandler = lambdas([() => true, () => mockResponse]);

  const response = await LambdaTester(testHandler).expectResult();

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

it('should return an response from beforeHook', async () => {
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
    statusCode: 200,
  });
});

it('should pass the response among the middlewares', async () => {
  const mockResponse = { name: 'test' };
  const beforeHookMock: jest.Mock<Middleware> = jest.fn();
  const lambdaMock: jest.Mock<Middleware> = jest.fn();
  const afterHookMock: jest.Mock<Middleware> = jest.fn();

  const testHandler = lambdas([
    () => mockResponse,
    (beforeHookMock as unknown) as Middleware,
    (lambdaMock as unknown) as Middleware,
    (afterHookMock as unknown) as Middleware,
  ]);

  const response = await LambdaTester(testHandler).expectResult();

  const paramOfBeforeHookMock = beforeHookMock.mock.calls[0][0];
  const paramOfLambdaMock = lambdaMock.mock.calls[0][0];
  const paramOfAfterHookMock = afterHookMock.mock.calls[0][0];

  expect(paramOfBeforeHookMock.response).toEqual(mockResponse);
  expect(paramOfLambdaMock.response).toEqual(mockResponse);
  expect(paramOfAfterHookMock.response).toEqual(mockResponse);

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
    statusCode: 200,
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

  const middleware1 = jest.fn().mockImplementation(() => orders.push(1));
  const middleware2 = jest.fn().mockImplementation(() => orders.push(2));
  const middleware3 = jest.fn().mockImplementation(() => orders.push(3));

  const middleware4 = jest.fn().mockImplementation(() => {
    orders.push(4);
    return Promise.resolve(true);
  });

  const middleware5 = jest.fn().mockImplementation(() => orders.push(5));
  const middleware6 = jest.fn().mockImplementation(() => orders.push(6));
  const middleware7 = jest.fn().mockImplementation(() => orders.push(7));

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

  // because orders.push(7) will return 7
  expect(result.body).toEqual(7);
});

it('should call async function without problems', async () => {
  const mockResponse = { message: 'wow' };

  const beforeMock = jest.fn();
  const lambdaMock = async function() {
    return Promise.resolve(mockResponse);
  };

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

it('should pass async result to the next middleware without problems', async () => {
  const mockResponse = { message: 'wow' };

  const lambdaMock = async function() {
    return Promise.resolve(mockResponse);
  };
  const afterMock = jest.fn() as jest.Mock<Middleware>;

  const testHandler = lambdas([
    lambdaMock,
    (afterMock as unknown) as Middleware,
  ]);

  await LambdaTester(testHandler).expectResult();

  const paramOfAfterHook = afterMock.mock.calls[0][0];

  expect(paramOfAfterHook.response).toEqual(mockResponse);
});

test('passDownObj should work', async () => {
  const validateResponse: Middleware<{ name: string }> = ({ passDownObj }) => {
    if (passDownObj.name === 'albert') {
      // eslint-disable-next-line no-throw-literal
      throw {
        message: 'bad user, bye bye',
      };
    }
  };

  const testHandler = lambdas([
    ({ passDownObj }) => {
      const res = { name: 'albert' };
      passDownObj.name = res.name;
      return res;
    },
    validateResponse,
  ]);

  const result = await LambdaTester(testHandler).expectResult();

  expect(result).toEqual({
    body: JSON.stringify({
      message: 'bad user, bye bye',
    }),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  });
});

it('should throw error from the last middleware rather than return the response from the 1st middleware', async () => {
  const validateResponse: Middleware = ({ response }) => {
    if (response?.name === 'albert') {
      // eslint-disable-next-line no-throw-literal
      throw {
        message: 'bad user, bye bye',
      };
    }
  };

  const testHandler = lambdas([
    () => ({
      name: 'albert',
    }),
    validateResponse,
  ]);

  const result = await LambdaTester(testHandler).expectResult();

  expect(result).toEqual({
    body: JSON.stringify({
      message: 'bad user, bye bye',
    }),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  });
});

test('the response in the parameter should work', async () => {
  const mockResponse = { message: 'awesome' };

  const middleware1 = jest.fn() as jest.Mock<Middleware>;
  const middleware2 = jest.fn() as jest.Mock<Middleware>;
  const middleware3 = jest.fn().mockResolvedValue(mockResponse) as jest.Mock<
    Middleware
  >;
  const middleware4 = jest.fn() as jest.Mock<Middleware>;
  const middleware5 = jest.fn() as jest.Mock<Middleware>;

  const testHandler = lambdas([
    (middleware1 as unknown) as Middleware,
    (middleware2 as unknown) as Middleware,
    (middleware3 as unknown) as Middleware,
    (middleware4 as unknown) as Middleware,
    (middleware5 as unknown) as Middleware,
  ]);

  await LambdaTester(testHandler).expectResult();

  const paramToMiddleware1 = middleware1.mock.calls[0][0];
  expect(paramToMiddleware1.response).toEqual({});

  const paramToMiddleware2 = middleware2.mock.calls[0][0];
  expect(paramToMiddleware2.response).toEqual({});

  const paramToMiddleware3 = middleware3.mock.calls[0][0];
  expect(paramToMiddleware3.response).toEqual({});

  const paramToMiddleware4 = middleware4.mock.calls[0][0];
  expect(paramToMiddleware4.response).toEqual(mockResponse);

  const paramToMiddleware5 = middleware5.mock.calls[0][0];
  expect(paramToMiddleware5.response).toEqual(mockResponse);
});

test('the response should be returned even when there is a middleware(returns nothing) after', async () => {
  const mockResponse = { message: 'awesome' };

  const middleware1 = () => mockResponse;
  const middleware2 = () => {
    console.log('test');
  };

  const testHandler = lambdas([middleware1, middleware2]);

  const response = await LambdaTester(testHandler).expectResult();

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
