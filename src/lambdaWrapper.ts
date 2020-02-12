import {
  funcQueueExecutor,
  addExtraInfoToError,
  createTraceInfo,
  addTraceInfoToJsonString,
} from './utils';
import { LambdaWrapperParams, LambdaHandler } from 'types';
import { success, isHttpResponse } from './httpResponse';

export const lambdaWrapper = ({
  handler,
  beforeHooks,
  afterHooks,
  config,
}: LambdaWrapperParams) => {
  const wrapperHandler: LambdaHandler = async (event, context, _) => {
    try {
      const response = await funcQueueExecutor(
        event,
        context,
        beforeHooks,
        handler,
        afterHooks
      );

      if (isHttpResponse(response)) {
        if (config?.addTraceInfoToResponse) {
          response.body = addTraceInfoToJsonString(
            response.body,
            event,
            context
          );
        }

        return response;
      }

      if (config?.addTraceInfoToResponse) {
        response.debug = createTraceInfo(event, context).debug;
      }

      return success({ body: response });
    } catch (error) {
      console.log(error);

      let newError = error;

      if (config?.addTraceInfoToResponse) {
        addExtraInfoToError(newError, context, event);
      }

      if (config?.logRequestInfo) {
        console.log('EVENT: ', event);
        console.log('CONTEXT: ', context);
        console.log(
          'Aws-Api-Gateway-Request-Id: ',
          event.requestContext.requestId
        );
        console.log(
          'Identity-Source-Ip: ',
          event.requestContext.identity.sourceIp
        );
      }

      return newError;
    }
  };

  return wrapperHandler;
};
