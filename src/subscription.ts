import { ErrorHandler, VueApolloSubscriptionDefinition } from '@vue/apollo-option/types/options';
import { ApolloError, OperationVariables } from '@apollo/client/core';
import { DocumentNode } from 'graphql';
import type { App as Vue } from '@vue/runtime-core';
import { ApolloOperationErrorHandlerFunction } from './error';

export type VueApolloSmartSubscriptionErrorHandler<
  TResult = any,
  TVariables = OperationVariables,
  TError = ApolloError,
  TApp extends Vue = Vue,
> = (
  error: TError,
  vm: TApp,
  key: string,
  type: 'subscription',
  options: VueApolloSmartSubscriptionOptions<TResult, TVariables, TError, TApp>,
) => void;

export type VueApolloSmartSubscriptionOptions<
  TResult = any,
  TVariables = OperationVariables,
  TError = ApolloError,
  TApp extends Vue = Vue,
> = Omit<VueApolloSubscriptionDefinition<TVariables>, 'error'> & {
  error?: VueApolloSmartSubscriptionErrorHandler<TResult, TVariables, TError, TApp>;
};

export function createSmartSubscriptionOptionsFunction<
  TResult,
  TVariables,
  TError = ApolloError,
  TApp extends Vue = Vue,
>(
  query: DocumentNode,
  onError?: ApolloOperationErrorHandlerFunction<TError, TApp>,
): (
  options?: Partial<VueApolloSmartSubscriptionOptions<TResult, TVariables, TError, TApp>>,
) => VueApolloSubscriptionDefinition<TVariables> {
  return (options = {}) => {
    const defaultErrorHandlerFn: VueApolloSmartSubscriptionErrorHandler<TResult, TVariables, TError, TApp> = (
      error: TError,
      vm: TApp,
      key,
      type,
      options,
    ): void => {
      onError!(error, vm, {
        queryKey: key,
        queryType: type,
        queryOptions: options,
      });
    };

    return {
      query,
      ...options,
      error:
        // we have to override vue-apollo types because they are incorrect
        (options.error as unknown as ErrorHandler | undefined) ?? onError !== undefined
          ? (defaultErrorHandlerFn as unknown as ErrorHandler)
          : undefined,
    };
  };
}
