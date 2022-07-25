import { processApolloError } from './processApolloError';
import { ApolloOperationContext } from '../types';
import type { App as Vue } from '@vue/runtime-core';
import { ApolloError, ApolloOperationErrorHandlerFunction } from './types';
import { ApolloErrorHandlerResult } from './ApolloErrorHandlerResult';

/**
 * This is a simple example of an error handler function. You can copy this and implement your own in your application.
 */
export const handleApolloError: ApolloOperationErrorHandlerFunction<
  ApolloError,
  Vue,
  ApolloOperationContext,
  ApolloErrorHandlerResult
> = (error: ApolloError, app: Vue, context?: ApolloOperationContext): ApolloErrorHandlerResult => {
  const { unhandledErrors, handledErrors } = processApolloError(error, {
    app,
    context,
    // Example of a handler function for a particular type of error:
    onUnauthorizedError: error => {
      console.warn('Unauthorized! Logging you out...', error);
      //logout();

      // Returning true indicates to the processor that we've handled this error
      return true;
    },
  });

  unhandledErrors.forEach(error => {
    console.error(`${error.type}: ${error.message}`, error.error);
  });

  return new ApolloErrorHandlerResult(unhandledErrors, handledErrors);
};
