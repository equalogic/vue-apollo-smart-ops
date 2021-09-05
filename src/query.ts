import { ApolloError, OperationVariables } from 'apollo-client';
import { DocumentNode } from 'graphql';
import { ErrorHandler, VueApolloQueryDefinition, VueApolloSubscribeToMoreOptions } from 'vue-apollo/types/options';
import { Vue } from 'vue/types/vue';
import { ApolloOperationErrorHandlerFunction } from './types';

type OverrideThis<F, T> = F extends (...args: infer A) => infer B ? (this: T, ...args: A) => B : F;

type OverrideAllThis<O, T> = {
  [key in keyof O]: OverrideThis<O[key], T>;
};

type SubscribeToMoreOptionsPatched<TComponent, TResult, TVariables> = OverrideAllThis<
  Omit<VueApolloSubscribeToMoreOptions<TResult, TVariables>, 'updateQuery' | 'variables'>,
  TComponent
> & {
  variables?: (this: TComponent) => any;
  updateQuery?: UpdateQueryFn<TComponent, TResult, any, any>; // TODO: How should we pass subscript data & variables types?
};

type UpdateQueryFn<TComponent = any, TResult = any, TSubscriptionVariables = any, TSubscriptionData = any> = (
  this: TComponent,
  previousQueryResult: TResult,
  options: {
    subscriptionData: {
      data: TSubscriptionData;
    };
    variables?: TSubscriptionVariables;
  },
) => TResult;

export interface VueApolloQueryDefinitionPatched<TComponent extends Vue = Vue, TResult = any, TVariables = any>
  extends OverrideAllThis<
    Omit<VueApolloQueryDefinition<TResult, TVariables>, 'subscribeToMore' | 'variables' | 'loadingKey'>,
    TComponent
  > {
  variables?: ((this: TComponent) => TVariables) | TVariables;
  subscribeToMore?:
    | SubscribeToMoreOptionsPatched<TComponent, TResult, TVariables>
    | Array<SubscribeToMoreOptionsPatched<TComponent, TResult, TVariables>>;
  loadingKey?: keyof TComponent;
}

export type VueApolloSmartQueryErrorHandler<
  TResult = any,
  TVariables = OperationVariables,
  TError = ApolloError,
  TComponent extends Vue = Vue
> = (
  error: TError,
  vm: TComponent,
  key: string,
  type: 'query',
  options: VueApolloSmartQueryOptions<TResult, TVariables, TError, TComponent>,
) => void;

export type VueApolloSmartQueryOptions<
  TResult = any,
  TVariables = OperationVariables,
  TError = ApolloError,
  TComponent extends Vue = Vue
> = VueApolloQueryDefinitionPatched<TComponent, TResult, TVariables> & {
  error?: VueApolloSmartQueryErrorHandler<TResult, TVariables, TError, TComponent>;
};

export type VueApolloSmartQueryOptionsFunction<TResult, TVariables, TError = ApolloError, TApp extends Vue = Vue> = <
  TComponent extends Vue = TApp
>(
  options?: Partial<Omit<VueApolloSmartQueryOptions<TResult, TVariables, TError, TComponent>, 'query'>>,
) => VueApolloSmartQueryOptions<TResult, TVariables, TError, TComponent>;

export function createSmartQueryOptionsFunction<TResult, TVariables, TError = ApolloError, TApp extends Vue = Vue>(
  query: DocumentNode,
  onError?: ApolloOperationErrorHandlerFunction<TError, TApp>,
): VueApolloSmartQueryOptionsFunction<TResult, TVariables> {
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
