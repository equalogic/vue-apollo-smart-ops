import { ApolloErrorProcessor } from './ApolloErrorProcessor';
import {
  ApolloError,
  ApolloErrorHandlerResult,
  ApolloOperationContext,
  ApolloOperationErrorHandlerFunction,
} from '../types';
import { Vue } from 'vue/types/vue';

/**
 * This is a simple example of an error handler function. You can copy this and implement your own in your application.
 */
export const handleApolloError: ApolloOperationErrorHandlerFunction<ApolloError, Vue> = (
  error: ApolloError,
  app: Vue,
  context?: ApolloOperationContext,
): ApolloErrorHandlerResult => {
  const processor = new ApolloErrorProcessor(error, app, context ?? {});

  processor.showErrorNotifications();

  return {
    processedErrors: processor.processedErrors,
  };
};
