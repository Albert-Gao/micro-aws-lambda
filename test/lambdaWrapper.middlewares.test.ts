import { lambdaWrapper, Middleware } from '../src';
const LambdaTester = require('lambda-tester');

it('should return an json response from handler', async () => {
  const mockResponse = { message: true };

  const testHandler = lambdaWrapper({
    lambda: () => mockResponse,
    beforeHooks: [() => true],
  });

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

it('should return an  response from beforeHook', async () => {
  const lambdaMock = jest.fn();
  const mockError = { name: 'test' };

  const testHandler = lambdaWrapper({
    lambda: lambdaMock,
    beforeHooks: [
      () => {
        throw mockError;
      },
    ],
  });

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

it('should return an Error response from afterHooks', async () => {
  const lambdaMock = jest.fn();
  const mockError = { name: 'test' };

  const testHandler = lambdaWrapper({
    lambda: lambdaMock,
    afterHooks: [
      () => {
        throw mockError;
      },
    ],
  });

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

it('should return an normal response from afterHooks', async () => {
  const lambdaMock = jest.fn();
  const mockResponse = { name: 'test' };

  const testHandler = lambdaWrapper({
    lambda: lambdaMock,
    afterHooks: [() => mockResponse],
  });

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

it('should call functions one by one', async () => {
  const orders: number[] = [];

  const beforeMock1 = jest.fn().mockImplementation(() => orders.push(1));
  const beforeMock2 = jest.fn().mockImplementation(() => orders.push(2));
  const beforeMock3 = jest.fn().mockImplementation(() => orders.push(3));

  const lambdaMock = jest.fn().mockImplementation(() => orders.push(4));

  const afterMock1 = jest.fn().mockImplementation(() => orders.push(5));
  const afterMock2 = jest.fn().mockImplementation(() => orders.push(6));
  const afterMock3 = jest.fn().mockImplementation(() => orders.push(7));

  const testHandler = lambdaWrapper({
    lambda: lambdaMock,
    beforeHooks: [beforeMock1, beforeMock2, beforeMock3],
    afterHooks: [afterMock1, afterMock2, afterMock3],
  });

  await LambdaTester(testHandler).expectResult();

  expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7]);

  expect(beforeMock1).toBeCalledTimes(1);
  expect(beforeMock2).toBeCalledTimes(1);
  expect(beforeMock3).toBeCalledTimes(1);
  expect(lambdaMock).toBeCalledTimes(1);
  expect(afterMock1).toBeCalledTimes(1);
  expect(afterMock2).toBeCalledTimes(1);
  expect(afterMock3).toBeCalledTimes(1);
});

it('should call async function without problems', async () => {
  const mockResponse = { message: 'wow' };

  const beforeMock = jest.fn();
  const lambdaMock = async function() {
    return Promise.resolve(mockResponse);
  };

  const testHandler = lambdaWrapper({
    lambda: lambdaMock,
    beforeHooks: [beforeMock],
  });

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
  const validateResponse: Middleware = ({ passDownObj }) => {
    if (passDownObj.name === 'albert') {
      // eslint-disable-next-line no-throw-literal
      throw {
        message: 'bad user, bye bye',
      };
    }
  };

  const testHandler = lambdaWrapper({
    lambda: ({ passDownObj }) => {
      const res = { name: 'albert' };
      passDownObj.name = res.name;
      return res;
    },
    afterHooks: [validateResponse],
  });

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

test('111 should work', async () => {
  const validateResponse: Middleware = ({ response }) => {
    if (response?.name === 'albert') {
      // eslint-disable-next-line no-throw-literal
      throw {
        message: 'bad user, bye bye',
      };
    }
  };

  const testHandler = lambdaWrapper({
    lambda: () => ({
      name: 'albert',
    }),
    afterHooks: [validateResponse],
  });

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

test('afterHook should receive one additional response in the parameter', async () => {
  const mockResponse = { message: 'awesome' };

  const beforeMock1 = jest.fn();
  const beforeMock2 = jest.fn();

  const lambdaMock = jest.fn().mockImplementation(() => mockResponse);

  const afterMock1 = jest.fn();
  const afterMock2 = jest.fn();

  const testHandler = lambdaWrapper({
    lambda: lambdaMock,
    beforeHooks: [beforeMock1, beforeMock2],
    afterHooks: [afterMock1, afterMock2],
  });

  await LambdaTester(testHandler).expectResult();

  expect(beforeMock1).toBeCalledWith(
    expect.not.objectContaining({ response: expect.anything() })
  );
  expect(beforeMock2).toBeCalledWith(
    expect.not.objectContaining({ response: expect.anything() })
  );
  expect(lambdaMock).toBeCalledWith(
    expect.not.objectContaining({ response: expect.anything() })
  );
  expect(afterMock1).toBeCalledWith(
    expect.objectContaining({ response: mockResponse })
  );
  expect(afterMock2).toBeCalledWith(
    expect.objectContaining({ response: mockResponse })
  );
});
