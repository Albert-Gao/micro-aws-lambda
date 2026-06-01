import { createTraceInfo, logRequestInfo } from '../src/utils';
import {
  getMockEvent,
  getMockHttpApiEvent,
  getMockContext,
} from './testResources';

test('createTraceInfo should set event.requestContext.domainName to empty if there is none', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  delete mockEvent.requestContext.domainName;
  const result = createTraceInfo(mockEvent, mockContext);

  expect(result.endpoint).toEqual(mockEvent.requestContext.path);
});

test('createTraceInfo should include domain and path in endpoint for v1 events', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();
  const result = createTraceInfo(mockEvent, mockContext);

  expect(result.endpoint).toEqual(
    `${mockEvent.requestContext.domainName}${mockEvent.requestContext.path}`
  );
});

test('createTraceInfo should set country to empty if there is no CloudFront-Viewer-Country', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  delete mockEvent.headers['CloudFront-Viewer-Country'];
  const result = createTraceInfo(mockEvent, mockContext);

  expect(result.country).toEqual('');
});

test('createTraceInfo should read CloudFront-Viewer-Country case-insensitively', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  delete mockEvent.headers['CloudFront-Viewer-Country'];
  mockEvent.headers['cloudfront-viewer-country'] = 'AU';

  const result = createTraceInfo(mockEvent, mockContext);

  expect(result.country).toEqual('AU');
});

test('createTraceInfo should set country to empty when headers are absent', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  mockEvent.headers = undefined as any;

  const result = createTraceInfo(mockEvent, mockContext);

  expect(result.country).toEqual('');
});

test('createTraceInfo should set country to empty when the header value is absent', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  mockEvent.headers['CloudFront-Viewer-Country'] = undefined;

  const result = createTraceInfo(mockEvent, mockContext);

  expect(result.country).toEqual('');
});

test('createTraceInfo should set v1 path to empty if there is none', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  mockEvent.requestContext.path = undefined as any;

  const result = createTraceInfo(mockEvent, mockContext);

  expect(result.endpoint).toEqual(mockEvent.requestContext.domainName);
});

test('createTraceInfo should include v2 route, request id, method, path, and domain', () => {
  const mockEvent = getMockHttpApiEvent();
  const mockContext = getMockContext();

  const result = createTraceInfo(mockEvent, mockContext);

  expect(result).toEqual({
    endpoint: `${mockEvent.requestContext.domainName}${mockEvent.requestContext.http.path}`,
    routeKey: mockEvent.requestContext.routeKey,
    requestBody: mockEvent.body,
    requestMethod: mockEvent.requestContext.http.method,
    requestId: mockEvent.requestContext.requestId,
    requestPath: mockEvent.requestContext.http.path,
    domainName: mockEvent.requestContext.domainName,
  });
});

test('createTraceInfo should use empty v2 fallback values', () => {
  const mockEvent = getMockHttpApiEvent();
  const mockContext = getMockContext();

  mockEvent.requestContext.domainName = undefined as any;
  mockEvent.requestContext.http.path = undefined as any;
  mockEvent.body = undefined;

  const result = createTraceInfo(mockEvent, mockContext);

  expect(result).toEqual({
    endpoint: '',
    routeKey: mockEvent.requestContext.routeKey,
    requestBody: '',
    requestMethod: mockEvent.requestContext.http.method,
    requestId: mockEvent.requestContext.requestId,
    requestPath: '',
    domainName: '',
  });
});

test('logRequestInfo should redact sensitive headers and support an injectable logger', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();
  const logger = { log: jest.fn() };

  logRequestInfo(mockEvent, mockContext, logger);

  expect(logger.log).toHaveBeenCalledTimes(3);
  expect(logger.log).toHaveBeenNthCalledWith(
    2,
    'EVENT: ',
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: '[REDACTED]',
      }),
      multiValueHeaders: expect.objectContaining({
        Authorization: '[REDACTED]',
      }),
    })
  );
});

test('logRequestInfo should support v2 events without multiValueHeaders', () => {
  const mockEvent = getMockHttpApiEvent();
  const mockContext = getMockContext();
  const logger = { log: jest.fn() };

  logRequestInfo(mockEvent, mockContext, logger);

  expect(logger.log).toHaveBeenCalledWith(
    'EVENT: ',
    expect.not.objectContaining({
      multiValueHeaders: expect.anything(),
    })
  );
});

test('logRequestInfo should preserve absent headers', () => {
  const mockEvent = getMockHttpApiEvent();
  const mockContext = getMockContext();
  const logger = { log: jest.fn() };

  mockEvent.headers = undefined as any;

  logRequestInfo(mockEvent, mockContext, logger);

  expect(logger.log).toHaveBeenCalledWith(
    'EVENT: ',
    expect.objectContaining({
      headers: undefined,
    })
  );
});
