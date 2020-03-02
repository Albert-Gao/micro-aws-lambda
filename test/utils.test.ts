import { createTraceInfo } from '../src/utils';
import { getMockEvent, getMockContext } from './testResources';

// export const createTraceInfo = (
//     event: APIGatewayProxyEvent,
//     context: Context
//   ) => ({
//     endpoint: event.requestContext.domainName ?? '' + event.requestContext.path,
//     requestBody: event.body || '',
//     requestMethod: event.requestContext.httpMethod,

//     country: event.headers['CloudFront-Viewer-Country'] ?? '',
//     lambdaRequestId: context.awsRequestId,
//     logStreamName: context.logStreamName,
//     logGroupName: context.logGroupName,
//     apiGatewayId: event.requestContext.requestId,
//   });

test('createTraceInfo should set event.requestContext.domainName to empty if there is none', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  delete mockEvent.requestContext.domainName;
  const result = createTraceInfo(mockEvent, mockContext);

  expect(result.endpoint).toEqual(mockEvent.requestContext.path);
});

test('createTraceInfo should set country to empty if there is no CloudFront-Viewer-Country', () => {
  const mockEvent = getMockEvent();
  const mockContext = getMockContext();

  delete mockEvent.headers['CloudFront-Viewer-Country'];
  const result = createTraceInfo(mockEvent, mockContext);

  expect(result.country).toEqual('');
});
