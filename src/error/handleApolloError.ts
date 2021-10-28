import { ApolloErrorProcessor } from './ApolloErrorProcessor';
import { ApolloOperationContext } from '../types';
import { Vue } from 'vue/types/vue';
import { ApolloError, ApolloOperationErrorHandlerFunction } from './types';
import { ApolloErrorHandlerResultInterface } from './ApolloErrorHandlerResult';

/**
 * This is a simple example of an error handler function. You can copy this and implement your own in your application.
 */
export const handleApolloError: ApolloOperationErrorHandlerFunction<ApolloError, Vue> = (
  error: ApolloError,
  app: Vue,
  context?: ApolloOperationContext,
): ApolloErrorHandlerResultInterface => {
  const processor = new ApolloErrorProcessor(error, app, context ?? {});

  processor.showErrorNotifications();

  return {
    processedErrors: processor.processedErrors,
  };
};
