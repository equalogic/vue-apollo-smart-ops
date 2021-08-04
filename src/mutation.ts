import { ApolloError, MutationOptions, OperationVariables } from 'apollo-client';
import { DocumentNode } from 'graphql';
import { ClientOptions, DollarApollo } from 'vue-apollo/types/vue-apollo';
import { FetchResult } from 'apollo-link';
import { FetchPolicy, MutationBaseOptions } from 'apollo-client/core/watchQueryOptions';
import { Vue } from 'vue/types/vue';
import mapValues from 'lodash.mapvalues';
import isPlainObject from 'lodash.isplainobject';
import {
  ApolloErrorHandlerResult,
  ApolloOperationContext,
  ApolloOperationErrorHandlerFunction,
  ProcessedApolloError,
  ValidationRuleViolation,
} from './types';

export type ApolloComponentMutationFunction<R = any, TVariables = OperationVariables> = (
  options: MutationBaseOptions<R, TVariables> &
    ClientOptions & { mutation?: DocumentNode; context?: any; fetchPolicy?: FetchPolicy },
) => Promise<FetchResult<R>>;

export type ApolloClientMutationFunction<R = any, TVariables = OperationVariables> = (
  options: MutationOptions<R, TVariables> & ClientOptions,
) => Promise<FetchResult<R>>;

export type VueAppWithApollo = Vue & { $apollo: DollarApollo<any> };

// The client can be an instance of DollarApollo (this.$apollo) or a `mutate()` function from <ApolloMutation> scope
export type ApolloMutationClient<TResult, TVariables extends OperationVariables> =
  | ApolloComponentMutationFunction<TResult, TVariables>
  | { mutate: ApolloClientMutationFunction<TResult, TVariables>; [key: string]: any };

// Mutation function with typings
export type MutationOperationFunction<TResult, TVariables extends OperationVariables, TError = ApolloError> = (
  app: VueAppWithApollo,
  params: Omit<MutationOperationParams<TVariables, TError>, 'mutation'>,
  client?: ApolloMutationClient<TResult, TVariables>,
) => Promise<MutationResult<TResult>>;

// Parameters given to a MutationOperationFunction
export interface MutationOperationParams<
  TVariables extends OperationVariables,
  TError = ApolloError,
  TContext = ApolloOperationContext
> {
  mutation: DocumentNode;
  variables: TVariables;
  context?: TContext;
  onError?: ApolloOperationErrorHandlerFunction<TError>;
}

// Result object returned by a MutationOperationFunction
export interface MutationResult<TData> {
  success: boolean;
  data?: TData | null;
  errors?: ProcessedApolloError[];
  validationRuleViolations?: ValidationRuleViolation[];
}

/**
 * Accepts a plain object containing user input, and cleans any string fields by:
 *
 * 1) trimming whitespace, and then
 * 2) replacing empty strings with null
 *
 * It will recurse through any nested objects.
 */
export function cleanInput<T extends Record<string, any>>(input: T): T {
  return mapValues(input, value => {
    if (typeof value === 'string') {
      return value.trim().length > 0 ? value.trim() : null;
    }

    if (isPlainObject(value)) {
      return cleanInput(value);
    }

    return value;
  });
}

export async function mutateWithErrorHandling<
  TResult,
  TVariables extends OperationVariables,
  TError,
  TApp extends VueAppWithApollo = VueAppWithApollo
>(
  app: TApp,
  { mutation, variables, onError, context }: MutationOperationParams<TVariables, TError>,
  client?: ApolloMutationClient<TResult, TVariables>,
): Promise<MutationResult<TResult>> {
  const mutate =
    client === undefined
      ? app.$apollo.mutate.bind(app.$apollo)
      : typeof client === 'function'
      ? client
      : client.mutate.bind(client);

  try {
    const result = await mutate({
      mutation,
      variables: cleanInput(variables),
    });

    if (result == null) {
      return { success: false };
    }

    return { success: true, data: result.data };
  } catch (error) {
    const errorHandlerResult: ApolloErrorHandlerResult | undefined =
      onError != null ? onError(error, app, context) : undefined;

    return {
      success: false,
      errors: errorHandlerResult?.processedErrors,
      validationRuleViolations: errorHandlerResult?.validationRuleViolations,
    };
  }
}

export function createMutationFunction<
  TResult,
  TVariables extends OperationVariables,
  TError = ApolloError,
  TApp extends VueAppWithApollo = VueAppWithApollo
>(
  mutation: DocumentNode,
  onError?: ApolloOperationErrorHandlerFunction<TError, TApp>,
): MutationOperationFunction<TResult, TVariables, TError> {
  return (
    app: TApp,
    params: Omit<MutationOperationParams<TVariables, TError>, 'mutation'>,
    client?: ApolloMutationClient<TResult, TVariables>,
  ): Promise<MutationResult<TResult>> => {
    return mutateWithErrorHandling(
      app,
      {
        mutation,
        variables: params.variables,
        onError: params.onError ?? onError,
        context: params.context,
      },
      client,
    );
  };
}
