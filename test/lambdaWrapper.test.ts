// TODO: test if we can return non object

import {
  httpResponse,
  lambdaWrapper,
  Middleware,
  success,
  httpError,
} from '../src/';
import { getMockEvent, getMockContext } from './testResources';
import { HttpError } from '../src/httpResponse';
// @ts-ignore
import lambdaLocal = require('lambda-local');

describe.skip('lambdaWrapper, handler only', () => {
  it('should return an json response when returning a plain object', async () => {
    const mockResponse = { message: true };

    const handler: Middleware = () => mockResponse;

    const wrapped = lambdaWrapper({
      handler,
    });

    const response = await wrapped(getMockEvent(), getMockContext(), () => {});

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

  it('should return an json response when using success()', async () => {
    const mockResponse = { message: true };

    const handler: Middleware = () =>
      success({ statusCode: 203, body: mockResponse });

    const wrapped = lambdaWrapper({
      handler,
    });

    const response = await wrapped(getMockEvent(), getMockContext(), () => {});

    expect(response).toEqual({
      body: JSON.stringify(mockResponse),
      headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      statusCode: 203,
    });
  });

  it('should return an json response when using httpResponse()', async () => {
    const mockResponse = { message: true };

    const handler: Middleware = () =>
      httpResponse({ statusCode: 201, body: mockResponse });

    const wrapped = lambdaWrapper({
      handler,
    });

    const response = await wrapped(getMockEvent(), getMockContext(), () => {});

    expect(response).toEqual({
      body: JSON.stringify(mockResponse),
      headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      statusCode: 201,
    });
  });

  it('should return an json response when using httpResponse()', async () => {
    const mockResponse = { message: true };

    const handler: Middleware = () =>
      httpResponse({ statusCode: 201, body: mockResponse });

    const wrapped = lambdaWrapper({
      handler,
    });

    const response = await wrapped(getMockEvent(), getMockContext(), () => {});

    expect(response).toEqual({
      body: JSON.stringify(mockResponse),
      headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      statusCode: 201,
    });
  });
});

describe('lambdaWrapper - handler only', () => {
  it('should return when throwing httpError', async () => {
    const mockResponse = { message: true };

    const handler: Middleware = () => {
      throw httpError({ statusCode: 402, body: mockResponse });
    };

    const wrapped = lambdaWrapper({
      handler,
    });

    const response = ((await wrapped(
      getMockEvent(),
      getMockContext(),
      () => {}
    )) as unknown) as HttpError;

    expect(response).toBeInstanceOf(Error);
    expect(response.statusCode).toBe(402);
  });

  it('should return when return httpError', async () => {
    const mockResponse = { message: true };

    const handler: Middleware = () => {
      return httpError({ statusCode: 402, body: mockResponse });
    };

    const wrapped = lambdaWrapper({
      handler,
    });

    const response = await wrapped(getMockEvent(), getMockContext(), () => {});

    expect(response).toEqual({
      body: JSON.stringify(mockResponse),
      headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      statusCode: 402,
    });
  });

  it.only('should return when return httpError', async () => {
    const mockResponse = { message: true };

    const handler: Middleware = () => {
      return httpError({ statusCode: 402, body: mockResponse });
    };

    const wrapped = lambdaWrapper({
      handler,
    });

    const response = await wrapped(getMockEvent(), getMockContext(), () => {});

    expect(response).toEqual({
      body: JSON.stringify(mockResponse),
      headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      statusCode: 402,
    });
  });
});
