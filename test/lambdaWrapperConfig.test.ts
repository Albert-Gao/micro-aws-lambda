import { lambdas } from '../src';
import {
  getMockContext,
  getMockEvent,
  getMockHttpApiEvent,
  invokeHandler,
} from './testResources';
import * as utils from '../src/utils';

it('should return an json response with traceInfo when config.addTraceInfoToResponse sets to true [response is non-object]', async () => {
  const mockResponse = 1234;

  const testHandler = lambdas([() => mockResponse], {
    addTraceInfoToResponse: true,
  });

  const mockEvent = getMockEvent();
  const mockContext = getMockContext();
  const traceInfo = utils.createTraceInfo(mockEvent, mockContext);

  const response = await invokeHandler(testHandler, mockEvent, mockContext);

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

  const testHandler = lambdas([() => mockResponse], {
    addTraceInfoToResponse: true,
  });

  const mockEvent = getMockEvent();
  const mockContext = getMockContext();
  const traceInfo = utils.createTraceInfo(mockEvent, mockContext);

  const response = await invokeHandler(testHandler, mockEvent, mockContext);

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

it('should return an json response with HTTP API v2 traceInfo', async () => {
  const mockResponse = { message: true };

  const testHandler = lambdas([() => mockResponse], {
    addTraceInfoToResponse: true,
  });

  const mockEvent = getMockHttpApiEvent();
  const mockContext = getMockContext();
  const traceInfo = utils.createTraceInfo(mockEvent, mockContext);

  const response = await invokeHandler(testHandler, mockEvent, mockContext);

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

  const testHandler = lambdas([() => mockResponse], {
    logRequestInfo: true,
  });

  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  await invokeHandler(testHandler, mockEvent, mockContext);

  expect(logRequestInfoMock).toHaveBeenCalledTimes(1);
  expect(consoleLogMock).toHaveBeenCalledTimes(3);
  expect(consoleLogMock).toHaveBeenNthCalledWith(
    1,
    'Aws-Api-Gateway-Request-Id: ',
    mockEvent.requestContext.requestId
  );
  expect(consoleLogMock).toHaveBeenNthCalledWith(2, 'EVENT: ', mockEvent);
  expect(consoleLogMock).toHaveBeenNthCalledWith(
    3,
    'CONTEXT: ',
    expect.objectContaining({
      awsRequestId: mockContext.awsRequestId,
      functionName: mockContext.functionName,
      logGroupName: mockContext.logGroupName,
      logStreamName: mockContext.logStreamName,
    })
  );
});
