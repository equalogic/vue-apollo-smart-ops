import { VueApolloQueryDefinition, ErrorHandler } from 'vue-apollo/types/options';
import { ApolloError, OperationVariables } from 'apollo-client';
import { DocumentNode } from 'graphql';
import { Vue } from 'vue/types/vue';
import { ApolloOperationErrorHandlerFunction } from './types';

export type VueApolloSmartQueryErrorHandler<
  TResult = any,
  TVariables = OperationVariables,
  TError = ApolloError,
  TApp extends Vue = Vue
> = (
  error: TError,
  vm: TApp,
  key: string,
  type: 'query',
  options: VueApolloSmartQueryOptions<TResult, TVariables, TError, TApp>,
) => void;

// Type of VueApolloQueryDefinition['subscribeToMore'] is incompatible with generated QueryVariables types.
// Omitting it here since we don't use it anyway.
export type VueApolloSmartQueryOptions<
  TResult = any,
  TVariables = OperationVariables,
  TError = ApolloError,
  TApp extends Vue = Vue
> = Omit<VueApolloQueryDefinition<TResult, TVariables>, 'subscribeToMore' | 'error'> & {
  error?: VueApolloSmartQueryErrorHandler<TResult, TVariables, TError, TApp>;
};

export function createSmartQueryOptionsFunction<TResult, TVariables, TError = ApolloError, TApp extends Vue = Vue>(
  query: DocumentNode,
  onError?: ApolloOperationErrorHandlerFunction<TError, TApp>,
): (
  options?: Partial<VueApolloSmartQueryOptions<TResult, TVariables, TError, TApp>>,
) => VueApolloQueryDefinition<TResult, TVariables> {
  return (options = {}) => {
    const defaultErrorHandlerFn: VueApolloSmartQueryErrorHandler<TResult, TVariables, TError, TApp> = (
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
        ((options.error as unknown) as ErrorHandler | undefined) ?? onError !== undefined
          ? ((defaultErrorHandlerFn as unknown) as ErrorHandler)
          : undefined,
    };
  };
}
