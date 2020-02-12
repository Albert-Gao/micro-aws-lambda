import {
  funcQueueExecutor,
  addExtraInfoToError,
  createTraceInfo,
  addTraceInfoToJsonString,
  logRequestInfo,
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
    if (config?.logRequestInfo) {
      logRequestInfo(event, context);
    }

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
        addExtraInfoToError(event, context, newError);
      }

      return newError;
    }
  };

  return wrapperHandler;
};
