// TODO: test if we can return non object
import { lambdaWrapper } from '../src';
import { getMockContext, getMockEvent } from './testResources';
import * as utils from '../src/utils';
const LambdaTester = require('lambda-tester');

it('should return an json response with traceInfo when config.addTraceInfoToResponse sets to true [response is non-object]', async () => {
  const mockResponse = 1234;

  const testHandler = lambdaWrapper({
    handler: () => mockResponse,
    config: {
      addTraceInfoToResponse: true,
    },
  });

  const mockEvent = getMockEvent();
  const mockContext = getMockContext();
  const traceInfo = utils.createTraceInfo(mockEvent, mockContext);

  const response = await LambdaTester(testHandler)
    .event(mockEvent)
    .context(mockContext)
    .expectResult();

  expect(response).toEqual({
    body: JSON.stringify({ response: mockResponse, debug: traceInfo }),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  });
});

it('should return an json response with traceInfo when config.addTraceInfoToResponse sets to true [response is object]', async () => {
  const mockResponse = { message: true };

  const testHandler = lambdaWrapper({
    handler: () => mockResponse,
    config: {
      addTraceInfoToResponse: true,
    },
  });

  const mockEvent = getMockEvent();
  const mockContext = getMockContext();
  const traceInfo = utils.createTraceInfo(mockEvent, mockContext);

  const response = await LambdaTester(testHandler)
    .event(mockEvent)
    .context(mockContext)
    .expectResult();

  expect(response).toEqual({
    body: JSON.stringify({ ...mockResponse, debug: traceInfo }),
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  });
});

it('should log when config.logRequestInfo sets to true', async () => {
  const mockResponse = { message: true };
  const logRequestInfoMock = jest.spyOn(utils, 'logRequestInfo');
  const consoleLogMock = jest.spyOn(global.console, 'log');

  const testHandler = lambdaWrapper({
    handler: () => mockResponse,
    config: {
      logRequestInfo: true,
    },
  });

  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  await LambdaTester(testHandler)
    .event(mockEvent)
    .context(mockContext)
    .expectResult();

  expect(logRequestInfoMock).toBeCalledTimes(1);
  expect(consoleLogMock).toBeCalledTimes(4);
  expect(consoleLogMock).toHaveBeenNthCalledWith(
    1,
    'Aws-Api-Gateway-Request-Id: ',
    mockEvent.requestContext.requestId
  );
  expect(consoleLogMock).toHaveBeenNthCalledWith(
    2,
    'Identity-Source-Ip: ',
    mockEvent.requestContext?.identity?.sourceIp
  );
  expect(consoleLogMock).toHaveBeenNthCalledWith(3, 'EVENT: ', mockEvent);
  expect(consoleLogMock).toHaveBeenNthCalledWith(
    4,
    'CONTEXT: ',
    expect.objectContaining(mockContext)
  );
});
